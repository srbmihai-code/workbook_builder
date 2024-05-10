from dotenv import load_dotenv
from sys import argv
import requests
import os
import json

load_dotenv()

url = 'http://127.0.0.1:5000/approve'
SECRET_KEY = os.getenv("SECRET_KEY")
username = argv[1]

data = {'SECRET_KEY': SECRET_KEY, 'username': username}
json_data = json.dumps(data)
headers = {'Content-Type': 'application/json'}

response = requests.post(url, data=json_data, headers=headers)

if response.status_code == 200:
    print("Success")
else:
    print('Error:', response.status_code)
