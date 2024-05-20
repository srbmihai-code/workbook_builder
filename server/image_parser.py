from PIL import Image
import os
import re

# Checks to see if a pixel is black or close to black
# This is done to see if an exercise begins
def is_blackish(pixel):
    if isinstance(pixel, int):
        return True if pixel < 90 else False
    elif isinstance(pixel, tuple):
        return True if (pixel[0] < 90 and pixel[1] < 90 and pixel[2] < 90) else False
    raise Exception("Not an int or tuple")

def parse_directory(directory, output_directory, first_ommit, last_ommit):
    image_number = 0
    images = os.listdir(directory)
    for image in images:
        strip_space = []
        cropped_img = []
        img = Image.open(os.path.join(directory,image))
        pix = img.load()
        width,height = img.size
        found = False
        # Detect and trim unnecessary white space at the start of the image
        for x in range(1,width):
            for y in range(1, height):
                if is_blackish(pix[x, y]):
                    found=True
                    break
            if found:
                break
        start_of_file=x
        start=0
        # Detect all strips
        for y in range(1,height):
            for x in range(start_of_file, width):
                if is_blackish(pix[x, y]):
                    break
            if x!=(width-1) and start==0:
                start=y
            elif x==(width-1) and start!=0: 
                cropped_img.append([start_of_file,start,width,y])
                start=0
        for i in range(len(cropped_img)-1):
            strip_space.append(cropped_img[i+1][1]-cropped_img[i][3])
        # Delete if they are close to eachother
        # Diacritics would be split on separate lanes otherwise
        for i in range(1,len(cropped_img)):
            if strip_space[i-1] < 10 and cropped_img[i-1] is not None:
                cropped_img[i-1][3]=cropped_img[i][3]
                cropped_img[i] = None
            if cropped_img[i-2] is not None:
                if cropped_img[i-1] is None and cropped_img[i][1]-cropped_img[i-2][3] < 10:
                    cropped_img[i-2][3]=cropped_img[i][3]
                    cropped_img[i] = None

        cropped_img =[x for x in cropped_img if x is not None]
        # Save files
        looprange = range(1 if first_ommit else 0,len(cropped_img)-(1 if last_ommit else 0))
        for i in looprange:
            savedimg = cropped_img[i]
            image_number+=1
            img.crop(tuple(savedimg)).save(os.path.join(output_directory, f"{image_number}.png"),"PNG")

def sort_nicely(file_list):
    def try_int(s):
        try:
            return int(s)
        except ValueError:
            return s
    def alphanum_key(s):
        return [try_int(c) for c in re.split('([0-9]+)', s)]
    return sorted(file_list, key=alphanum_key)
