# pylint: disable=import-error

import json
from datetime import datetime
import time
import re
import os

TMP_DIR = "tmp"
if not os.path.exists(TMP_DIR):
    os.mkdir(TMP_DIR)
    
DEBUG_DIR = "DEBUG"
if not os.path.exists(DEBUG_DIR):
    os.mkdir(DEBUG_DIR)
    
from utils import rect_distance

from extract_svg import parse_unknown_svg_visual_elements
#####################

from parse_control_point import get_control_point
from dateutil.parser import parse
from cal_constraints import (
    perpendicular_gravity_new,
    add_should_axis_constraints,
    add_quantity_constraints)
from svganalysis import get_ticks
from calculate_axis import get_ticks_robust
from deal_with_object import classify_groups_by_chart_info
from axes_parser import parse_axes, parse_temp_list, is_time_list, is_single_time
from shapely.geometry import Point, Polygon

def get_group(
    control_point,
    visual_object):
    groups = []
    groups.append(get_color_group(control_point, visual_object))
    return groups

def get_coordinate_group(CoordSys):
    control_point = CoordSys["control_point"]
    visual_object = CoordSys["visual_object"]
    coordinate_type = CoordSys['coordinate_type']

    groups = []
    
    if coordinate_type == "stack_x" or coordinate_type == "stack_y":
        groups.append(get_single_group(control_point, visual_object))
    else:
        groups.append(get_color_group(control_point, visual_object))

    return groups

def get_single_group(control_point, visual_object):
    color_list = []
    group_list = []
    obj_group_dict = {}
    for vo in visual_object:
        if vo['type'] != "area" and vo['type'] != "point":
            continue
        group_list.append([vo['id']])
        obj_group_dict[str(vo['id'])] = len(group_list) - 1


    color_groups = []

    for i, group in enumerate(group_list):
        current_group = {}
        current_group['color'] = ""
        current_group['visual_object'] = group
        color_groups.append(current_group)

    order_list = [i for i in range(len(color_groups))]

    group = {
        "type": "single",
        "order": "y",
        "group_list": color_groups,
        "order_list": order_list,
        "obj_group_dict": obj_group_dict
    }

    return group

def get_color_group(control_point, visual_object):
    color_list = []
    group_list = []
    obj_group_dict = {}

    for vo in visual_object:
        if vo['type'] != "area" and vo['type'] != "point":
            continue
        if vo['fill'] not in color_list:
            color_list.append(vo['fill'])
            group_list.append([])

        group_index = color_list.index(vo['fill'])
        group_list[group_index].append(vo['id'])
        obj_group_dict[str(vo['id'])] = group_index


    color_groups = []

    for i, group in enumerate(group_list):
        current_group = {}
        current_group['color'] = color_list[i]
        current_group['visual_object'] = group
        color_groups.append(current_group)

    order_list = [i for i in range(len(color_groups))]

    group = {
        "type": "color",
        "order": "y",
        "group_list": color_groups,
        "order_list": order_list,
        "obj_group_dict": obj_group_dict
    }


    # print("color_groups", color_groups)

    return group

def deactivate_some_visual_marks(chart_json, fill = [250, 106, 49]):
    if fill == "no":
        return 

    for obj in chart_json['visual_object']:
        if obj['fill'] == fill:
            obj['activate'] = False
            for pid in obj['control_point']:
                chart_json['control_point'][pid]['activate'] = False

def activate_all_visual_marks(chart_json):

    for point in chart_json['control_point']:
        point['activate'] = True

    for obj in chart_json['visual_object']:
        obj['activate'] = True

def move_some_visual_mark(chart_json, obj_list = [0, 1]):
    for obj_id in obj_list:
        obj = chart_json['visual_object'][obj_id]
        control_point = [chart_json['control_point'][i] for i in obj['control_point']]
        up = obj['up']
        for point in control_point:
            point['y'] -= up - 5

def vo_in_plotarea(vo, plotarea):
    cx = (vo["left"] + vo['right']) / 2
    cy = (vo['up'] + vo['down']) / 2
    if plotarea['x']['min'] <= cx <= plotarea['x']['max'] and plotarea['y']['min'] <= cy <= plotarea['y']['max']:
        return True
    else:
        return False

def get_coordinate(x, y, transform_rule):
    """
    Get coordinage
    """
    if transform_rule['type'] == "simple":
        origin = transform_rule['origin']
        return (
            transform_rule['x_rate'] * (x - origin[0]),
            transform_rule['y_rate'] * (y - origin[1])
        )
    return

def deepcopy(item):
    new_item = {}
    for key in item:
        new_item[key] = item[key]
    return new_item

def get_min_max_visual_object(vo, control_point, attr):
    vo_attr_list = [control_point[pid][attr] for pid in vo['control_point']]
    min_value = min(vo_attr_list)
    max_value = max(vo_attr_list)

    return min_value, max_value

def recalcualte_control_point_and_visual_objects(
    control_point,
    visual_object,
    x_axis, y_axis,
    coordinate_id = 0
):
    """
    Recalculate control points and visual objects.
    """
    # console.log(control_point)
    

    with open(f'{TMP_DIR}/control.json', 'w') as f:
        json.dump(control_point, f, indent = 2)

    new_control_point = [deepcopy(point) for point in control_point\
        if "coordinate_id" in point and point["coordinate_id"] == coordinate_id]
    new_visual_object = [deepcopy(obj) for obj in visual_object\
        if "coordinate_id" in obj and obj['coordinate_id'] == coordinate_id]

    control_point_id_dict = {}
    visual_object_id_dict = {}

    for i, point in enumerate(new_control_point):
        control_point_id_dict[point['id']] = i

    for i, obj in enumerate(new_visual_object):
        visual_object_id_dict[obj['id']] = i 

    # print("control_point_id_dict", control_point_id_dict)
    # print("visual_object_id_dict", visual_object_id_dict)

    for point in new_control_point:
        # print("Current point: ", point)
        # print('Current obj:', visual_object[point['obj_id']])
        point['id'] = control_point_id_dict[point['id']]
        point['obj_id'] = visual_object_id_dict[point['obj_id']]

    for obj in new_visual_object:
        obj['id'] = visual_object_id_dict[obj['id']]
        obj['control_point'] = [control_point_id_dict[pid] for pid in obj['control_point']]


    def deal_with_axis(axis):
        if axis == None:
            return
        if axis['main']:
            axis['controlled']['visual_object'] = [visual_object_id_dict[vid] for vid in axis['controlled']['visual_object']]
        for tick in axis['tick']:
            if tick['visual_object'] != None:
                tick['visual_object'] = visual_object_id_dict[tick['visual_object']['id']]

    deal_with_axis(x_axis)
    deal_with_axis(y_axis)

    def add_axis_tick(axis):
        if axis is None:
            return
        if axis['main']:
            obj_id = len(new_visual_object)
            axis_obj = {
                "id": obj_id,
                "type": "axis",
                "control_point": [],
                "fill": [0, 0, 0]
            }
            for tick in axis['tick']:
                current_point = {"x": tick['position']['x'], "obj_id": obj_id, "y": tick['position']['y'], 'id': len(new_control_point), "coordinate_id": 0, "tick": True, "radius": 0}
                axis_obj['control_point'].append(current_point['id'])
                new_control_point.append(current_point)
                tick['control_point'] = current_point['id']
            new_visual_object.append(axis_obj)

    add_axis_tick(x_axis)
    add_axis_tick(y_axis)

    return new_control_point, new_visual_object


def delete_vo_soup(vo):
    if not "original_soup" in vo:
        return
    soup_obj = vo['original_soup']
    if soup_obj is None:
        return
    # soup_obj.decompose()
    vo['original_soup'] = None

def get_file_name(inputfile):
    """
    get file name according to input file
    """
    file_root = inputfile.split('/')[-1][0: -4]
    recent_output_chart = "web_page/json/chart.json"
    output_chart = f"web_page/json/{file_root}_chart.json"
    output_constraint = f"web_page/json/{file_root}_constraint.json"
    return recent_output_chart, output_chart, output_constraint

def append_text_into_coordinate(
    text_obj,
    CoordSys_list,
    max_dis = 20):
    def point_in_vo(p, vo, control_point):
        # print('point', p)
        if vo['type'] == "point":
            if vo["left"] <= p[0] <= vo['right'] and vo['up'] <= p[1] <= vo['down']:
                return True
        elif vo['type'] == "area":
            coords = [(control_point[pid]['x'], control_point[pid]['y']) for pid in vo['control_point']]
            p_tmp = Point(p[0], p[1])
            if len(coords) < 3:
                return False
            poly = Polygon(coords)
            return p_tmp.within(poly)

        return False
    center_x = (text_obj['left'] + text_obj['right']) / 2
    center_y = (text_obj['up'] + text_obj['down']) / 2
    point = [center_x, center_y]
    min_dis = 10000
    min_coor_id = -1
    min_cp_id = -1
    for coor_id, CoordSys in enumerate(CoordSys_list):
        visual_object = CoordSys['visual_object']
        control_point = CoordSys['control_point']
        point_in_vo_flag = False
        for i, vo in enumerate(visual_object):
            if point_in_vo(point, vo, control_point):
                point_in_vo_flag = True
                min_dis = 10000
                min_coor_id = coor_id
                # print("text in obj")
                for pid in vo['control_point']:
                    current_point = control_point[pid]
                    current_dis = abs(current_point['ox'] - center_x) + abs(current_point['oy'] - center_y)
                    if current_dis < min_dis:
                        min_dis = current_dis
                        min_cp_id = pid
                break

        if point_in_vo_flag:
            break

        for i, current_point in enumerate(control_point):
            current_dis = abs(current_point['ox'] - center_x) + abs(current_point['oy'] - center_y)
            if current_dis > max_dis:
                continue
            if center_x < CoordSys['area']['x']\
                    or center_x > CoordSys['area']['x'] + CoordSys['area']['width']\
                    or center_y < CoordSys['area']['y']\
                    or center_y > CoordSys['area']['y'] + CoordSys['area']['height']:
                continue
            if current_dis < min_dis:
                min_dis = current_dis
                min_coor_id = coor_id
                min_cp_id = i

    if min_coor_id != -1:
        CoordSys = CoordSys_list[min_coor_id]
        if 'append_text' not in CoordSys:
            CoordSys['append_text'] = []
        current_point = CoordSys['control_point'][min_cp_id]
        current_text = {}
        current_text['text_origin'] = str(text_obj['origin'])
        current_text['control_point'] = min_cp_id
        current_text['related_dis'] = {"x": current_point['ox'] - center_x, "y": current_point['oy'] - center_y}
        CoordSys['append_text'].append(current_text)
        delete_vo_soup(text_obj)


def get_area_from_axis(coord_sys):
    coord_sys['area'] = {
        "x": coord_sys['plotarea']['x']['min'],
        "y": coord_sys['plotarea']['y']['min'],
        "width": coord_sys['plotarea']['x']['max'] - coord_sys['plotarea']['x']['min'],
        "height": coord_sys['plotarea']['y']['max'] - coord_sys['plotarea']['y']['min']
    }

def get_area(coord_sys, axes_array, width, height):
    
    left_bound = min([item['left'] for item in coord_sys['visual_object']])
    right_bound = max([item['right'] for item in coord_sys['visual_object']])
    up_bound = min([item['up'] for item in coord_sys['visual_object']])
    down_bound = max([item['down'] for item in coord_sys['visual_object']])
    if coord_sys['x_axis'] is None:
        left_bound = 0
        right_bound = width
    else:
        current_axis = axes_array['x'][coord_sys['x_axis']]
        if left_bound < current_axis['range']['begin']:
            current_axis['range']['begin'] = left_bound
        if right_bound > current_axis['range']['end']:
            current_axis['range']['end'] = right_bound
    if coord_sys['y_axis'] is None:
        up_bound = 0
        down_bound = height
    coord_sys['area'] = {
        "x": left_bound,
        "y": up_bound,
        "width": right_bound - left_bound,
        "height": down_bound - up_bound
        }

    return

import json

def convert_to_serializable(obj):
    """递归遍历并转换不可 JSON 序列化的对象"""
    if isinstance(obj, dict):  # 处理字典
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):  # 处理列表
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, tuple):  # 处理元组，转换为列表以保持 JSON 兼容
        return tuple(convert_to_serializable(item) for item in obj)
    elif isinstance(obj, set):  # 处理集合，转换为列表
        return {convert_to_serializable(item) for item in obj}
    else:
        try:
            json.dumps(obj)  # 测试是否可 JSON 序列化
            return obj
        except TypeError:
            return str(obj)  # 转换为字符串
    
def json_dumps_safe(data):
    """将数据转换为可 JSON 序列化格式后再序列化"""
    return json.dumps(convert_to_serializable(data), indent=4)

def get_axes_from_selected_svg_string(svg_string, no_soup = True, axisdata=None):
    visual_objs, width, height, svg_soup = parse_unknown_svg_visual_elements(svg_string)
        
    with open(f"{TMP_DIR}/visual_objects_before_parse.json", 'w') as f:
        json.dump(visual_objs, f, indent = 2)
        
    
    width = int(float(width))
    height = int(float(height))
    print("width, height: ",width, height)

    selected_area = [[0, 0], [width, height]]

    control_point, visual_object, _ = get_control_point(
        visual_objs,
        width,
        height,
        selected_area,
        False)

    if axisdata and (axisdata != "null"):
        axes_array = json.loads(axisdata)
    else:
        # pprint("visual_object:", visual_object)
        axes_array = get_ticks_robust(svg_string, visual_object)
        with open(f'{TMP_DIR}/axis.json', 'w') as f:
            json.dump(axes_array, f, indent = 2)
        
        # axes_array = get_ticks_robust(control_point, visual_object)
        # 此函数需要修改parse_axes
        axes_array = parse_axes(axes_array, visual_object, control_point) # 移交前端
        
    if no_soup:
        for vo in visual_object:
            del vo['original_soup']

        axes_info = {
            "axes_array": axes_array,
            "visual_object": visual_object,
            "control_point": control_point,
            "width": width,
            "height": height
        }
    else:
        axes_info = {
            "axes_array": axes_array,
            "visual_object": visual_object,
            "control_point": control_point,
            "width": width,
            "height": height,
            "svg_soup": svg_soup,
        }

    # with open('tmp/axis.json', 'w') as f:
    #     json.dump(axes_info, f, indent = 2)
    # print("DEBUG: axes_array =", type(axes_array), axes_array)
    # pprint(axes_info['axes_array'])
    return axes_info

def parse_axis_type(
    axes_array: dict,
    visual_object: list
):

    # pprint("visual_object", visual_object)
    def parse_current_axis(current_axis, direction):
        if current_axis['scale_type'] == "quantize":
            if is_time_list(current_axis['value_range']):
                is_time_idx = [idx for idx, item in enumerate(current_axis['value_range']) if is_single_time(item)]
                is_time_array = [item for item in current_axis['value_range']]

                time_list, _ = parse_temp_list(is_time_array)
                current_axis['value_range'] = [time_list[0], time_list[-1]]
                current_axis['scale_type'] = "time"

                tick_position = [tick['position'][direction] for tick in current_axis['tick']]
                current_axis['pixel_domain'] = [tick_position[is_time_idx[0]], tick_position[is_time_idx[-1]]]

    for current_axis in axes_array['x']:
        direction = "x"
        parse_current_axis(current_axis, direction)

    for current_axis in axes_array['y']:
        direction = "y"
        parse_current_axis(current_axis, direction)


def parse_constraint_axes_vis_cons(chart_info_with_axes, fromfront=False, remove_soup = True):
    """
    Here is the new logic, we deal the visual object by them self.
    """
    axes_array = chart_info_with_axes['axes_array']
    visual_object = chart_info_with_axes['visual_object']
    control_point = chart_info_with_axes['control_point']
    width = chart_info_with_axes['width']
    height = chart_info_with_axes['height']
    svg_soup = chart_info_with_axes['svg_soup']
    
    chart_type = axes_array['chart_type']
    base_axis = axes_array['base_axis']
    
    if chart_type == "bar_chart":
        if base_axis == "x":
            axis = axes_array['x'][0]
            axis['scale_type'] = "quantize"
            axis['value_range'] = [item['content'] for item in axis['tick']]
            fixed_distance = axis['tick'][1]['position']['x'] - axis['tick'][0]['position']['x']
            axis['pixel_domain'] = [axis['tick'][0]['position']['x'] - fixed_distance / 2, axis['tick'][-1]['position']['x'] + fixed_distance / 2]
        else:
            axis = axes_array['y'][0]
            axis['scale_type'] = "quantize"
            axis['value_range'] = [item['content'] for item in axis['tick']]
            fixed_distance = axis['tick'][1]['position']['y'] - axis['tick'][0]['position']['y']
            axis['pixel_domain'] = [axis['tick'][0]['position']['y'] - fixed_distance / 2, axis['tick'][-1]['position']['y'] + fixed_distance / 2]


    for vo in visual_object:
        if vo['role'] in ["data_encoded", "x_axis_text", "y_axis_text"]:
            print("Remove UUID", vo['uuid'])
            try:
                svg_soup.find_all(attrs={"uuid": vo['uuid']})[0].decompose()
                print("Success!")
            except:
                print("Fail to remove uuid")

    coord_sys_list = classify_groups_by_chart_info(
        visual_object,
        control_point,
        axes_array,
        remove_soup
    )

    with open('tmp/coord_sys.json', 'w', encoding='utf-8') as f:
        json.dump(coord_sys_list, f, indent = 2)

    print("CoordSys_list", len(coord_sys_list))
    text_vid_list = [item['id'] for item in visual_object if item['type'] == "text"]
    print("text num", len(text_vid_list))

    tick_text_vid_list = []
    for axis in axes_array['y'] + axes_array['x']:
        if axis['use_num'] > 0:
            tick_text_vid_list.extend([tick['visual_object']\
                for tick in axis['tick'] if isinstance(tick['visual_object'], int)])
    non_tick_text_vid_list = set(text_vid_list) - set(tick_text_vid_list)
    useful_ids = 0

    selected_coord_sys_list = []
    for i, coord_sys in enumerate(coord_sys_list):
        # if coord_sys['coordinate_type'] not in ["stack_x", "stack_y", "share_width"]:
        #     continue
        groups = get_coordinate_group(coord_sys)
        get_area_from_axis(coord_sys)
        # print(groups)
        constraints = []
        # Useful !!!
        print('')
        print('Coordinate_id', useful_ids, coord_sys['coordinate_type'])
        print("Control point number:", len(coord_sys['control_point']))
        print("Visual object control_point number", [len(item['control_point']) for item in coord_sys['visual_object']])
        print("Left", [item['left'] for item in coord_sys['visual_object']])
        print("Right", [item['right'] for item in coord_sys['visual_object']])
        if len(coord_sys['control_point']) < 10:
            continue
   
        useful_ids += 1
        print("Visual object number:", len(coord_sys['visual_object']))
        coord_sys['id'] = useful_ids
        print("Area", coord_sys['area'])
        if coord_sys['coordinate_type'] == "point":
            add_quantity_constraints(coord_sys["control_point"], coord_sys["visual_object"], 'x')
            add_quantity_constraints(coord_sys["control_point"], coord_sys["visual_object"], 'y')
            if "crowd_groups" in coord_sys:
                for current_group in coord_sys['crowd_groups']:
                    for i in current_group['pid']:
                        point = coord_sys["control_point"][i]
                        point['collide'] = True
                        if coord_sys['x_axis'] is None:
                            point['should_x'] = current_group['center']['x']
                            point['small_force_x'] = True
                        if coord_sys['y_axis'] is None:
                            point['should_y'] = current_group['center']['y']
                            point['small_force_y'] = True

        elif coord_sys['coordinate_type'] == "line":
            add_quantity_constraints(coord_sys["control_point"], coord_sys["visual_object"], 'x')
            add_quantity_constraints(coord_sys["control_point"], coord_sys["visual_object"], 'y')
        elif coord_sys['coordinate_type'] == 'vertical_line':
            add_quantity_constraints(coord_sys["control_point"], coord_sys["visual_object"], 'x')
        else:
            if 'second_axis' in coord_sys:
                constraints.extend(
                    add_should_axis_constraints(
                        coord_sys["control_point"],
                        coord_sys["visual_object"],
                        coord_sys["main_axis"]
                    )
                )
                constraints.extend(
                    add_should_axis_constraints(
                        coord_sys["control_point"],
                        coord_sys["visual_object"],
                        coord_sys["second_axis"]))

            elif coord_sys['main_axis'] is not None:
                constraints.extend(
                    perpendicular_gravity_new(
                        coord_sys["control_point"],
                        coord_sys["visual_object"],
                        coord_sys["main_axis"],
                        groups,
                        direction = coord_sys["main_axis"]['direction'],
                        need_tick = False))

        print("Constraints number:", len(constraints))
        print('Visual Object Number:', len(coord_sys['visual_object']))
        coord_sys["constraints"] = constraints
        coord_sys['size'] = {
            "width": width,
            "height": height
        }
        coord_sys['groups'] = groups
        activate_all_visual_marks(coord_sys)
        selected_coord_sys_list.append(coord_sys)

    begin_text_time = time.time()

    for text_obj_idx in non_tick_text_vid_list:
        try:
            text_obj = visual_object[text_obj_idx]
            append_text_into_coordinate(text_obj, coord_sys_list)
        except:
            pass

    end_text_time = time.time()
    print("Calculate text cost time", end_text_time - begin_text_time)
    svg_string = str(svg_soup)
    json_data = {
        "CoordSys": selected_coord_sys_list,
        "axis": axes_array,
        "size": {
            "width": width,
            "height": height
        },
        "svg_string": svg_string
    }
    return json_data

def deducing_chart_separate(svg_string, axisdata=None, remove_soup = True):
    # 根据svg_string 信息，获得轴的信息，再根据轴的信息 和 visual element 的信息来推断约束
    chart_info_with_axes = get_axes_from_selected_svg_string(svg_string, no_soup = False, axisdata=axisdata)
    original_visual_object = chart_info_with_axes['visual_object']
    # pprint("axes_info", axes_info)
    parse_axis_type(chart_info_with_axes["axes_array"], original_visual_object)
    with open(f"{TMP_DIR}/chart_info_with_axes.json", "w") as f:
        f.write(json_dumps_safe(chart_info_with_axes))
    return parse_constraint_axes_vis_cons(
                chart_info_with_axes,
                fromfront = (axisdata is not None),
                remove_soup=remove_soup
                ), original_visual_object

def get_axis_value(position, axis, direction = "x", value_type = 'absolute'):
    
    if type(position) not in [str, float, int]:
        return 0

    value = ''
    if axis["scale_type"] == "quantize":
        tick_position = [item["position"][direction] for item in axis['tick']]
        diff = [abs(item - position) for item in tick_position]
        min_diff = min(diff)
        min_diff_idx = [i for i, item in enumerate(diff) if item == min_diff][0]
        value = axis['tick'][min_diff_idx]['content']

    elif axis['scale_type'] == "linear":
        value_range = axis['value_range']
        pixel_domain = axis['pixel_domain']
        # print("pixel_domain", pixel_domain)
        # print('value_range', value_range)
        # print('position', position)
        # print("Value range: ", value_range)
        # print("Pixel domain: ", pixel_domain)
        if value_type == "absolute":
            value = value_range[0] + (value_range[1] - value_range[0])\
                / (pixel_domain[1] - pixel_domain[0]) * (position - pixel_domain[0])
        else:
            value = abs((value_range[1] - value_range[0])\
                / (pixel_domain[1] - pixel_domain[0]) * (position))

        value = round(value, 2)
        if abs(round(value, 0) - value) < 0.01:
            value = int(round(value, 0))
    else:
        value_range = axis['value_range']
        value_range = [parse(item, default = datetime(2022, 1, 1)).timestamp()\
            for item in value_range]
        pixel_domain = axis['pixel_domain']
        if value_type == "absolute":
            # print("position", positions)
            value = value_range[0] + (value_range[1] - value_range[0])\
                / (pixel_domain[1] - pixel_domain[0]) * (position - pixel_domain[0])
        else:
            value = abs((value_range[1] - value_range[0])\
                / (pixel_domain[1] - pixel_domain[0]) * (position))
            
        value = int(value * 1000)
    return value

def find_same_color_vo(other_coords, color_set):
    color_str_list = list(color_set)
    print(color_str_list)
    # print(eval("none"))
    color_list = [[int(a) for a in re.findall(r'\d+', item)] for item in color_str_list]
    print(color_list)
    vo_candidate_dict = {}
    for color_str in color_str_list:
        vo_candidate_dict[color_str] = []

    def get_sim_color(fill, color_list):
        def get_diff(f1, f2):
            if len(f1) < 3 or len(f2) < 3:
                return 10000
            diff = sum([abs(f1[idx] - f2[idx]) for idx in range(3)])
            return diff
        diff_color = [get_diff(fill, item) for item in color_list]
        min_diff = min(diff_color)
        chosen_color_idx = [idx for idx in range(len(diff_color)) if diff_color[idx] == min_diff][0]
        if min_diff > 10:
            return None
        return color_str_list[chosen_color_idx]

    for current_coord in other_coords:
        visual_object = current_coord['visual_object']
        for vo in visual_object:
            if 'fill' in vo:
                key = "fill"
            elif 'stroke' in vo:
                key = "stroke"
            else:
                continue
            if vo[key] == "none":
                continue
            sim_color = get_sim_color(vo[key], color_list)
            if sim_color is not None:
                vo_candidate_dict[sim_color].append(vo)

    return vo_candidate_dict

def find_same_color_text(other_text, color_set):
    color_str_list = list(color_set)
    print(color_str_list)
    print(eval('[157, 123]'))
    # print(eval("none"))
    color_list = [[int(a) for a in re.findall(r'\d+', item)] for item in color_str_list]
    print(color_list)
    
    if (len(other_text) > 0):
        print("The color of other texts", other_text[0]['fill'])

    vo_candidate_dict = {}
    for color_str in color_str_list:
        vo_candidate_dict[color_str] = []

    def get_sim_color(fill, color_list):
        def get_diff(f1, f2):
            if len(f1) < 3 or len(f2) < 3:
                return 10000
            diff = sum([abs(f1[idx] - f2[idx]) for idx in range(3)])
            return diff
        diff_color = [get_diff(fill, item) for item in color_list]
        min_diff = min(diff_color)
        chosen_color_idx = [idx for idx in range(len(diff_color)) if diff_color[idx] == min_diff][0]
        if min_diff > 10:
            return None
        return color_str_list[chosen_color_idx]

    for vo in other_text:
        if 'fill' in vo:
            key = "fill"
        elif 'stroke' in vo:
            key = "stroke"
        else:
            continue
        if vo[key] == "none":
            continue
        sim_color = get_sim_color(vo[key], color_list)
        if sim_color is not None:
            vo_candidate_dict[sim_color].append(vo)

    return vo_candidate_dict


def get_all_text(original_vo):
    """
    Get all text elements from the original elements
    """
    all_text = [item for item in original_vo if item['type'] == 'text']
    return all_text

def get_axis_closest(current_axis, text_rect_list):

    min_dis = 100000
    close_text = None

    for text in text_rect_list:
        dis = rect_distance(current_axis['area'], text)
        if dis < min_dis and dis < 100:
            close_text = text 
            min_dis = dis 

    return close_text

def get_unit(all_text):
    possible_unit = ["%"]
    unit = ""
    possible_name = ""

    for text in all_text:
        for try_unit in possible_unit:
            if try_unit in text['content'].lower():
                unit = try_unit
                possible_name = text['content'].split(try_unit)[1]
                if len(possible_name) > 2:
                    return unit, possible_name

    return unit, possible_name

def classify_text(other_text, axis_x, axis_y):
    """
    Classify text according to other text
    """
    text_rect_list = []
    for text in other_text:
        text_rect = {
            "x": text['left'],
            "y": text['up'],
            'width': text['right'] - text['left'],
            "height": text["down"] - text['up'],
            "text": text
        }
        text_rect_list.append(text_rect)
    x_name = ""
    y_name = ""
    if axis_x is not None:
        x_chosen_text = get_axis_closest(axis_x, text_rect_list)
        if x_chosen_text is not None:
            x_name = x_chosen_text['text']['content']
            print("axis x text", x_name)
    if axis_y is not None:
        y_chosen_text = get_axis_closest(axis_y, text_rect_list)
        if y_chosen_text is not None:
            y_name = y_chosen_text['text']['content']
            print("axis y text", y_name)
    top_text_str = ""
    if len(text_rect_list) > 0:
        top_text_y = min([item['y'] for item in text_rect_list])
        top_text = [item for item in text_rect_list if item['y'] == top_text_y][0]
        top_text_str = top_text['text']['content']
    return x_name, y_name, top_text_str


def reverse_engineering_from_constraints(json_data, original_vo):
    """
    Calculate the data from the constraints
    """
    print("Begin reverse engineering from the constraints...")
    value_list_array = []
    print("The number ", len(json_data['CoordSys']))
    for i, current_obj in enumerate(json_data['CoordSys']):
        visual_object = current_obj['visual_object']
        control_point = current_obj['control_point']
        constraints = current_obj['constraints']
        print(f'The {i}-th coordinator of the', current_obj['coordinate_type'])
        value_list = []
        if "main_axis" in current_obj and current_obj['main_axis'] is not None:
            main_axis = current_obj['main_axis']['type']
            # print("main axis", main_axis)
            if main_axis == "x":
                other_axis = "y"
            else:
                other_axis = "x"


            if current_obj['coordinate_type'] == "line":
                for current_vo in visual_object:
                    for current_pid in current_vo['control_point']:
                        current_point = control_point[current_pid]
                        current_value = {}
                        current_value["x"] = current_point["should_x"]
                        current_value["y"] = current_point["should_y"]
                        current_value["color"] = current_vo['stroke']
                        current_value['x_type'] = "absolute"
                        current_value['y_type'] = "absolute"
                        current_value['related_vo'] = current_vo['id']
                        current_value['related_point'] = [current_pid]
                        value_list.append(current_value)

            elif "second_axis" in current_obj:
                pass
            else:
                fixed_ver = [item for item in constraints if item['type'] == "fixed-" + other_axis]        
                dealed_vo = []
                for cons in fixed_ver:
                    point_1 = control_point[cons['point1']]
                    point_2 = control_point[cons['point2']]
                    if point_1["should_" + main_axis] != point_2["should_" + main_axis]:
                        continue

                    if "control_by_" + main_axis in visual_object[point_1['obj_id']]\
                        and visual_object[point_1['obj_id']]['control_by_' + main_axis]:
                        if point_1['obj_id'] not in dealed_vo:
                            dealed_vo.append(point_1['obj_id'])
                            current_value = {}
                            current_value[other_axis] = abs(cons['distance'])
                            current_value[main_axis] = ["should_" + main_axis]
                            current_value["color"] = visual_object[point_1['obj_id']]['fill']
                            current_value[main_axis + '_type'] = "absolute"
                            current_value[other_axis + '_type'] = "relative"
                            current_value['related_vo'] = point_1['obj_id']
                            current_value['related_point'] = [item["id"]\
                                for item in control_point\
                                    if item['obj_id'] == point_1['obj_id']\
                                        and item[f'should_{main_axis}'] == point_1[f'should_{main_axis}']]
                            value_list.append(current_value)
                    
                    else:
                        current_value = {}
                        current_value[other_axis] = abs(cons['distance'])
                        current_value[main_axis] = point_1["should_" + main_axis]
                        current_value[main_axis + '_type'] = "absolute"
                        current_value[other_axis + '_type'] = "relative"
                        current_value["color"] = visual_object[point_1['obj_id']]['fill']
                        current_value['related_vo'] = point_1['obj_id']
                        current_value['related_point'] = [point_1['id'], point_2['id']]
                        value_list.append(current_value)
            

        elif current_obj['main_axis'] == None:
            visual_object = current_obj['visual_object']
            control_point = current_obj['control_point']
            if current_obj['coordinate_type'] == "line" and type(current_obj['x_axis']) == int and type(current_obj['y_axis']) == int:
                for vo in visual_object:
                    for cp_id in vo["control_point"]:
                        current_point = control_point[cp_id]
                        if "should_x" in current_point and "should_y" in current_point:
                            current_value = {}
                            current_value['x'] = current_point['should_x']
                            current_value['y'] = current_point['should_y']
                            current_value['x_type'] = "absolute"
                            current_value['y_type'] = "absolute"
                            current_value['color'] = vo['stroke']
                            current_value['related_vo'] = current_point['obj_id']
                            current_value['related_point'] = [current_point['id']]
                            value_list.append(current_value)
        print(current_obj['coordinate_type'], len(value_list))

        value_list_array.append(value_list)
    
    # print("Value length", len(value_list_array))
    
    # print('first value list', value_list_array[0])

    length_value = [len(item) for item in value_list_array]

    print('length value', length_value)
    max_length = max(length_value)
    max_idx = [idx for idx, item in enumerate(length_value) if item == max_length][0]

    important_coord = json_data['CoordSys'][max_idx]
    important_value = value_list_array[max_idx]

    x_axis_content = []
    y_axis_content = []

    important_x_axis = None
    important_y_axis = None

    if isinstance(important_coord['x_axis'], int):
        current_axis = json_data['axis']['x'][important_coord['x_axis']]
        direction = "x"
        important_x_axis = current_axis
        x_axis_content = [item['content'] for item in current_axis['tick'] if 'content' in item]

        print("X axis:", current_axis['range'], current_axis['tick']['position']['y'], x_axis_content)
        for value in important_value:
            # print(value, direction)
            value["parsed_" + direction] = get_axis_value(
                                            value[direction],
                                            current_axis,
                                            direction,
                                            value_type = value[direction + "_type"]
                                        )
    if isinstance(important_coord['y_axis'], int):
        direction = "y"
        current_axis = json_data['axis']['y'][important_coord['y_axis']]
        important_y_axis = current_axis 
        y_axis_content = [item['content'] for item in current_axis['tick'] if 'content' in item]
        print("Y axis:", current_axis['range'], current_axis['tick']['position']['x'], y_axis_content)
        

        for value in important_value:
            # print(value, direction)
            value["parsed_" + direction] = get_axis_value(value[direction],
                                current_axis,
                                direction,
                                value_type = value[direction + "_type"])
            
    

    # get all text
    all_text = get_all_text(original_vo)

    color_list = [str(item['color']) for item in important_value]
    color_set = set(color_list)
    legend_text = []
    color_mapping = {}
    print('color_set', color_set)
    if (len(color_set) > 1 and len(color_set) < 20):
        other_coords = [item for i, item in enumerate(json_data['CoordSys']) if i != max_idx]
        # get visual objects with the same type and color; legends
        sim_color_vo = find_same_color_vo(other_coords, color_set)
        axis_content = []
        axis_content.extend(x_axis_content)
        axis_content.extend(y_axis_content)
        other_text = [text for text in all_text if text['content'] not in axis_content]
        print("All text", len(all_text))
        print('Other text', len(other_text))
        # find the closest text of the legends
        text_vo = [get_vo_center(item) for item in other_text]
        min_dis_text = {}
        for color, vo_list in sim_color_vo.items():
            min_dis = 1000000
            min_text = ""
            for vo in vo_list:
                vo_center = get_vo_center(vo)
                for i, text in enumerate(text_vo):
                    dis = get_dis(vo_center, text)
                    if dis < min_dis and dis < 100:
                        min_dis = dis
                        min_text = other_text[i]
            min_dis_text[color] = min_text
        for i, color in enumerate(min_dis_text):
            color_mapping[color] = min_dis_text[color]['content']\
                if 'content' in min_dis_text[color] else f"Category_{i + 1}"
        
        # find text with same color
        same_color_text = find_same_color_text(other_text, color_set)
        # print("same color text", [(color, text_list[0]['content']) for color, text_list in same_color_text.items()])
        for color, text_list in same_color_text.items():
            if len(text_list) > 0:
                color_mapping[color] = text_list[0]['content'].strip()
        
        print("color_mapping", color_mapping)

        for color in min_dis_text:
            legend_text.append(color_mapping[color])

        print("legend_text", legend_text)
        for value in important_value:
            if "color" in value:
                value['parsed_legend'] = color_mapping[str(value['color'])]
    
    used_text = []
    used_text.extend(x_axis_content)
    used_text.extend(y_axis_content)
    used_text.extend(legend_text)
    other_text = [text for text in all_text if text['content'] not in used_text]

    name_dict = {}
    name_dict['x'], name_dict['y'], title = \
        classify_text(other_text, important_x_axis, important_y_axis)
    name_dict['legend'] = ''

    name_dict['y'] = ' '.join(name_dict['y'].split(' ')[:2])
    unit, possible_name = get_unit(all_text)
    important_axis = {}
    important_axis['x'] = important_x_axis
    important_axis['y'] = important_y_axis

    direction_dict = {}
    direction_dict['K'] = ''
    direction_dict['C'] = ''
    direction_dict['Q'] = ''
    direction_dict['O'] = ''

    if important_coord['main_axis'] is not None:
        main_name = important_coord['main_axis']['type']
    else:
        main_name = "x"


    other_name = "x" if main_name == "y" else 'y'
    
    # print("important_axis", important_axis)
    if important_axis[main_name] is not None and important_axis[main_name]["scale_type"] == "quantize":
        direction_dict['K'] = main_name
    else:
        direction_dict['O'] = main_name

    # print("???", important_axis['x']['scale_type'])
    
    format_data_list = []
    format_data = {}
    
    
    if important_axis['x'] is not None and important_axis['y'] is not None:
        if important_axis['x']['scale_type'] == 'time':
            main_name = 'x'
            other_name = "y"
            # print("aaaaaaa")
            direction_dict['O'] = "x"
            if important_axis['y']['scale_type'] == 'linear':
                direction_dict['Q'] = 'y'

        elif important_axis[other_name] is not None\
            and (important_axis[other_name]["scale_type"] == "linear"):
            direction_dict['Q'] = other_name

        if len(legend_text) > 0:
            if is_time_list(legend_text):
                if direction_dict['O'] != "":
                    direction_dict['O'] = "legend"
            else:
                if direction_dict['K'] == "":
                    direction_dict['K'] = "legend"
                else:
                    direction_dict['C'] = "legend"

        for value in important_value:
            new_data = {}
            for key in ["K", "Q", "C", "O"]:
                current_direction = direction_dict[key]
                if current_direction == "":
                    continue
                current_v = value['parsed_' + current_direction]
                if key == "O":
                    if isinstance(current_v, (int, float)):
                        if current_v < 3000:
                            current_v = str(int(current_v))
                if current_direction != "legend":
                    new_data[key + ' pixel'] = value[current_direction]
                else:
                    new_data['color'] = str(value['color'])

                new_data[key + ' value'] = current_v
                new_data['unit'] = unit

            for key in ['related_vo', 'related_point']:
                new_data[key] = value[key]
            format_data_list.append(new_data)

        format_data["mapping"] = []
        format_data['chosen_coord'] = important_coord['id']
        default_name_dict = {
            "O": "time",
            "K": "category",
            "C": "category",
            "Q": "value"
        }
        for key in ["K", "Q", "C", "O"]:
            current_direction = direction_dict[key]
            if current_direction == "":
                continue
            current_name = name_dict[current_direction]
            if current_name == '':
                current_name = default_name_dict[key]
            if key == "O":
                current_name = "time"
            format_data[key] = current_name
            current_mapping = {
                "name": current_name,
                "type": key,
                "direction": current_direction
            }
            format_data["mapping"].append(current_mapping)
        if "Q" not in format_data or format_data["Q"] == "":
            if title != "":
                format_data['Q'] = title
            elif possible_name != "":
                format_data['Q'] = possible_name
        for key in ['K', "Q", "C", "O"]:
            if key in format_data:
                for item in format_data_list:
                    item[key] = format_data[key]
        for item in format_data['mapping']:
            if item['type'] == "Q":
                item["unit"] = unit
            if item['type'] == "O":
                item['name'] = "time"
            if item["direction"] == "legend":
                if len(color_mapping.keys()) > 1:
                    item['map'] = color_mapping
                    
                    
    format_data['data_list'] = format_data_list
    format_data['unit'] = unit
    format_data['important_coord'] = max_idx
    # print("Format data mapping", format_data)
    with open("tmp/format_data_mapping.json", 'w') as f:
        json.dump(format_data, f, indent=4, ensure_ascii=False)

    return format_data

def update_data_list(format_data):
    """
    Update the data information according to the axis information
    """
    data_list = format_data["data_list"]
    mapping = format_data["mapping"]

    for d in mapping:
        attr_type = d["type"]
        if d["direction"] == "legend":
            for item in data_list:
                item[attr_type + " value"] = d["map"][item["color"]]
                item[attr_type] = d["name"]

        else:
            if attr_type == "Q":
                for item in data_list:
                    item[attr_type] = d["name"]
                    item['unit'] = d["unit"]


def get_dis(vo1, vo2):
    """
    Get the distance of two visual objects
    """
    dis = ((vo1['x'] - vo2['x']) ** 2 + (vo1['y'] - vo2['y']) ** 2) ** 0.5
    return dis


def get_vo_center(visual_object):
    """
    Get the center of a visual object
    """
    position = {}
    position['x'] = (visual_object['left'] + visual_object['right']) / 2
    position['y'] = (visual_object['up'] + visual_object['down']) / 2
    position['width'] = abs(visual_object['right'] - visual_object['left'])
    position['height'] = abs(visual_object['up'] - visual_object['down'])
    return position

def update_coord_sys_area_by_axis(main_coord_sys, axis):
    """
    Unify the range according to the area of coordinate system and axis
    """
    if axis['type'] == "x":
        begin_position = "x"
        interval = "width"
    else:
        begin_position = "y"
        interval = "height"

    area_left = main_coord_sys['area'][begin_position]
    area_right = main_coord_sys['area'][begin_position] +  main_coord_sys['area'][interval]
    axis_left = axis['area'][begin_position]
    axis_right = axis['area'][begin_position] + axis['area'][interval]
    unify_left = min([area_left, axis_left])
    unify_right = max([area_right, axis_right])
    main_coord_sys['area'][begin_position] = unify_left
    main_coord_sys['area'][interval] = unify_right - unify_left
    axis['area'][begin_position] = unify_left
    axis['area'][interval] = unify_right - unify_left

def only_keep_important_coord(
    data_constraints: dict
):
    """
    keep only the neccessary data
    """
    important_coord_id = data_constraints['parsed_data']['important_coord']
    data_constraints['CoordSys'] = [data_constraints['CoordSys'][important_coord_id]]
    main_coord_sys = data_constraints['CoordSys'][0]
    main_coord_sys['id'] = 0
    x_axis_index = main_coord_sys['x_axis']
    y_axis_index = main_coord_sys['y_axis']
    if x_axis_index is None:
        data_constraints['axis']['x'] = []
    else:
        data_constraints['axis']['x'] = [data_constraints['axis']['x'][x_axis_index]]
        update_coord_sys_area_by_axis(main_coord_sys, data_constraints['axis']['x'][0])
        if ('mapping' in data_constraints['parsed_data']):
            for mapping in data_constraints['parsed_data']['mapping']:
                if mapping['direction'] != "x":
                    continue
                mapping['value_range'] = data_constraints['axis']['x'][0]['value_range']
        main_coord_sys['x_axis'] = 0
    if y_axis_index is None:
        data_constraints['axis']['y'] = []
    else:
        data_constraints['axis']['y'] = [data_constraints['axis']['y'][y_axis_index]]
        update_coord_sys_area_by_axis(main_coord_sys, data_constraints['axis']['y'][0])
        for mapping in data_constraints['parsed_data']['mapping']:
            if mapping['direction'] != "y":
                continue
            mapping['value_range'] = data_constraints['axis']['y'][0]['value_range']
        main_coord_sys['y_axis'] = 0

    if 'mapping' in data_constraints['parsed_data']:
        for mapping in data_constraints['parsed_data']['mapping']:
            if mapping['direction'] == "legend":
                mapping['value_range'] = [item[1] for item in mapping['map'].items()]

    for visual_object in main_coord_sys['visual_object']:
        visual_object['coordinate_id'] = 0
        if 'original_soup' in visual_object:
            del visual_object['original_soup']

    for control_point in main_coord_sys['control_point']:
        control_point['coordinate_id'] = 0

    svg_soup = data_constraints['svg_soup']
    # remove the visual marks that have shown in the main coordinator
    for visual_object in main_coord_sys['visual_object']:
        try:
            svg_soup.find_all(attrs={"uuid_mani": visual_object['uuid']})[0].decompose()
        except:
            print("Delete UUID", visual_object['uuid'], "failed")
            # print(visual_object['uuid'])

    # remove the tick content used
    for axis in data_constraints['axis']['x'] + data_constraints['axis']['y']:
        for tick in axis['tick']:
            if 'visual_object_uuid' not in tick:
                continue
            soup_num = svg_soup.find_all(attrs={"uuid_mani": tick['visual_object_uuid']})
            if len(soup_num) > 0:
                soup_num[0].decompose()
            else:
                print("Remove tick content", tick['content'])
    data_constraints['svg_string'] = str(svg_soup)
    del data_constraints['svg_soup']
    return

def get_constraints_with_data(svg_string):
    """
    Get constraints with data from an svg string
    """
    json_data, original_vo = deducing_chart_separate(svg_string, remove_soup = False)

    try:
        data_information = reverse_engineering_from_constraints(json_data,  original_vo)
        json_data['parsed_data'] = data_information
        only_keep_important_coord(json_data)
        return json_data
    except:
        print("Error in reverse_engineering_from_constraints")
        json_data = convert_to_serializable(json_data)
        return json_data

if __name__ == "__main__":
    # with open("tmp/revenue.svg", encoding='utf8') as f:
    # with open("tmp/line_chart.svg", encoding='utf8') as f:
    # with open("tmp/energy.svg", encoding='utf8') as f:
    # with open("./tmp/america_ethni.svg", encoding='utf8') as f:
    # with open('tmp/bar_facebook.svg') as f:
    # with open('../web_page/chosen_svg/example.svg') as f:

    # file_name = ['tmp/revenue', 'tmp/line_chart', 'energy', 'america_ethni']
    # file_name = "war_without_line"
    # file_name = "war_short" # manipulate/server/web_page/chosen_svg/war_short.svg
    # with open(f'../web_page/chosen_svg/{file_name}.svg') as f:
    #     string = f.read()
    #     constraints_with_data = get_constraints_with_data(string)
    #     with open(f'../web_page/chosen_json/{file_name}.json', "w", encoding='utf8') as f:
    #         json.dump(constraints_with_data, f, indent = 2)
    #     with open('../web_page/chosen_json/latest_result.json', "w", encoding='utf8') as f:
    #         json.dump(constraints_with_data, f, indent = 2)
    #     with open('tmp/tmp.svg', 'w', encoding= 'utf8') as f:
    #         f.write(constraints_with_data['svg_string'])


    # file_name = "20210817_linechart" # manipulate/server/web_page/chosen_svg/war_short.svg
    # file_name = "multi_line"
    file_name = "20210819_bar"
    # file_name = "20210831_bubble_stack_nyt"
    # file_name = "20210817_linechart"
    # file_name = "download"

    file_name = "20210822_group_bar"
    
    
    file_name = "20210811_stack"
    
    # file_name = "war_short"
    
    
    # file_name = "20210822_group_bar"
    
    # file_name = "multi_line"
    

    with open(f'test_example/{file_name}.svg') as f:
        string = f.read()
        constraints_with_data = get_constraints_with_data(string)
        print("GET constraints with data:")
        with open(f'output/{file_name}.json', "w", encoding='utf8') as f:
            json.dump(constraints_with_data, f, indent = 2)
        with open('tmp/tmp.svg', 'w', encoding= 'utf8') as f:
            f.write(constraints_with_data['svg_string'])
        with open('tmp/latest_result.json', "w", encoding='utf8') as f:
            json.dump(constraints_with_data, f, indent = 2)
        with open('./test_webpage/chosen_json/latest_result.json', "w", encoding='utf8') as f:
            json.dump(constraints_with_data, f, indent = 2)
        # with open('../web_page/chosen_json/latest_result.json', "w", encoding='utf8') as f:
        #     json.dump(constraints_with_data, f, indent = 2)    

        #用于debug存文件,可以删除
        with open('DEBUG/1_debug_svg_string.svg', "w", encoding='utf8') as f:
            f.write(constraints_with_data['svg_string'])
        with open('DEBUG/1_debug_latest_result.json', "w", encoding='utf8') as f:
            json.dump(constraints_with_data, f, indent=2)