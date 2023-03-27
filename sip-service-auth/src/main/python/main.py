import sys
import datetime

from helpers import *

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

# Set paths:
model_path = f'src/main/python/models/{model_name}'
input_img_path = f'src/main/python/images/inputs/input_{model_name.split(".")[0]}.tiff'
output_img_path = f'src/main/python/images/outputs/output_{model_name.split(".")[0]}.tiff'

# Process image:
load_and_save_image(url, input_img_path)
process_image(model_path, input_img_path, output_img_path)
result, bbox = vectorize(url, output_img_path)

result2 = None
if url2 != "null":
    load_and_save_image(url, input_img_path)
    process_image(model_path, input_img_path, output_img_path)
    result, _ = vectorize(url, output_img_path)

# ----------------------------------------------------DATABASE----------------------------------------------------

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
    "url2": url2,
    "bbox": bbox,
    "result": result,
    "result2": result2,
    "finished_at": datetime.datetime.now(),
    'order_id': order_id,
}
save_order_result_to_database(db, order)
