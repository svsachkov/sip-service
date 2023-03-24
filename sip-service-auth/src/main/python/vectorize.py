import shapely
import PIL
import torch
from PIL import Image
import numpy as np
# from varname import nameof
import warnings
import os
from os import listdir
from shapely.geometry import Polygon, MultiPolygon
import geopandas as gpd
from shapely.ops import cascaded_union, unary_union
import rasterio
from rasterio.features import shapes, rasterize
from tqdm import tqdm

warnings.filterwarnings("ignore")
colors = {
    'white': 1.0,
}


def RasterioGeo(bytestream, mask):
    geom_all = []
    with rasterio.open(bytestream) as dataset:
        for geom, val in shapes(mask, transform=dataset.transform):
            if val != 0.0:
                geom_all.append(rasterio.warp.transform_geom(dataset.crs, 'EPSG:4326', geom))  # , precision=6
        return geom_all


def t(lst: list):
    return shapely.Polygon([(k[0], k[1]) for k in [j for j in lst[0]]])


def save_gj(p, c):
    sp = path.replace('p/', '')
    gpd.GeoSeries(p).to_file(f"{sp}{c}.geojson", driver='GeoJSON', show_bbox=False)  # , crs="EPSG:4326"


def to_pol(j):
    return t(j['coordinates'])


path = ''
for image_name in ['images/outputs/output.tiff']:
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

        polygons = [to_pol(p) for p in RasterioGeo(path + image_name, mask_3d)]
        if len(polygons) == 0:
            print('no suitable polygons left')
            continue

        mp = shapely.MultiPolygon(polygons)
        save_gj(mp, image_name.split('.')[0] + '_' + list(colors.keys())[i])
