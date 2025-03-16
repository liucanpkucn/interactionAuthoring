import os
from datetime import datetime

def pprint(*args, file="DEBUG/1_debug_print.txt", encoding="utf8"):
    """
    Print to file instead of terminal. Appends each call with a timestamp and a distinct header.
    """
    os.makedirs(os.path.dirname(file), exist_ok=True)  

    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")  # 时间戳
    header = "\n" + "$$$"  # 显眼的标头
    with open(file, "a", encoding=encoding) as f: 
        f.write(f"{header}\n{timestamp} " + " ".join(map(str, args)) + "\n")



def rect_distance(rect1, rect2):
    x1 = rect1['x']
    y1 = rect1['y']
    x1b = rect1['x'] + rect1['width']
    y1b = rect1['y'] + rect1['height']

    x2 = rect2['x']
    y2 = rect2['y']
    x2b = rect2['x'] + rect2['width']
    y2b = rect2['y'] + rect2['height']

    def dist(point1, point2):
        x1 = point1[0]
        x2 = point1[1]
        y1 = point2[0]
        y2 = point2[1]
        return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5
        
    left = x2b < x1
    right = x1b < x2
    bottom = y2b < y1
    top = y1b < y2
    if top and left:
        return dist((x1, y1b), (x2b, y2))
    elif left and bottom:
        return dist((x1, y1), (x2b, y2b))
    elif bottom and right:
        return dist((x1b, y1), (x2, y2b))
    elif right and top:
        return dist((x1b, y1b), (x2, y2))
    elif left:
        return x1 - x2b
    elif right:
        return x2 - x1b
    elif bottom:
        return y1 - y2b
    elif top:
        return y2 - y1b
    else:             # rectangles intersect
        return 0
