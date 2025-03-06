# -*- coding: UTF-8 -*-

import json
import bs4
# import os
import numpy
import re
# from svgpathtools import parse_path, Line, disvg
import copy
import math


from svg.path import parse_path
from svg.path.path import Line
import svg.path

from cssutils import parseStyle

from svgsimpletool import find_center
# def get_attr_by_style(element):
    #

svg_x = 0
svg_y = 0

svg_resize = 1

def is_number(s):
    try:
        float(s.replace(",", ""))
        return True
    except ValueError:
        pass
    return False

def get_rect_attr(rect, attr, default_value):
    if attr in rect.keys():
        return rect[attr]
    else:
        return default_value

def try_convert_number(s):
    try:
        number = float(s.replace(",", ""))
        return number 
    except ValueError:
        pass
    return s

def parse_fill(fill):
    # print(fill)

    if isinstance(fill, str) and fill.startswith("url"):
        return fill


    elif fill == "none":
        return "none"

    elif type(fill)==list and len(fill)==3:
        return fill
    elif len(fill) == 0:
        return ""
    elif fill == "currentColor":
        return [0, 0, 0]
    elif fill.startswith("rgb("):
        # print(fill)
        color = fill[4: -1].split(",")
        r = int(color[0])
        g = int(color[1])
        b = int(color[2])
        # print([r,g,b])
        return [r,g,b]
    elif fill[0] != "#":
        print(f"I cannot handle this color {fill}")
        return [0, 0, 0]
    elif len(fill) == 7:
        r = int(fill[1:3], 16);
        g = int(fill[3:5], 16);
        b = int(fill[5:7], 16);
        # print(r, g, b)
        return [r, g, b]
    elif len(fill) == 4:
        r = int(int(fill[1:2], 16)/15.0 * 255);
        g = int(int(fill[2:3], 16)/15.0 * 255);
        b = int(int(fill[3:4], 16)/15.0 * 255);
        # print(r, g, b)
        return [r, g, b]
    return [0,0,0]

# def parse_anchor(style):
#     if 

def has_style_attr(element, attr):
    if element.has_attr(attr):
        return True
    if not element.has_attr("style"):
        return False
    style_str = element['style']
    style_list = style_str.replace(" ", "").split(';')
    # print("style_list: ", style_list)
    style_dict = [{"key": a.split(":")[0], "value": a.split(":")[1]} for a in style_list if a!= ""]
    # print("style_dict: ", style_dict)

    if attr in [item['key'] for item in style_dict]:
        return True

    return False

def get_style_attr(element, attr, default_value = ""):
    if not has_style_attr(element, attr):
        return default_value
    if element.has_attr(attr):
        return element[attr]
    if element.has_attr('style'):
        style_str = element['style']
        style_list = style_str.replace(" ", "").split(';')
        style_dict = {a.split(":")[0]: a.split(":")[1] for a in style_list if a != "" }
        return style_dict[attr]
    return default_value

def get_attr(element, attr, default_value = ""):
    # 这是一个补丁
    if attr == "fill":
        if not element.has_attr(attr):
            for node in element.parents:
                if node.name == "g":
                    if node.has_attr(attr):
                        return node[attr]
        else:
            return parse_fill(element[attr])

    if attr == "text-anchor" or attr == "fill-opacity" or attr == "opacity" or attr == "font-family" or attr == "stroke" or attr == "stroke-width":
        # print(element)
        # print("元素有text-anchor？", has_style_attr(element, attr))
        if has_style_attr(element, attr):
            return get_style_attr(element, attr, default_value)
        else:
            for node in element.parents:
                if node.name == "g":
                    if has_style_attr(node, attr):
                        # print("node: ", node)
                        # print('这个node 有', get_style_attr(node, attr))
                        return get_style_attr(node, attr, default_value)
        return default_value


    elif has_style_attr(element, attr):
        if attr == "width" or attr == "height":
            if get_style_attr(element, attr, default_value).endswith("%"):
                return default_value
        elif attr == "r":
            return re.sub("[a-z]", "", element[attr])
        elif attr == "font-size":
            font_size_value = get_style_attr(element, attr, default_value)
            font_size_value = font_size_value.replace("px", '')
            if font_size_value.endswith("em"):
                relative_value = float(font_size_value.replace("em", "")) * 16
                return relative_value
            # print(font_size_value)
            return font_size_value

        return get_style_attr(element, attr, default_value)
    else:
        return default_value

def parse_transform(element):
    transform = get_attr(element, "transform", "translate(0,0)")
    return parse_transform_string(transform)


def parse_transform_string(transform_string):
    if transform_string.startswith('translate('):
        x = transform_string.split("(")[1].split(",")[0]
        y = transform_string.split(",")[1].split(")")[0]
        x = x.replace('px', "")
        y = y.replace('px', "")
        x = float(x)
        y = float(y)
        if math.isnan(x):
            x = 0
        if math.isnan(y):
            y = 0
    else:
        x = 0
        y = 0

    return x, y



def get_font_size(element):
    if element.name == "text":
        font_size = float(get_attr(element, "font-size", 12))
    
        return font_size

def get_translate(element):
    return parse_transform(element)

    # if not element.has_attr("transform"):
    #     return 0,0
    # transform = element['transform']
    # if not transform.startswith("translate("):
    #     return 0,0
    # xy = transform.replace("translate(", "").replace(")", "").split(",")

    # x = float(xy[0])
    # y = float(xy[1])
    # # print(f"deal with transform: {x} {y}")
    # return x,y


def convert_to_abs(x, y, matrix):
    return matrix['a'] * x + matrix['c'] * y + matrix['e'], matrix['b'] * x + matrix['d'] * y + matrix['f']

def deal_rem(number):
    
    if number.endswith('rem'):
        value = float(number[:-3]) * 16
    elif number.endswith('em'):
        value = float(number[:-2]) * 16
    else:
        value = float(number)
    return value

def get_position(element, is_bbox = False):
    # print(element.name)
    global svg_x
    global svg_y

    if element.has_attr('transform_matrix'):
        matrix = element['transform_matrix']
        matrix = json.loads(matrix)

        if element.name == "rect" or element.name == "circle":
            choice_dict = {"rect": ['', 'd'], "circle": ["c"]}
            choice = choice_dict[element.name]
            x = 0
            for attr_name in choice:
                if element.has_attr(attr_name + 'x'): 
                    x += deal_rem(element[attr_name + 'x'])
            y = 0
            for attr_name in choice:
                if element.has_attr(attr_name + 'y'): 
                    y += deal_rem(element[attr_name + 'y'])
                    
            x, y = convert_to_abs(x, y, matrix)
            x -= svg_x
            y -= svg_y
            return x, y

        elif element.name == "svg":
            x, y = convert_to_abs(0, 0, matrix)
            return x, y

        elif element.name == "text":
            x  = float(get_attr(element, "x", 0))
            y  = float(get_attr(element, "y", 0))
            dy = get_attr(element, "dy", "0")
            dx = get_attr(element, "dx", "0")

            tx, ty = parse_transform(element)

            if dy.endswith("em"):
                dy = float(dy.replace("em", "")) * 16
            else:
                dy = float(dy)

            if dx.endswith("em"):
                dx = float(dx.replace("em", "")) * 16
            else:
                dx = float(dx) 
            y = y + dy + ty
            x = x + dx + tx 
        elif element.name == "path":
            x, y = parse_transform(element)
        elif element.name == "line":
            x = 0
            y = 0
        # print("yeyeyeyeye")

    if not is_bbox:
        if element.name == "rect":
            x = float(get_attr(element, "x", 0))
            y = float(get_attr(element, "y", 0))
            tx, ty = parse_transform(element)
            x = x + tx
            y = y + ty
            # print("real", x, y)
        elif element.name == "circle":
            x = float(get_attr(element, "cx", 0))
            y = float(get_attr(element, "cy", 0))
        elif element.name == "text":
            x = float(get_attr(element, "x", 0))
            y = float(get_attr(element, "y", 0))
            dy = get_attr(element, "dy", "0")
            dx = get_attr(element, "dx", "0")

            tx, ty = parse_transform(element)

            if dy.endswith("em"):
                dy = float(dy.replace("em", "")) * 16
            else:
                dy = float(dy)

            if dx.endswith("em"):
                dx = float(dx.replace("em", "")) * 16
            else:
                dx = float(dx) 
            y = y + dy + ty
            x = x + dx + tx 
        elif element.name == "path":
            x, y = parse_transform(element)
        elif element.name == "line":
            x = 0
            y = 0
        else:
            print("can not handle current element type: ", element.name)
    else:
        x = float(get_attr(element, "bbox_x", 0))
        y = float(get_attr(element, "bbox_y", 0))



    # print(f"Now, x: {x}, y: {y}")
    for parent in element.parents:
        if parent.name == "svg":
            break;
        if parent.name == "g":
            add_x, add_y = parse_transform(parent)
            x = x + add_x
            y = y + add_y

    # print(f"Now, x: {x}, y: {y}")
    return x, y


def get_rectangles(soup):
    rects = soup.select("rect")
    return rects

def path_a_line_seg():
    width = float(get_attr(rect, "width", 0))
    height = float(get_attr(rect, "height", 0))
    opacity = float(get_attr(rect, "opacity", 1))
    color  = parse_fill(get_attr(rect, "fill", "#000"))


    # print(get_attr(rect, "fill", "#000"))
    # for debug
    value = float(get_attr(rect, "q0", 0))
    x, y = get_position(rect)
    left = x
    right = x + width
    up = y
    down = y + height
    rect_attr = {
        "type": "rect",
        "origin": rect,
        "width": width,
        "height": height,
        "left": left,
        "right": right,
        "value": value,
        "fill": color,
        "opacity": opacity,
        "x": x,
        "y": y,
        "up": up,
        "down": down,
        "text": ""}
    return rect_attr

def get_important_rects(rects, dim, array):
    important_rects = []
    other_rects = []
    sorted_array = sorted(array.items(), key = lambda item:item[1], reverse = True)
    common_value = sorted_array[0][0]
    if common_value == 0:
        common_value = sorted_array[1][0]
    for rect in rects:
        if rect[dim] == common_value:
            important_rects.append(rect)
        elif rect["width"] > 0 and rect["height"] > 0 and rect["opacity"] > 0:
            other_rects.append(rect)
    return important_rects, other_rects

def parse_circles(soup):
    circles = soup.select('circle')
    circle_attr = [parse_a_circle(circle) for circle in circles]
    return circle_attr


def parse_a_circle(circle):
    radius = float(get_attr(circle, "r", 0))
    opacity = float(get_attr(circle, "opacity", 1))
    fill_color = parse_fill(get_attr(circle, "fill", "#000"))
    # print("fill_color: ", fill_color)
    x, y = get_position(circle)



    fill_opacity = float(get_attr(circle, "fill-opacity", 1))
    opacity = float(get_attr(circle, "opacity", 1))


    color  = parse_fill(get_attr(circle, "fill", ""))
    stroke  = parse_fill(get_attr(circle, "stroke", ""))
    stroke_width = get_attr(circle, "stroke-width", 0)

    
    circle['my_x'] = x
    circle['my_y'] = y 

    left = x - radius
    right = x + radius
    up = y - radius
    down = y + radius
    width = 2 * radius
    height = 2 * radius

    del circle['transform_matrix']
    circle_attr = {
        "type"      : "circle",
        "origin"    : circle,
        "width"     : width,
        "height"    : height,
        "left"      : left,
        "right"     : right,
        'original_soup': circle,
        "fill"      : fill_color,
        "stroke"    : stroke,
        "stroke_width": stroke_width,
        "opacity"   : opacity,
        "fill_opacity": fill_opacity,
        "x"         : x,
        "y"         : y,
        "up"        : up,
        "down"      : down,
        "r"         : radius
    }
    return circle_attr



def parse_a_rect(rect):

    if rect.has_attr('real_width'):
        width = float(get_attr(rect, "real_width", 0))
    else:
        width = float(get_attr(rect, "width", 0))

    if rect.has_attr('real_height'):
        height = float(get_attr(rect, "real_height", 0))
    else:
        height = float(get_attr(rect, "height", 0))

    opacity = float(get_attr(rect, "opacity", 1))
    fill_opacity = float(get_attr(rect, "fill-opacity", 1))
    color  = parse_fill(get_attr(rect, "fill", "#000"))
    stroke  = parse_fill(get_attr(rect, "stroke", "#000"))
    stroke_width = get_attr(rect, "stroke-width", "0")

    # print(get_attr(rect, "fill", "#000"))
    # for debug
    value = float(get_attr(rect, "q0", 0))
    x, y = get_position(rect)
    left = x
    right = x + width
    up = y
    down = y + height
    rect_attr = {
        "type": "rect",
        "origin": rect,
        "width": width,
        "height": height,
        "left": left,
        "right": right,
        "value": value,
        "fill": color,
        "original_soup": rect,
        "stroke": stroke,
        "stroke_width": stroke_width,
        "opacity": opacity,
        'fill_opacity': fill_opacity,
        "x": x,
        "y": y,
        "up": up,
        "down": down,
        "text": ""}
    return rect_attr

def parse_a_text_visual(text):
    value = 0 
    color  = parse_fill(get_attr(text, "fill", "#000"))
    opacity = float(get_attr(text, "opacity", 1))
    fill_opacity = float(get_attr(text, "fill-opacity", 1))
    font_family = get_attr(text, 'font-family', "")
    text_align = ""
    global svg_x
    global svg_y
    matrix = json.loads(text['transform_matrix'])
    bbox = json.loads(text['text_bbox'])
    x = bbox['x']
    y = bbox['y']
    width = bbox['w']
    height = bbox['h']

    x -= svg_x
    y -= svg_y

    print('text', text)
    # ox, oy = convert_to_abs(x, y, matrix)
    ox = x
    oy = y
    print(ox, oy)

    text_anchor = "middle"

    ox += width / 2
    oy += height / 2
    print("height", height)
    
    font_size = height * 0.87

    if (text.has_attr('my_font_size')):
        # print('wucongmeipianwo')
        font_size = text['my_font_size'].replace('px', '')
        # print("font_size_write", font_size)
        # print('font_size_height ', int(height * 10 / 14)  )
        # print("before", font_size)
        font_size = str(int(float(font_size) * svg_resize))
        # print("after", font_size)



    if text.has_attr('my_fill'):
        color  = parse_fill(text['my_fill'])

    # print("final font_size", font_size)
    text_align = "middle"
    left = x
    right = x + width 
    up = y
    down = y + height

    if text.has_attr("content"):
        content = text['content']
    elif text.string == None:
        content = ""
    else:
        content = text.string.replace("\n", " ").strip()
        
        
    print("Text position", content, ox, oy, x, y, width, height)
    

    # print('old text:', text)
    new_text = bs4.BeautifulSoup(str(text), "html5lib").select('text')[0]
    # print("new text", new_text)
    new_text['dx'] = "0"
    new_text['dy'] = "0"
    new_text['transform'] = "translate(0, 0)"
    new_text['x'] = "0"
    new_text['y'] = "0"
    new_text["text-anchor"] = text_anchor
    if text.has_attr('style'):
        current_style = parseStyle(text['style'])
    else:
        current_style = parseStyle(f"font-size: {font_size}px")
    if font_family != "":
        current_style['font-family'] = font_family
    if text_align != "":
        # current_style["alignment-baseline"] = text_align
        current_style['dominant-baseline'] = text_align
    current_style['font-size'] = str(font_size) + "px"
    current_style['text-anchor'] = text_anchor
    current_style['transform'] = "translate(0, 0)"
    new_text['style'] = current_style.cssText

    del new_text['transform_matrix']
    del new_text['text_bbox']
    del new_text['dx']
    del new_text['dy']
    del new_text['transform']

    del text['transform_matrix']

    # print("new new text", new_text)
    # print("ox", ox, "oy", oy)



    rect_attr = {
        "type": "text",
        "origin": new_text,
        "width": width,
        "height": height,
        "left": left,
        "right": right,
        'original_soup': text,
        "value": value,
        "fill": color,
        "opacity": opacity,
        "fill_opacity": fill_opacity,
        'ox': ox,
        'oy': oy,
        "x": x,
        "y": y,
        "up": up,
        "down": down,
        "text": content
        }
    return rect_attr


    # bbox_w = float(get_attr(text, "bbox_w", 0))
    # bbox_h = float(get_attr(text, "bbox_h", 0))

    # # print("bbox content", bbox_x, bbox_y, bbox_w, bbox_h)
    
    # # print(content)
    # return_content = {"x": x, "y": y, "content": content, "orgin":text, "font_size": font_size, "text_anchor": text_anchor, "bbox_x": bbox_x, "bbox_y": bbox_y, "bbox_w": bbox_w, "bbox_h": bbox_h}
    # # print("text content", return_content)
    # return return_content

def uniform_important_circle(data):
    q0 = [x['q0'] for x in data['data_array']]
    q1 = [x['q1'] for x in data['data_array']]
    min0 = min(q0)
    min1 = min(q1)
    max0 = max(q0)
    max1 = max(q1)
    circles = copy.deepcopy(data["data_array"])
    for c in circles:
        c['q0'] = (c['q0']-min0)/(max0-min0)
        c['q1'] = (c['q1']-min1)/(max1-min1)
    return circles

def uniform_important_datapoint(data):
    o0 = data["o0"]
    dps = copy.deepcopy(data["data_array"])
    q0 = [dp["q0"] for dp in dps]
    max_value = max(q0)
    min_value = min(q0)
    max_o = max(o0)
    min_o = min(o0)
    for i in range(len(dps)):
        dps[i]["q0"] = (dps[i]["q0"]-min_value)/(max_value-min_value)
        dps[i]["point_x"] = (o0[dps[i]["o0"]] - min_o)/(max_o-min_o)
        dps[i]["point_y"] = dps[i]["q0"]
    return dps

def uniform_important_elements(important_rects):
    top_most = min([rect['up'] for rect in important_rects])
    bottom_most = max([rect['down'] for rect in important_rects])
    left_most = min([rect['left'] for rect in important_rects])
    right_most = max([rect['right'] for rect in important_rects])

    total_width = right_most - left_most
    total_height = bottom_most - top_most
    max_value = max([rect["value"] for rect in important_rects])
    # print(max_value)
    uniform_elements = []
    for rect in important_rects:
        rect["left"] = (rect["left"] - left_most) / total_width
        rect["right"] = (rect["right"] - left_most) / total_width
        rect["up"] = (rect["up"] - top_most) / total_height
        rect["down"] = (rect["down"] - top_most) / total_height
        rect["width"] = rect["width"] / total_width
        rect["height"] = rect["height"] / total_height
        if "value" in rect and max_value != 0:
            rect["value"] = rect["value"] / max_value
        uniform_elements.append(rect)
    return uniform_elements

def get_text_bbox(text_element):

    text_anchor = text_element["text_anchor"]
    content = text_element["content"]
    length = len(text_element["content"])
    font_size = text_element["font_size"]
    width = text_element["bbox_w"]
    height = text_element["bbox_h"]
    x = text_element['bbox_x']
    y = text_element['bbox_y']

    text_bbox = {}
    text_bbox["x"] = x 
    text_bbox["y"] = y 
    text_bbox["w"] = width 
    text_bbox["h"] = height 

    text_bbox["content"] = try_convert_number(content)

    print('text content !!!', content)

    return text_bbox

    # if text_anchor == "start":


def get_text_group(original_text_group, texts_attr, is_legend = False):
    array = []
    if isinstance(original_text_group["x"], list):
        array = original_text_group["x"]
    elif isinstance(original_text_group["y"], list):
        array = original_text_group["y"]



    text_array = [texts_attr[item["text_id"]] for item in array]
    text_bbox = [get_text_bbox(item) for item in text_array]
    if is_legend:
        for i, text in enumerate(text_bbox):
            text["legend_id"] = i
    return text_bbox

def get_text_information(X_axis, Y_axis, legend, texts_attr):
    xAxis_text = get_text_group(X_axis, texts_attr)
    yAxis_text = get_text_group(Y_axis, texts_attr)
    legend_text = get_text_group(legend, texts_attr, is_legend = True)

    # print("formal_x_axis_array", xAxis_text)
    # print("formal_y_axis_array", yAxis_text)
    # print("formal_legend_axis_array", legend_text)
    text_collection = {}
    text_collection['xAxis'] = {}
    text_collection['xAxis']["text"] = xAxis_text
    text_collection['yAxis'] = {}
    text_collection['yAxis']['text'] = yAxis_text 
    text_collection['legend'] = {}
    text_collection['legend']['text'] = legend_text
    text_collection['element'] = []

    return text_collection

def parse_path_line(soup, min_len = 10):
    paths = soup.select('path')

    path_array = []
    # print(paths)
    for path in paths:
        # print("path", path)
        if not path.has_attr('d'):
            continue
        path_string = path["d"]
        
        fill_color = parse_fill(get_attr(path, "fill", ""))
        fill_opacity = float(get_attr(path, "fill-opacity", 1))
        opacity = float(get_attr(path, "opacity", 1))
        stroke  = parse_fill(get_attr(path, "my_stoke", ""))
        stroke_width = get_attr(path, "stroke-width", 0)

        if (path.has_attr('fill')):
            if path["fill"] == "none" or path['fill'] == "":
                fill_color = ""
                fill_opacity = 0

        segs = parse_path(path_string)
        # print("segs: ", segs)
        point_list = []
        append_info = []
        global svg_x
        global svg_y
        matrix = json.loads(path['transform_matrix'])

        if (len(segs) == 0):
            continue

        first_point = segs[0].point(0)
        x, y = convert_to_abs(first_point.real, first_point.imag, matrix)
        x -= svg_x
        y -= svg_y
        point_list.append((x, y))
        append_info.append(None)
        
        for i, seg in enumerate(segs): 
            x, y = convert_to_abs(seg.end.real, seg.end.imag, matrix)
            x -= svg_x
            y -= svg_y
            point_list.append((x, y))

            if type(seg) == svg.path.path.Arc:
                try:
                    x, y = convert_to_abs(seg.center.real, seg.center.imag, matrix)
                    x -= svg_x
                    y -= svg_y
                    append_info.append({"sweep": seg.sweep, "center": [x, y]})
                except:
                    append_info.append(None)
            else:
                append_info.append(None)

        # print("path_string_new", path_string, point_list)
        # print('color', sum(fill_color), fill_color)

        if (point_list[-1][0] == point_list[0][0] and point_list[-1][1] == point_list[1][1]) \
            or (sum(fill_color) != 0):
            path_type = 'polygon'
        else:
            path_type = 'line'

        point_num = len(point_list)
        delete_list = []

        for i, point in enumerate(point_list):
            next_point = point_list[(i + 1) % point_num]
            if point[0] == next_point[0] and point[1] == next_point[1]:
                delete_list.append(i)

        delete_list.reverse()
        for i in delete_list:
            del point_list[i]
            del append_info[i]

        if len(point_list) == 0:
            continue

        center = find_center(segs, [0, 0])

        del path['transform_matrix']

        if center:
            center_x, center_y = convert_to_abs(center[0], center[1], matrix)
            center_x -= svg_x
            center_y -= svg_y
            center = [center_x, center_y]
        line_seg_attr = {
            "type": path_type,
            "origin": path,
            "fill": fill_color,
            "stroke": stroke,
            "opacity": opacity,
            "original_soup": path,
            "fill_opacity": fill_opacity,
            "stroke_width": stroke_width,
            "polygon": point_list,
            "text": "",
            "center": center,
            "append_info": append_info
        }
        path_array.append(line_seg_attr)

    return path_array

                # x0 = seg.start.real
def parse_line_seg(soup):

    lines = soup.select("line")
    line_segs = []

    for line in lines:
        color = parse_fill(get_attr(line, "my_stroke"))
        dasharray = get_style_attr(line, "strokeDasharray")
        stroke_width = get_style_attr(line, "strokeWidth")
        opacity = get_style_attr(line, "opacity", default_value = 1)

        if line.has_attr("line_bbox"):
            print("line_bbox")
            line_bbox = json.loads(line['line_bbox'])
            x0 = line_bbox['x'] - svg_x
            y0 = line_bbox['y'] - svg_y
            x1 = x0 + line_bbox['w']
            y1 = y0 + line_bbox['h']

        else:
            x0 = float(get_attr(line, "x1", 0))
            x1 = float(get_attr(line, "x2", 0))
            y0 = float(get_attr(line, "y1", 0))
            y1 = float(get_attr(line, "y2", 0))

            matrix = json.loads(line['transform_matrix'])

            x0, y0 = convert_to_abs(x0, y0, matrix)
            x1, y1 = convert_to_abs(x1, y1, matrix)

        parsed_line_seg = packed_formated_line_seg(color, x0, x1, y0, y1, line, dasharray, opacity, stroke_width)
        line_segs.append(parsed_line_seg)

    return line_segs
    # print(line_segs)



def packed_formated_line_seg(color, x0, x1, y0, y1, path, dasharray, opacity, stroke_width):
    
    width = abs(x0 - x1)
    height = abs(y0 - y1)
    value = 0
    left = x0 
    right = x1
    up = y0
    down = y1
    line_seg_attr = {
        "type": "line",
        "origin": path,
        'original_soup': path,
        "polygon": [(x0, y0), (x1, y1)],
        "width": width,
        "height": height,
        "left": left,
        "right": right,
        "value": value,
        "stroke": color,
        "stroke_width": stroke_width,
        "dasharray": dasharray,
        "opacity": opacity,
        "fill_opacity": 0,
        "x": min(x0, x1),
        "y": min(y0, y1),
        "up": up,
        "down": down,
        "text": ""
        }
    return line_seg_attr


def parse_unknown_svg_visual_elements(svg_string, need_data_soup = False, need_text = False, min_len = 10):
    # need_text = True
    # print("this need_text is ", need_text)
    soup = bs4.BeautifulSoup(svg_string, "html5lib")
    svg = soup.select("svg")[0]

    global svg_x
    global svg_y
    global svg_resize


    if svg.has_attr('transform_matrix'):
        matrix = json.loads(svg['transform_matrix'])
        x = 0
        y = 0
        if svg.has_attr('viewBox'):
            viewBox = svg['viewBox']
            if ' ' in viewBox:
                position_list = viewBox.split(' ')
            elif "," in viewBox:
                position_list = viewBox.split(',')
            x = float(position_list[0])
            y = float(position_list[1])
        svg_x, svg_y = convert_to_abs(x, y, matrix)

    else:
        svg_x, svg_y = get_position(svg)


    if svg.has_attr('width'):
        svg['width'] = svg['width'].replace("pt", '').replace('px', '')
    if svg.has_attr('height'):
        svg['height'] = svg['height'].replace("pt", '').replace('px', '')


    if svg.has_attr('width') and svg.has_attr('viewBox'):
        real_width = float(svg['width'].replace("pt", '').replace('px', ''))
        view_width = real_width
        viewBox = svg['viewBox']

        if "," in viewBox:
            view_width = float(viewBox.split(',')[2])
        elif ' ' in viewBox:
            view_width = float(viewBox.split(' ')[2])

        svg_resize =  real_width / view_width

        print('SVG RESIZE', svg_resize)

    print("svg_x, svg_y: ", svg_x, svg_y)

    for defs in soup.find_all("defs"):
        defs.decompose()

    print("svg 个数", len(soup.select("svg")))
    rects = soup.select("rect")
    rects_attr = [parse_a_rect(rect) for rect in rects]

    path_array = parse_path_line(soup, min_len)

    circle_array = parse_circles(soup)

    # print("soup", svg)

    if svg.has_attr('width') and svg.has_attr('height'):
        width = svg['width']
        height = svg['height']

    elif svg.has_attr('viewBox'):
        viewBox = svg['viewBox']
        if ' ' in viewBox:
            position_list = viewBox.split(' ')
        elif "," in viewBox:
            position_list = viewBox.split(',')

        position_list = [i for i in position_list if i != ""]
        if (len(position_list) != 4):
            print("ViewBox wrong: ", viewBox)
            if svg.has_attr('width') and svg.has_attr('height'):
                width = svg['width']
                height = svg['height']
            else:
                print("the viewbox and width and height are wrong")

        else:
            width = position_list[2]
            height = position_list[3]
            svg['width'] = width
            svg['height'] = height



    else:
        width = 1000
        height = 1000

    print('soup width height: ', width, height)


    line_segments = parse_line_seg(soup)

    texts = soup.select("text")

    print('original text num', len(texts))

    texts_attr = [parse_a_text_visual(text) for text in texts]

    # Add text
    if need_text:
        rects_attr.extend(texts_attr)

    # Add line

    rects_attr.extend(path_array)
    rects_attr.extend(circle_array)
    rects_attr.extend(line_segments)

    return rects_attr, width, height, svg

def getCircleList(data):
    cate_choice_number = 15
    type = [0, 1, 0]
    position = [2*data['r'], 2*data['r'], data['q0'], data['q1'], data['q0'], data['q1']]
    color = [0, 0, 0, 1]
    quantity = [data['q0'], data['q1']]
    co= [0 for i in range(4*cate_choice_number)]
    list = type + position + color + quantity + co
    return list

    # width/svg_width, height/svg_height, left/svg_width, right/svg_width, up/svg_height, down/svg_height]
def getDataPointList(data):
    cate_choice_number = 15
    eps = 1e-5
    type = [0, 0, 1]
    position = [eps, eps, data['point_x'], data['point_y'], data['point_x'], data['point_y']]
    color = data['color']
    opacity = [1] #!!!!!!!!!TODO
    quantity = [data['q0'], 0]
    cate0_array = [0 for i in range(cate_choice_number)]
    cate1_array = [0 for i in range(cate_choice_number)]
    ordi0_array = [0 for i in range(cate_choice_number)]
    ordi1_array = [0 for i in range(cate_choice_number)]
    cate0_choice = data['c0']
    ordi0_choice = data['o0']
    cate0_array[cate0_choice] = 1
    ordi0_array[ordi0_choice] = 1
    list = type + position + color + opacity + quantity + cate0_array + cate1_array + ordi0_array
    return list

def parse_svg_string(svg_string, min_element_num = 7, simple = False, need_text = False, need_focus = False):
    
    if need_text:
        important_rects, data, soup, text = parse_unknown_svg_visual_elements(svg_string, need_text = need_text)
    else:
        important_rects, data, soup = parse_unknown_svg_visual_elements(svg_string, need_text)

    # print(important_rects)
    # verify_parsed_results(important_rects)

    is_focus = [get_attr(important_rects[i]["origin"], "focusid", "no") for i in range(len(important_rects))]
    # print("is_focused: ", is_focus)

    focus_array = [i for i in range(len(is_focus)) if is_focus[i] == "yes"]

    elements = []

    for rect in important_rects:
        list = get_rect_list_visual(rect)
        elements.append(list)
    if len(important_rects) < min_element_num:
        for i in range(len(important_rects), min_element_num):
            elements.append([0 for i in range(len(elements[0]))])
        if need_text:
            text.extend(["<pad>" for i in range(min_element_num - len(text))])
            # print("text after uniform", text)
    # print("I want to see the important rects")
    # print("element number", len(elements[0]))
    # print(important_rects)
    # for i, rect in enumerate(important_rects):
    #     rect["id"] = i
    id_array = [i for i in range(len(important_rects))]
    # print(id_array)
    if sum(id_array) == - len(id_array):
        id_array = [i for i in range(len(id_array))]
    # print(f"The id array is {id_array}")

    return_list = [numpy.asarray(elements), id_array, soup]

    if need_text:
        return_list.append(text) 

    if need_focus:
        return_list.append(focus_array)

    return tuple(return_list)


def get_rect_list_visual(rect):
    this_type = [1, 0, 0, 0]
    if rect["type"] == "rect":
        this_type = [1, 0, 0, 0]
    elif rect["type"] == "text":
        this_type = [0, 0, 0, 1]
    elif rect["type"] == "line":
        this_type = [0, 1, 0, 0]

    position = [rect['width'], rect['height'], rect['left'], rect['right'], rect['up'], rect['down']]
    color = rect['fill']
    opacity = [rect['opacity']]
    quantity = [get_rect_attr(rect, 'q0', 0), get_rect_attr(rect, 'q1', 0)]

    list = this_type + position + color + opacity
    # print(f'The attribute of each rectangle is {len(list)}')
    return list

def verify_parsed_results(visual_objs, width, height, input_image = "../image/pie.png",  output_image = "../svg/output.png"):
    from PIL import Image, ImageDraw 

    # im = Image.new("RGBA", (width, height), (255,255,255,255))

    im = Image.open(input_image)

    width_sc, height_sc = im.size

    print("width, height: ", width_sc, height_sc)

    im = im.resize((width, height), Image.ANTIALIAS)

    draw = ImageDraw.Draw(im)

    for rect in visual_objs:
        # print(rect)
        if rect["type"] == "rect":# or rect["type"] == "text":
            if rect['width'] > width / 2 and  rect['height'] > height / 2:
                continue
            draw.rectangle(((rect["left"], rect["up"]), (rect["right"], rect["down"])), outline="red")

        elif rect["type"] == "circle":# or rect["type"] == "text":
            print(rect['fill'], rect['opacity'], rect['origin'])
            if rect['width'] > width / 2 and  rect['height'] > height / 2:
                continue
            draw.rectangle(((rect["left"], rect["up"]), (rect["right"], rect["down"])), outline="yellow")
            
            # draw.text((rect["left"], rect["up"]), rect["text"], fill="white")
        elif rect["type"] == "text":
            draw.rectangle(((rect["left"], rect["up"]), (rect["right"], rect["down"])), outline="blue")
            # draw.text((rect["left"], rect["up"]), rect["text"], fill="white")
        elif rect['type'] == "line":
            # print(rect)
            color = (int(255 * rect["fill"][0]), int(255 * rect["fill"][1]), int(255 * rect["fill"][2]))
            # draw.line(((rect["left"], rect["up"]), (rect["right"], rect["down"])), fill = "red" )
        elif rect['type'] == "polygon":
            color = (255, 0, 0)
            if len(rect['polygon']) == 0:
                continue
            draw.polygon(rect["polygon"], outline = "yellow")




    # draw.line((0, 0) + im.size, fill=128)
    # draw.line((0, im.size[1], im.size[0], 0), fill=128)
    im.save(output_image, "PNG")
    # im.show()

if __name__ == "__main__":
    # with open("../user_data/cq_liucan_20180827/cq_liucan_2018_08_27_22_26_43_53308.json") as f:
    #     svg_string = json.load(f)["svg_string"]
    # print(svg_string)

    # open_json_file("/Users/tsunmac/vis/projects/autocaption/AutoCaption/user_data/20180918_full_ocq_rule/ocq_super_rule_ocq_web_2018_09_18_12_29_28_1473584.json")
   
    # f = open('../svg/stack_area.svg')
    # f = open('../svg/company_tax.svg')
    # f = open('../svg/new_covid-19.svg')


    transform="translate(335.4211302412317,24.50000000000003) scale(1, 1)"
    print(parse_transform_string(transform))

    f = open('../svg/divorce_new.svg')
# 

    svg_string = f.read()

    return_obj = parse_unknown_svg_visual_elements(svg_string, need_text = True, min_len = 100)
    visual_objs = return_obj[0]
    width = return_obj[1]
    height = return_obj[2]
    # print(rect_attr)

    # for i in rect_attr:
    #     print("????", i)

    print([obj['text'] for obj in visual_objs if obj['type'] == "text"])


    width = int(float(width))
    height = int(float(height))

    verify_parsed_results(visual_objs, width, height, "../svg/divorce_screenshot.png", "../svg/divorce_new_out.png")
    # svg_number = 7
    # need_text = True


    # a_numpy, id_array, soup, text, focus_array = parse_svg_string(svg_string, min_element_num=svg_number, simple = True, need_text = need_text, need_focus = True)
    # verify_parsed_results()
    # parse_unknown_svg_visual_elements(svg_string)
        # print(svg_string)
    # a_numpy, id_array = parse_svg_string(svg_string)
    # print("numpy's size", a_numpy.shape)

    # # uniform_elements, data, soup = parse_unknown_svg(svg_string)
    # print(a_numpy)
