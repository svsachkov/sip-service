import sys
import datetime

from shapely import symmetric_difference

from helpers import *

root_path = "src/main/python/"
# root_path = ""  # for compiling with python configurer

# Models:
models = {
    "water": "water.pt",
    "ice": "ice.pth",
}

# Get all arguments:
url = sys.argv[1].replace('jpeg', 'tiff')
url2 = sys.argv[2].replace('jpeg', 'tiff')
order_id = sys.argv[3]
model_name = models[sys.argv[4]]

# url = "http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&CRS" \
#       "=EPSG:3857&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT" \
#       "=image/tiff&TIME=2018-1-1/2018-03-01&GEOMETRY=POLYGON((3732768.0148189478 3605992.4936487195,3892647.243315764 " \
#       "3605992.4936487195,3892647.243315764 3744784.0326893786,3732768.0148189478 3744784.0326893786," \
#       "3732768.0148189478 3605992.4936487195))"
# url2 = "http://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?SERVICE=WMS&REQUEST=GetMap&CRS" \
#        "=EPSG:3857&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857" \
#        "&FORMAT=image/tiff&TIME=2020-1-1/2020-03-01&GEOMETRY=POLYGON((3732768.0148189478 3605992.4936487195," \
#        "3892647.243315764 3605992.4936487195,3892647.243315764 3744784.0326893786,3732768.0148189478 " \
#        "3744784.0326893786,3732768.0148189478 3605992.4936487195))"
# order_id = "c171b137-6fce-4e7f-911b-bb76dc658e5b"
# model_name = models["water"]

# Set paths:
model_path = f'{root_path}models/{model_name}'
input_img_path = f'{root_path}images/inputs/input_{model_name.split(".")[0]}.tiff'
output_img_path = f'{root_path}images/outputs/output_{model_name.split(".")[0]}.tiff'

result, result2, bbox, mp1, mp2 = None, None, None, None, None
if model_name == models["water"]:
    # Process image:
    load_and_save_image(url, input_img_path)
    process_image(model_path, input_img_path, output_img_path)
    result, bbox, mp1 = vectorize(url, output_img_path)

    if url2 != "null":
        load_and_save_image(url2, input_img_path)
        process_image(model_path, input_img_path, output_img_path)
        result2, _, mp2 = vectorize(url2, output_img_path)

elif model_name == models["ice"]:
    vv_img_path = f'{root_path}images/inputs/vv_{model_name.split(".")[0]}.tiff'
    vh_img_path = f'{root_path}images/inputs/vh_{model_name.split(".")[0]}.tiff'
    vv20_img_path = f'{root_path}images/inputs/vv20_{model_name.split(".")[0]}.tiff'
    vh20_img_path = f'{root_path}images/inputs/vh20_{model_name.split(".")[0]}.tiff'

    load_and_save_image(url.replace("VV", "VV"), vv_img_path)
    load_and_save_image(url.replace("VV", "VH"), vh_img_path)
    load_and_save_image(url.replace("VV", "VV-20"), vv20_img_path)
    load_and_save_image(url.replace("VV", "VH-20"), vh20_img_path)

    img_vv = rasterio.open(vv_img_path, 'r')
    img_vh = rasterio.open(vh_img_path, 'r')
    img_vv20 = rasterio.open(vv20_img_path, 'r')
    img_vh20 = rasterio.open(vh20_img_path, 'r')

    img = np.ndarray(shape=(4, *img_vv.shape))
    img[0] = np.array(img_vv.read(1))
    img[1] = np.array(img_vv.read(1))
    img[2] = np.array(img_vv.read(1))
    img[3] = np.array(img_vv.read(1))

    with rasterio.open(input_img_path, 'w', **img_vv.profile) as src:
        src.write(img)

    process_image_ice(model_path, img, output_img_path, img_vv)
    result, bbox, mp1 = vectorize(url, output_img_path)

    if url2 != "null":
        load_and_save_image(url2.replace("VV", "VV"), vv_img_path)
        load_and_save_image(url2.replace("VV", "VH"), vh_img_path)
        load_and_save_image(url2.replace("VV", "VV-20"), vv20_img_path)
        load_and_save_image(url2.replace("VV", "VH-20"), vh20_img_path)

        img_vv = rasterio.open(vv_img_path, 'r')
        img_vh = rasterio.open(vh_img_path, 'r')
        img_vv20 = rasterio.open(vv20_img_path, 'r')
        img_vh20 = rasterio.open(vh20_img_path, 'r')

        img = np.ndarray(shape=(4, *img_vv.shape))
        img[0] = np.array(img_vv.read(1))
        img[1] = np.array(img_vv.read(1))
        img[2] = np.array(img_vv.read(1))
        img[3] = np.array(img_vv.read(1))

        with rasterio.open(input_img_path, 'w', **img_vv.profile) as src:
            src.write(img)

        process_image_ice(model_path, img, output_img_path, img_vv)
        result2, bbox, mp2 = vectorize(url2, output_img_path)

# ----------------------------------------------------DATABASE----------------------------------------------------

diff = None
if result2 is not None:
    try:
        diff = symmetric_difference(mp1, mp2)
        gpd.GeoSeries(diff).simplify(tolerance=500).to_file(f"diff.json", driver='GeoJSON', show_bbox=False)
        diff = gpd.GeoSeries(diff).to_json()
    except:
        pass

# Update the finished order in the database:
db = {
    "host": "127.0.0.1",
    "port": "5432",
    "user": "postgres",
    "password": "3172",
    "database": "data",
}
order = {
    "status": "true",
    "url": url,
    "url2": url2 if url != "null" else None,
    "bbox": bbox,
    "result": result,
    "result2": result2,
    "finished_at": datetime.datetime.now(),
    "order_id": order_id,
    "diff": diff,
}
save_order_result_to_database(db, order)
