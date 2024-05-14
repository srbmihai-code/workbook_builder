from dotenv import load_dotenv
from sys import argv
import requests
import os
import json

load_dotenv()

url = 'http://78.97.58.55:8080/approve'
SECRET_KEY = os.getenv("SECRET_KEY")
username = argv[1]

data = {'SECRET_KEY': SECRET_KEY, 'username': username}
json_data = json.dumps(data)
headers = {'Content-Type': 'application/json'}
try:
    response = requests.post(url, data=json_data, headers=headers)
except KeyboardInterrupt:
    pass
if response.status_code == 200:
    print("Success")
else:
    print('Error:', response.status_code)
