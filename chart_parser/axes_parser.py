prefix = ['$', '¥']
suffix = ['TWh', '%', 'B', "M", "k", "K", 'T', '°F', '°C', 'm']
possible = [',', '\n', ' ']


import re

Month_list = ["jan", "feb", "mar", "apr", 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

import bs4 

from dateutil.parser import parse
import datetime
from utils import pprint



def parse_axes(axes_array, visual_objects, control_points):
    print("DEBUG: axes_array BEFORE loop =", type(axes_array), axes_array)
    for axis in axes_array['x']:
        print("DEBUG: axis type in loop =", type(axis), axis)

        parse_single_axis(axis, visual_objects, control_points)

    for axis in axes_array['y']:
        print("DEBUG: axis type in loop =", type(axis), axis)

        parse_single_axis(axis, visual_objects, control_points)

    return axes_array


def is_numeric(s):
    snew = s
    for item in prefix:
        snew = snew.replace(item, '')
    for item in suffix:
        snew = snew.replace(item, '')
    for item in possible:
        snew = snew.replace(item, '')
    
    snew = snew.replace(',', '').strip()

    print("parse_tick", s, snew)

    try:
        float(snew)
        return True
    except ValueError:
        return False

def is_year(s):
    if len(s.strip()) == 4 and is_numeric(s):
        if int(s) > 1900 and int(s) < 2100:
            return True
        return False
    return False

def is_time(s):
    snew = s 
    chinese_list = ['年', '月']

    snew = snew.replace('年', '-')
    snew = snew.replace('月', '-')
    snew = snew.replace('日', ' ')
    snew = snew.replace('时', ':')
    snew = snew.replace('分', ':')
    snew = snew.replace('秒', ' ')

    
    if snew.endswith('-') or snew.endswith(':'):
        snew = snew[:-1]
    print(snew)
    try:
        dt = parse(snew)
        return True
    except:
        return False


def get_time(s, default_date):
    snew = s 
    chinese_list = ['年', '月']

    snew = snew.replace('年', '-')
    snew = snew.replace('月', '-')
    snew = snew.replace('日', ' ')
    snew = snew.replace('时', ':')
    snew = snew.replace('分', ':')
    snew = snew.replace('秒', ' ')

    
    if snew.endswith('-') or snew.endswith(':'):
        snew = snew[:-1]
    print(snew)
    try:
        dt = parse(snew, default = default_date)
        return dt 
    except:
        return False
def parse_scale_non_text(ticks, direction):
    value_range = ['#' + str(i) for i in ticks]
    current_prefix = ''
    current_suffix = ''

    domain_list = [tick['position'][direction] for tick in ticks]
    
    print('domain list', domain_list)

    min_domain = min(domain_list)
    max_domain = max(domain_list)

    if len(ticks) == 1:
        inter = 100
    else:
        inter = (max_domain - min_domain) / (len(ticks) - 1)
    pixel_domain = [min_domain - inter / 2, max_domain + inter / 2]
    scale_type = 'quantize'
    return value_range, pixel_domain, scale_type, current_prefix, current_suffix

def parse_single_axis(axis, visual_objects, control_points):
    """
    Add uuid to the visual marks
    Parse a axis to get its type.
    """
    
    print("Parse axis", axis['type'], axis['attr_type'])
    
    attr_type = axis['attr_type']
    # pprint('visual_objects', visual_objects)
    for item in axis['tick']:
        item['text_point'] = item['position']
    
    for item in axis['tick']:
        if isinstance(item['visual_object'], dict):
            item['visual_object'] = item['visual_object']['id']

    for item in axis['tick']:
        if isinstance(item['visual_object'], int):
            # pprint('item', item)
            current_vo = visual_objects[item['visual_object']]
            item['origin'] = current_vo['origin']
            item['visual_object_uuid'] = current_vo['uuid']
            print("current_vo", current_vo)
            
            text_point = control_points[current_vo['control_point'][4]]
            item['text_point'] = {"x": text_point['ox'], "y": text_point['oy']}
            print("position and text_point", item['position'], item['text_point'])
            # item['text_point'] = item['positsion']
            new_text = bs4.BeautifulSoup(item['origin'], "html5lib").select('text')[0]
            if 'transform' in new_text.attrs:
                new_text['transform'] = 'translate(0,0)'
                
            new_text['x'] = item['text_point']['x'] - item['position']['x']
            new_text['y'] = item['text_point']['y'] - item['position']['y']
            new_text['text-anchor'] = "middle"
            item['origin'] = str(new_text)


    tick_obj_id = [{'vid': item['visual_object'], 'position': item['position']}\
        for item in axis['tick'] if isinstance(item['visual_object'], int)]
        # for item in axis['tick'] ]

    tick_obj = [visual_objects[item['vid']] for item in tick_obj_id]

    # pprint('tick_obj', tick_obj)
    axis_type = axis['type'] # x axis or y axis
    tick_obj_position = [item['position'][axis_type] for item in tick_obj_id]

    

    # print(tick_obj)

    tick_obj_text = [{'text': item['content'], 'position': tick_obj_position[i]}\
        for i, item in enumerate(tick_obj)]
    
    print("text content axis", [(item['content'], item['right']) for item in tick_obj])



    if len(tick_obj_text) > 0:
        value_range, pixel_domain, scale_type, current_prefix, current_suffix =\
            parse_scale(tick_obj_text)            
    else:
        value_range, pixel_domain, scale_type, current_prefix, current_suffix =\
            parse_scale_non_text(axis['tick'], axis['type'])
    
    print("old scale_type", scale_type, value_range, pixel_domain)
    scale_type = 'quantize'
    if attr_type == "Time":
        scale_type = 'time'
    elif attr_type == "Quantitative":
        scale_type = 'linear'

    print("New scale_type", scale_type, value_range, pixel_domain)
    
    if scale_type == 'linear':
        axis['tick'] = [item for item in axis['tick'] if item['visual_object'] != None and len(visual_objects[item['visual_object']]['content']) < 15]

    tick_obj_id = [{'vid': item['visual_object'], 'position': item['position']}\
        for item in axis['tick'] if isinstance(item['visual_object'], int)]

    tick_obj = [visual_objects[item['vid']] for item in tick_obj_id]
    # pprint('tick_obj', tick_obj)
    ## 
    if len(tick_obj) > 0:
        current_left = min([item['left'] for item in tick_obj])
        current_right = max([item['right'] for item in tick_obj])
        current_up = min([item['up'] for item in tick_obj])
        current_down = max([item['down'] for item in tick_obj])
    else:
        current_left = min([item['position']['x'] for item in axis['tick']])
        current_right = max([item['position']['x'] for item in axis['tick']])
        current_up = min([item['position']['y'] for item in axis['tick']])
        current_down = max([item['position']['y'] for item in axis['tick']])

        if current_left == current_right:
            current_left -= 5
            current_right += 5
        if current_up == current_down:
            current_up -= 5
            current_down += 5

    axis_height = current_down - current_up
    axis_width = current_right - current_left

    axis['scale_type'] = scale_type
    axis['value_range'] = value_range
    axis['pixel_domain'] = pixel_domain
    axis['prefix'] = current_prefix
    axis['suffix'] = current_suffix
    axis['area'] = {'x': current_left, 'y': current_up, 'width': axis_width, 'height': axis_height}
    axis['use_num'] = 0

    if axis_type == 'x':
        axis['another_attr'] = axis['tick'][0]['position']['y']
    else:
        axis['another_attr'] = axis['tick'][0]['position']['x']

    # pprint('axis', axis)
    return axis


def check_year(temp):
    year = re.findall("(\d{4})", temp, re.I|re.M)
    if len(year) > 0:
        return year[0]
    return False

def check_month(temp):
    month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

    lower_temp = temp.lower()
    for mm in month:
        if mm in lower_temp:
            return mm 
    
    return False

def is_single_time(temp):
    try:
        parse(temp, default=datetime.datetime(2022, 1, 1))
        return True
    except:
        return False

def is_time_list(temp_list):

    is_time_array = [item for item in temp_list if is_single_time(item)]
    
    if len(is_time_array) > len(temp_list) / 2:
        return True

    return False
        

def parse_temp_list(temp_list):
    year_list = [check_year(item) for item in temp_list]
    month_list = [check_month(item) for item in temp_list]
    for i in range(len(year_list) - 1):        
        if year_list[i] != False and year_list[i + 1] == False:
            year_list[i + 1] = year_list[i]

    for i in range(len(year_list) - 1):
        idx = len(year_list) - 1 - i
        # print(idx)
        if year_list[idx] != False and year_list[idx - 1] == False:
            for j in range(idx):
                year_list[j] = str(int(year_list[idx]) - 1)
            # year_list[i - 1] = year_list[i]
            break

    date_list = []
    final_date_list = []
    for i, temp in enumerate(temp_list):
        if year_list[i] != False and year_list[i] not in temp:
            temp = f"{temp} {year_list[i]}"

        print(temp)
        
        current_date = parse(temp, default=datetime.datetime(2022, 1, 1))
        date_list.append(current_date) 
        final_date_list.append(temp)

    return date_list, final_date_list




def get_prefix_suffix(tick_number_text):
    current_prefix = ''
    current_suffix = ''

    print("tick_number_text", tick_number_text)

    for pre in prefix:
        judge_tick = [item["text"].startswith(pre) for item in tick_number_text]
        if sum(judge_tick) > len(tick_number_text) / 2:
            current_prefix = pre
            print("Prefix", pre, judge_tick)
            break

    for suf in suffix:
        judge_tick = [item["text"].endswith(suf) for item in tick_number_text]
        if sum(judge_tick) > len(tick_number_text) / 2:
            current_suffix = suf 
            break

    return current_prefix, current_suffix

def get_number(text):
    snew = text
    for item in prefix:
        snew = snew.replace(item, '')
    for item in suffix:
        snew = snew.replace(item, '')
    for item in ['\n', ' ', ',', '，']:
        snew = snew.replace(item, '')

    print("number", snew)

    return float(snew)



def parse_scale(tick_obj_text):
    
    print("parse scale")

    tick_is_numeric = [is_numeric(item['text']) for item in tick_obj_text]
    tick_is_year = [is_year(item['text']) for item in tick_obj_text]

    current_prefix = ''
    current_suffix = ''

    tick_is_time = [is_time(item['text']) for item in tick_obj_text]

    print("tick_is_numeric", tick_is_numeric)

    print("tick_is_time", tick_is_time)

    print('tick_is_year', tick_is_year)

    if sum(tick_is_numeric) > len(tick_obj_text) / 2 and sum(tick_is_year) < len(tick_obj_text) / 2:

        tick_numeric_idx = [i for i, item in enumerate(tick_is_numeric) if item]
        tick_numeric_text = [tick_obj_text[idx] for idx in tick_numeric_idx]
        current_prefix, current_suffix = get_prefix_suffix(tick_numeric_text)

        min_numeric_tick = tick_obj_text[min(tick_numeric_idx)]
        max_numeric_tick = tick_obj_text[max(tick_numeric_idx)]

        min_num = get_number(min_numeric_tick['text'])
        max_num = get_number(max_numeric_tick['text'])

        value_range = [min_num, max_num]
        pixel_domain = [min_numeric_tick['position'], max_numeric_tick['position']]

        # if zero is near the value range, zero is the original point
        # if not, choose the one near another axis

        scale_type = 'linear'

    elif sum(tick_is_time) > len(tick_obj_text) / 2:
        print('timetimeitem')

        time_text = [text['text'] for text in tick_obj_text if is_time(text['text'])]
        print("time text", time_text)
        date_list, new_time_text = parse_temp_list(time_text)

        print("new_time_text", new_time_text)
        tick_time_idx = [i for i, item in enumerate(tick_is_time) if item]

        min_time_tick = tick_obj_text[min(tick_time_idx)]
        max_time_tick = tick_obj_text[max(tick_time_idx)]

        # min_time = get_time(min_time_tick['text'], default_date)
        # max_time = get_time(max_time_tick['text'], min_time)

        value_range = [date_list[0].strftime("%b %d %Y"), date_list[-1].strftime("%b %d %Y")]
        pixel_domain = [min_time_tick['position'], max_time_tick['position']]

        # if zero is near the value range, zero is the original point
        # if not, choose the one near another axis

        scale_type = 'time'

    else:
        value_range = [item['text'] for item in tick_obj_text]
        if len(tick_obj_text) > 2:
            interval = (tick_obj_text[1]['position'] - tick_obj_text[0]['position'])
        else:
            interval = 100

        pixel_domain = [tick_obj_text[0]['position'] - interval / 2, tick_obj_text[-1]['position'] + interval / 2]
        scale_type = 'quantize'

    print("chosen scale", scale_type)
    return value_range, pixel_domain, scale_type, current_prefix, current_suffix