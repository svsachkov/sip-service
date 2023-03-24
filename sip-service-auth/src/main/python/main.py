import PIL.Image
import rasterio
import torch
import requests
import numpy as np
from PIL import Image
from io import BytesIO
import albumentations as A
from torchvision.utils import save_image
from SegmentationModel import SegmentationModel

if __name__ == '__main__':
    # Parameters:
    URL = "https://services.sentinel-hub.com/ogc"
    SERVICE = "wms"
    INSTANCE_ID = "cbe156b7-660c-4640-a5a1-ea774aecf9ce"
    REQUEST = "GetMap"
    BBOX = "3238005,5039853,3244050,5045897"
    LAYERS = "NATURAL-COLOR&MAXCC=20"
    WIDTH = "256"
    HEIGHT = "256"
    FORMAT = "image/tiff"
    TIME = "2018-03-29/2018-05-29"

    url = f'{URL}/{SERVICE}/{INSTANCE_ID}?' \
          f'REQUEST={REQUEST}&' \
          f'BBOX={BBOX}&' \
          f'LAYERS={LAYERS}&' \
          f'WIDTH={WIDTH}&HEIGHT={HEIGHT}&' \
          f'FORMAT={FORMAT}&' \
          f'TIME={TIME}'
    #url = "http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/tiff&TIME=2018-03-29/2018-05-29&GEOMETRY=POLYGON((-6531326.723977071 -4126551.186669888,-6469662.499631802 -4126551.186669888,-6469662.499631802 -4085160.6581025296,-6531326.723977071 -4085160.6581025296,-6531326.723977071 -4126551.186669888))"
    url = "http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/tiff&TIME=2018-03-29/2018-05-29&GEOMETRY=POLYGON((-8435725.686699832 5680049.6688012425,-8416071.278129885 5680049.6688012425,-8416071.278129885 5701562.535136176,-8435725.686699832 5701562.535136176,-8435725.686699832 5680049.6688012425))"
    x = requests.get(url)
    # Save input image:
    with open('images/inputs/input.tiff', 'wb') as f:
        f.write(x.content)

    sat_img = rasterio.open('images/inputs/input.tiff', 'r')
    profile = sat_img.profile
    profile['count'] = 1
    print(profile)
    transform = A.Compose([A.Resize(256, 256, p=1.0, interpolation=3)])

    img = rasterio.open('images/inputs/input.tiff', 'r').read()
    img = np.asarray(img)[:3].transpose((1, 2, 0))
    PIL.Image.fromarray(img).show()
    print('img', img.shape)
    img = transform(image=img)['image']
    img = np.transpose(img, (2, 0, 1))
    img = img / 255.0
    img = torch.tensor(img)

    model = SegmentationModel()
    model.load_state_dict(torch.load('models/water.pt', map_location=torch.device('cpu')))
    logits_mask = model(img.to('cpu', dtype=torch.float32).unsqueeze(0))
    pred_mask = torch.sigmoid(logits_mask)
    pred_mask = (pred_mask.squeeze(0) > 0.6) * 1.0
    print(pred_mask.size())

    # Save output image:
    with rasterio.open('images/outputs/output.tiff', 'w', **profile) as src:
        src.write(pred_mask)
