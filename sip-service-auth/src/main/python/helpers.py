import torch
import shapely
import rasterio
import requests
import psycopg2
import warnings
import PIL.Image

import numpy as np
import torch.nn as nn
import geopandas as gpd
import albumentations as A
import segmentation_models_pytorch as smp

from shapely import wkt
from rasterio.features import shapes
from segmentation_models_pytorch.losses import DiceLoss


# -------------------HELPERS-HELPERS-HELPERS-HELPERS-HELPERS-HELPERS-HELPERS-HELPERS-HELPERS-HELPERS------------------

def load_and_save_image(url, path):
    x = requests.get(url)

    with open(path, 'wb') as f:
        f.write(x.content)

    return x.content


def process_image(model_path, input_img_path, output_img_path):
    sat_img = rasterio.open(input_img_path, 'r')
    profile = sat_img.profile
    profile['count'] = 1
    transform = A.Compose([A.Resize(256, 256, p=1.0, interpolation=3)])

    img = rasterio.open(input_img_path, 'r').read()
    img = np.asarray(img)[:3].transpose((1, 2, 0))
    PIL.Image.fromarray(img).show()
    img = transform(image=img)['image']
    img = np.transpose(img, (2, 0, 1))
    img = img / 255.0
    img = torch.tensor(img)

    model = SegmentationModel()
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    logits_mask = model(img.to('cpu', dtype=torch.float32).unsqueeze(0))
    pred_mask = torch.sigmoid(logits_mask)
    pred_mask = (pred_mask.squeeze(0) > 0.6) * 1.0

    # Save output image:
    with rasterio.open(output_img_path, 'w', **profile) as src:
        src.write(pred_mask)


# ---------VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE-VECTORIZE--------

def rasterio_geo(bytestream, mask):
    geom_all = []
    with rasterio.open(bytestream) as dataset:
        for geom, val in shapes(mask, transform=dataset.transform):
            if val != 0.0:
                geom_all.append(rasterio.warp.transform_geom(dataset.crs, 'EPSG:3857', geom))  # , precision=6
        return geom_all


def t(lst: list):
    return shapely.Polygon([(k[0], k[1]) for k in [j for j in lst[0]]])


def save_gj(url, path, p, c):
    sp = path.replace('p/', '')
    a = gpd.GeoSeries(p).to_json()

    p2 = wkt.loads(url.split('GEOMETRY=')[1])
    b = gpd.GeoSeries(p2).to_json()
    result = b.split("bbox\": [")[1].split("]")[0]

    gpd.GeoSeries(p).to_file(f"{sp}{c}.json", driver='GeoJSON', show_bbox=False)  # , crs="EPSG:4326"
    return a, result


def to_pol(j):
    return t(j['coordinates'])


def vectorize(url, output_img_path):
    path = ''
    warnings.filterwarnings("ignore")
    colors = {
        'white': 1.0,
    }
    for image_name in [output_img_path]:
        image = rasterio.open(path + image_name, 'r')
        im_arr = np.asarray(image.read()).transpose((1, 2, 0))

        masks = [im_arr.reshape(im_arr.shape[:2])]
        for i in range(len(colors)):
            mask_2d = masks[i]

            h, w = mask_2d.shape
            mask_3d = np.zeros((h, w), dtype='uint8')
            mask_3d[mask_2d[:, :] > 0.5] = 255
            if np.sum(mask_3d) == 0:
                print('no such colour: ' + list(colors.keys())[i])
                continue

            # Image.fromarray(np.uint8(mask_3d)).show()

            polygons = [to_pol(p) for p in rasterio_geo(path + image_name, mask_3d)]
            if len(polygons) == 0:
                print('no suitable polygons left')
                continue

            mp = shapely.MultiPolygon(polygons)
            return save_gj(url, path, mp, image_name.split('.')[0] + '_' + list(colors.keys())[i])


# -----------DATABASE-DATABASE-DATABASE-DATABASE-DATABASE-DATABASE-DATABASE-DATABASE-DATABASE-DATABASE----------

def save_order_result_to_database(db, order):
    try:
        connection = psycopg2.connect(
            user=db["user"],
            password=db["password"],
            host=db["host"],
            port=db["port"],
            database=db["database"]
        )
        cursor = connection.cursor()

        q = """UPDATE orders
                SET status = %s, url = %s, url2 = %s, finished_at = %s, result = %s, result2 = %s, bbox = %s
                WHERE id = %s"""
        record = (
            order["status"],
            order["url"],
            order["url2"],
            order["finished_at"],
            order["result"],
            order["result2"],
            order["bbox"],
            order["order_id"]
        )
        cursor.execute(q, record)
        connection.commit()

    except (Exception, psycopg2.Error) as error:
        print("Failed to insert record into mobile table", error)

    finally:
        # closing database connection.
        if connection is not None and connection:
            cursor.close()
            connection.close()


# -----------------------MODELS-MODELS-MODELS-MODELS-MODELS-MODELS-MODELS-MODELS-MODELS-MODELS----------------------

class SegmentationModel(nn.Module):
    def __init__(self):
        super(SegmentationModel, self).__init__()

        self.arc = smp.Unet(
            encoder_name='resnet50',
            encoder_weights='imagenet',
            in_channels=3,
            classes=1,
            activation=None
        )

    def forward(self, images, masks=None):
        logits = self.arc(images)

        if masks is not None:
            loss1 = DiceLoss(mode='binary')(logits, masks)
            loss2 = nn.BCEWithLogitsLoss()(logits, masks)
            return logits, loss1, loss2
        return logits
