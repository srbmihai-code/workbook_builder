from collections import OrderedDict
import os
import re
import cv2
import pytesseract
import json

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'

def find_if_exercise(filename):
    image = cv2.imread(filename)
    print(filename)
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray_image, config="--psm 7")
    period_index = text.find('.')
    if period_index == -1 or not text[:period_index].isdigit():
        return False

    exercise_number = text[:period_index]
    return exercise_number
def img_to_json(directory, title):
    result_json = {}
    count = 1
    last_res = ""
    exercises_count = 0
    images = os.listdir(directory)
    for i in range(1, len(images)+1):
        file=os.path.join(directory,f"{i}.png")
        print(file)
        res = find_if_exercise(file)
        if not res:
            if last_res == "":
                continue
            result_json[last_res]["end"] += 1
        else:
            count = i
            last_res = res
            result_json[res] = {"start": None, "end": None, "solved": False}
            result_json[res]["start"] = i
            result_json[res]["end"] = i
            last_res = res
            exercises_count += 1
    result_json['solved'] = [0, exercises_count]
    result_json['name'] = title
    return result_json
def adjust_json(exercises, answears):
    exercises_start = list(exercises.items())[0][1]['start']
    exercises_end = list(exercises.items())[-3][1]['end']
    answears_start = list(answears.items())[0][1]['start']
    answears_end = list(answears.items())[-3][1]['end']

    # Remove things that are not in both dictionaries
    exercises1 = {}
    answears1 = {}

    for key, value in answears.items():
        if key in exercises:
            answears1[key] = value
    for key, value in exercises.items():
        if key in answears:
            exercises1[key] = value
    exercises = exercises1
    answears = answears1
    for i, (key, value) in enumerate(answears.items()):
        if not isinstance(list(answears.items())[i+1][1],dict):
            if list(answears.items())[i][1]['end'] != answears_end:
                list(answears.items())[i][1]['end'] = answears_end
            break
        if i==0 and value['start']!=answears_start:
            list(answears.items())[0][1]['start'] = answears_start
        if value['end'] != list(answears.items())[i+1][1]['start'] - 1:
            list(answears.items())[i][1]['end'] = list(answears.items())[i+1][1]['start'] - 1
    for i, (key, value) in enumerate(exercises.items()):
        if not isinstance(list(exercises.items())[i+1][1],dict):
            if list(exercises.items())[i][1]['end'] != exercises_end:
                list(exercises.items())[i][1]['end'] = exercises_end
            break
        if i==0 and value['start']!=exercises_start:
            list(exercises.items())[0][1]['start'] = exercises_start
        if value['end'] != list(exercises.items())[i+1][1]['start'] - 1:
            list(exercises.items())[i][1]['end'] = list(exercises.items())[i+1][1]['start'] - 1
    return exercises, answears
def create_html_json(directory, title):
    exercises = img_to_json(os.path.join(directory,'sub'), title)
    answears = img_to_json(os.path.join(directory,'rez'), title)
    exercises, answears = adjust_json(exercises, answears)
    # Creating index.html

    html=""
    images = os.listdir(os.path.join(directory,'sub'))
    for key, value in exercises.items():
        if not isinstance(value, dict):
            break
        html+=f'<div class="exercise" id="{key}">\n'
        for i in range(value['start'], value['end']+1):
            html+=f'<div class="exercise-image" id="{key}-{i}"><img src="./sub/{i}.png"></div>\n'
        html+='</div>\n'
    html = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="../../exercitii.css">
    <script src="../../exercitii.js" defer></script>
</head>
<body>
<h1 id="titlu">{exercises['name']}</h1>
<a href="../../../main_pages/front_page/index.html">⬅️Inapoi la meniu</a>
<div style="display: flex;align-items: center;" class="date"><p id="fractie"></p>
<progress value="" max="" id="progres"></progress></div>
{html}
</body>
</html>
    '''
    with open(f'{directory}/index.html', 'w', encoding="utf-8") as f:
        f.write(html)

    # Creating answears.json
    with open(f'{directory}/answears.json', 'w') as f:
        json.dump(answears, f)
