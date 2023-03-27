import os
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
import torchvision

from shapely import wkt
from rasterio.features import shapes
from torch.utils.data import DataLoader, Dataset
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


def process_image_ice(model_path, img, output_img_path, img_vv):
    transform = A.Compose([A.Resize(256, 256, p=1.0, interpolation=3)])

    img = np.asarray(img).transpose((1, 2, 0))
    img = transform(image=img)['image']
    img = np.transpose(img, (2, 0, 1))

    img = new_normalize(img, plural=True)
    img = stand(img, single_stand=True)
    to_pil = (img[:3].transpose((1, 2, 0)) * 255).astype(np.uint8)
    PIL.Image.fromarray(to_pil).show()

    model = smp.DeepLabV3(
        encoder_name="timm-mobilenetv3_small_075",
        encoder_weights=None,
        in_channels=4,
        classes=6,
    ).to('cpu', dtype=torch.float32)
    state_dict = torch.load(model_path, map_location=torch.device('cpu'))['model_state_dict']
    model.load_state_dict(state_dict)

    dataset = InferDataset(output_img_path.split("outputs")[0] + "inputs",
                           os.listdir(output_img_path.split("outputs")[0] + "inputs")[0])
    dataloader = DataLoader(dataset, batch_size=1, collate_fn=coll_fn, shuffle=False)

    inputs = next(iter(dataloader))
    inputs = inputs.to('cpu')
    model.eval()
    outputs = model(inputs)
    y_pred = np.array(torch.argmax(outputs, dim=1).cpu())

    y_pred[y_pred < 2] = 0
    y_pred[y_pred == 5] = 0
    y_pred[y_pred != 0] = 1
    pred_to_pil = y_pred[0].astype(np.uint8)
    print(pred_to_pil.shape)
    PIL.Image.fromarray(pred_to_pil).show()

    profile = img_vv.profile
    profile["count"] = 1
    with rasterio.open(output_img_path, 'w', **profile) as src:
        src.write(pred_to_pil, 1)


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
            return *save_gj(url, path, mp, image_name.split('.')[0] + '_' + list(colors.keys())[i]), mp


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
                SET status = %s, url = %s, url2 = %s, finished_at = %s, result = %s, result2 = %s, bbox = %s, diff = %s
                WHERE id = %s"""
        record = (
            order["status"],
            order["url"],
            order["url2"],
            order["finished_at"],
            order["result"],
            order["result2"],
            order["bbox"],
            order["diff"],
            order["order_id"],
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


# -----------------------------------------------------------------------------------------------------------------


def save_t(full_name, im, prof):
    with rasterio.open(full_name, 'w', **prof) as src:
        src.write(im)


def item_getter(path: str, file_name: str, transforms=A.Compose([
    A.CenterCrop(256, 256, p=1.0, always_apply=False),
    # albumentations.Resize(fin_res, fin_res, p=1.0, interpolation=0)
]), val=False) -> (np.ndarray, np.ndarray):
    i_ = 'val_' if val else ''
    image = rasterio.open(path + '/input_ice.tiff', 'r').read()

    img = image.transpose((1, 2, 0))
    augmented = transforms(image=img)
    image = A.Compose([A.Resize(256, 256, p=1.0, interpolation=3)])(image=augmented['image'])['image']
    image = image.transpose((2, 0, 1))

    assert not np.any(np.isnan(image))
    return image


def coll_fn(batch_):
    ims_, labels_ = [], []
    for _, sample in enumerate(batch_):
        im = sample
        ims_.append(torch.from_numpy(im.copy()))
    return torch.stack(ims_, 0).type(torch.FloatTensor)


def new_normalize(im_: np.ndarray, single_norm=False, plural=False) -> np.ndarray:
    im_ = np.nan_to_num(im_)
    mean = np.array([-16.388807, -16.38885, -30.692194, -30.692194])
    std = np.array([5.6070476, 5.6069245, 8.395209, 8.395208])
    if plural:
        mean = np.array([-14.227491, -14.227545, -27.108353, -27.108353])
        std = np.array([5.096121, 5.0959415, 8.973816, 8.973816])

    if single_norm:
        mean, std = np.zeros(im_.shape[0]), np.zeros(im_.shape[0])
        for channel in range(im_.shape[0]):
            mean[channel] = np.mean(im_[channel, :, :])
            std[channel] = np.std(im_[channel, :, :])

    norm = torchvision.transforms.Normalize(mean, std)
    return np.asarray(norm.forward(torch.from_numpy(im_)))


def stand(im_: np.ndarray, single_stand=False) -> np.ndarray:
    im_ = np.nan_to_num(im_)
    min_ = np.array([-49.44221, -49.44221, -49.679745, -49.679745])
    max_ = np.array([16.50119, 15.677849, 2.95751, 2.9114623])
    if single_stand:
        min_, max_ = np.zeros(im_.shape[0]), np.zeros(im_.shape[0])
        for channel in range(im_.shape[0]):
            min_[channel] = np.min(im_[channel, :, :])
            max_[channel] = np.max(im_[channel, :, :])

    for channel in range(im_.shape[0]):
        im_[channel] = (im_[channel] - min_[channel]) / (max_[channel] - min_[channel])
    return im_


class InferDataset(Dataset):
    def __init__(self, path, file_n):
        self.path = path
        self.data_list = [file_n]

    def __len__(self):
        return len(self.data_list)

    def __getitem__(self, index):
        f_name = self.data_list[index]
        image = item_getter(self.path, f_name, val=False)
        return image
