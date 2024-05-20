from collections import OrderedDict
import os
import re
import cv2
import pytesseract
import json

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'

# Checks to see if a strip contains an exercise number
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

# Stores where exercises begin and end
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

# Remove exercises that don't have both an exercise part and an answer part
def adjust_json(exercises, answers):
    exercises_start = list(exercises.items())[0][1]['start']
    exercises_end = list(exercises.items())[-3][1]['end']
    answers_start = list(answers.items())[0][1]['start']
    answers_end = list(answers.items())[-3][1]['end']
    exercises1 = {}
    answers1 = {}

    for key, value in answers.items():
        if key in exercises:
            answers1[key] = value
    for key, value in exercises.items():
        if key in answers:
            exercises1[key] = value
    exercises = exercises1
    answers = answers1
    for i, (key, value) in enumerate(answers.items()):
        if not isinstance(list(answers.items())[i+1][1],dict):
            if list(answers.items())[i][1]['end'] != answers_end:
                list(answers.items())[i][1]['end'] = answers_end
            break
        if i==0 and value['start']!=answers_start:
            list(answers.items())[0][1]['start'] = answers_start
        if value['end'] != list(answers.items())[i+1][1]['start'] - 1:
            list(answers.items())[i][1]['end'] = list(answers.items())[i+1][1]['start'] - 1
    for i, (key, value) in enumerate(exercises.items()):
        if not isinstance(list(exercises.items())[i+1][1],dict):
            if list(exercises.items())[i][1]['end'] != exercises_end:
                list(exercises.items())[i][1]['end'] = exercises_end
            break
        if i==0 and value['start']!=exercises_start:
            list(exercises.items())[0][1]['start'] = exercises_start
        if value['end'] != list(exercises.items())[i+1][1]['start'] - 1:
            list(exercises.items())[i][1]['end'] = list(exercises.items())[i+1][1]['start'] - 1
    return exercises, answers

def create_html_json(directory, title):
    exercises = img_to_json(os.path.join(directory,'sub'), title)
    answers = img_to_json(os.path.join(directory,'rez'), title)
    exercises, answers = adjust_json(exercises, answers)
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
    <title>Workbook Builder</title>
    <link rel="stylesheet" href="../../../exercitii.css">
    <script src="../../../exercitii.js" defer></script>
</head>
<body>
<h1 id="titlu">{exercises['name']}</h1>
<a href="../../../../main_pages/front_page/index.html">⬅️Inapoi la meniu</a>
<div style="display: flex;align-items: center;" class="date"><p id="fractie"></p>
<progress value="" max="" id="progres"></progress></div>
{html}
</body>
</html>
    '''
    with open(f'{directory}/index.html', 'w', encoding="utf-8") as f:
        f.write(html)
    # Creating answers.json
    with open(f'{directory}/answers.json', 'w') as f:
        json.dump(answers, f)
