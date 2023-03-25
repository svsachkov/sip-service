from vectorize import vectorize

import sys

url = sys.argv[1].replace('jpeg', 'tiff')
order_id = sys.argv[2]
# url = 'http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&CRS' \
#       '=EPSG:3857&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT' \
#       '=image/tiff&TIME=2018-03-29/2018-05-29&GEOMETRY=POLYGON((1089372.5680352768 3990882.3458559057,' \
#       '1155769.285697225 3990882.3458559057,1155769.285697225 4066966.6497494457,1089372.5680352768 ' \
#       '4066966.6497494457,1089372.5680352768 3990882.3458559057))' \
#     .replace('jpeg', 'tiff')
#order_id = '89f4fd0b-6945-45d7-aab2-18f064383185'
model_name = 'water'

model_path = f'src/main/python/models/{model_name}.pt'
input_img_path = f'src/main/python/images/inputs/input_{model_name}.tiff'
output_img_path = f'src/main/python/images/outputs/output_{model_name}.tiff'

import requests

x = requests.get(url)
# Save input image:
with open(input_img_path, 'wb') as f:
    f.write(x.content)

import torch
import rasterio
import PIL.Image
import numpy as np
import albumentations as A
from SegmentationModel import SegmentationModel

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

result = vectorize()

# ------------------------------------DATABASE-----------------------------------------------------

import psycopg2
import datetime

try:
    connection = psycopg2.connect(user="postgres",
                                  password="3172",
                                  host="127.0.0.1",
                                  port="5432",
                                  database="data")
    cursor = connection.cursor()

    q = """UPDATE orders
                SET status = %s, url = %s, finished_at = %s, result = %s
                WHERE id = %s"""
    record = ("true", url, datetime.datetime.now(), result, order_id)

    cursor.execute(q, record)

    connection.commit()
    count = cursor.rowcount
    print(count, "Record inserted successfully into mobile table")

except (Exception, psycopg2.Error) as error:
    print("Failed to insert record into mobile table", error)

finally:
    # closing database connection.
    if connection:
        cursor.close()
        connection.close()
        print("PostgreSQL connection is closed")

# import requests
#
# user = {
#       "username": "python",
#       "password": "admin",
#       "name": "Python",
#       "surname": "Python",
#       "patronymic": "Python"
# }

# headers = {"Accept": 'application/json', "Content-type": 'application/json'}
# request = requests.post('http://localhost:8000/register', headers=headers, json=user)
