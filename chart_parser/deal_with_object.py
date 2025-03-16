
# pylint: disable=import-error

# calcualte the groups of elements
from os import remove
import networkx as nx

import svgpathtools

import time

import copy

# from parse_control_point import pack_point

import numpy as np 

from scipy.fftpack import fft
import json
from unionset import DisjointSet

import math

# classify the groups by the size of the visual objects.
# the bars are classified into several groups
# the several area are classified.
# width, height, left, right, top, bottom, color

def pack_point(x, y, index, obj_id, radius = 0, fixed = False):

    point = {"ox": x, "oy": y, "id": index, 'obj_id': obj_id, "radius": radius }
    # if index == 3030:
    #     print("asdfasdf", point)
    if fixed:
        point['fixed'] = True
    return point

def classify_groups_by_size(visual_objects, control_points, axes_candidate, remove_soup = True):
    """
    Get classified groups by size
    """
    x_even_list, y_even_list = get_even_intervals_new(visual_objects, control_points)


    x_even_set = set([item['vid'] for item in x_even_list])
    y_even_set = set([item['vid'] for item in y_even_list])

    # cross the size 
    shared_stack_group_x = find_shared_value_group_by_visual_element(
                                x_even_set,
                                visual_objects,
                                control_points,
                                direction = "x")
    shared_stack_group_y = find_shared_value_group_by_visual_element(
                                y_even_set,
                                visual_objects,
                                control_points,
                                direction = "y")

    line_group, vertical_line = find_line_group(
                                visual_objects,
                                control_points)
    point_group = find_point_group(visual_objects, control_points)
    shared_width_group, shared_height_group = get_same_size_group_list(
                                visual_objects,
                                similar_rate = 0.05)

    chosen_group = calculate_group(
                                shared_stack_group_x,
                                shared_stack_group_y,
                                shared_width_group,
                                shared_height_group,
                                point_group,
                                line_group,
                                vertical_line)

    for item in chosen_group:
        print(item['type'], len(item['vid']), item['vid'])

    CoordSys = []
    coordinate_id = 0
    chosen_group.reverse()
    
    for visual_area_clique in chosen_group:
        if visual_area_clique['type'] == 'stack_x':
            new_visual_objects, new_control_points, main_axis = re_interpolate_visual_area(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = 'x',
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, [main_axis])
            add_main_axis_info(x_axis, y_axis, axes_candidate, main_axis)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1

        elif visual_area_clique['type'] == 'stack_y':
            new_visual_objects, new_control_points, main_axis = re_interpolate_visual_area(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = "y",
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, [main_axis])
            add_main_axis_info(x_axis, y_axis, axes_candidate, main_axis)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1

        elif visual_area_clique['type'] == 'shared_width':
            new_visual_objects, new_control_points, main_axis_list = get_new_vo_cp(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = "x",
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, main_axis_list)
            for main_axis in main_axis_list:
                add_main_axis_info(x_axis, y_axis, axes_candidate, main_axis)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis_list, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1

        elif visual_area_clique['type'] == 'shared_height':
            new_visual_objects, new_control_points, main_axis_list = get_new_vo_cp(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = "y",
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, main_axis_list)
            for main_axis in main_axis_list:
                add_main_axis_info(x_axis, y_axis, axes_candidate, main_axis)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis_list, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1

        elif visual_area_clique['type'] == "line":
            new_visual_objects, new_control_points, main_axis_list = get_new_vo_cp(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = None,
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, main_axis_list)
            print("main_axis_list", main_axis_list)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis_list, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1

        elif visual_area_clique['type'] == "point":
            new_visual_objects, new_control_points, main_axis_list = get_new_vo_cp(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = None,
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, main_axis_list)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis_list, coordinate_id, coordinate_type = visual_area_clique['type']))
            if x_axis is None or y_axis is None:
                crowd_groups = get_crowd_points(new_visual_objects, new_control_points)
                CoordSys[-1]['crowd_groups'] = crowd_groups
            coordinate_id += 1
            
        elif visual_area_clique['type'] == "vertical_line":
            new_visual_objects, new_control_points, main_axis_list = get_new_vo_cp(
                visual_area_clique,
                visual_objects,
                control_points,
                direction = None,
                remove_soup = remove_soup
            )
            x_axis, y_axis = get_axis(new_visual_objects, new_control_points, axes_candidate, main_axis_list)
            CoordSys.append(get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis_list, coordinate_id, coordinate_type = visual_area_clique['type']))
            coordinate_id += 1
            

    # print(fake_candidate_list)
    return CoordSys

def add_main_axis_info(x_axis, y_axis, axes_candidate, main_axis):

    # if (isinstance(main_axis, list)):
    #     main_axis_list = main_axis 
    print("Show Axis", x_axis, y_axis)

    main_axis['direction'] = "larger"
    main_axis['another_scale'] = "linear"

    if x_axis != None:
        x_axis = axes_candidate['x'][x_axis]
    if y_axis != None:
        y_axis = axes_candidate['y'][y_axis]

    if x_axis != None and y_axis != None:
        if (main_axis['type'] == "y"):
            # Y axis is in the left of x_axis
            if y_axis['another_attr'] < (x_axis['pixel_domain'][0] + x_axis['pixel_domain'][1]) / 2:
                main_axis['direction'] = "larger"
            else: # Y axis is in the right of x axis
                main_axis['direction'] = "smaller"
            main_axis['another_scale'] = x_axis['scale_type'] 
        elif (main_axis['type'] == "x"):
            # X axis is in the top of Y axis
            if x_axis['another_attr'] < (y_axis['pixel_domain'][0] + y_axis['pixel_domain'][1]) / 2:
                main_axis['direction'] = "larger"
            else: # X axis is in the bottom of Y axis
                main_axis['direction'] = "smaller"
            main_axis['another_scale'] = y_axis['scale_type']


    if main_axis['type'] == 'y' and y_axis != None:
        if main_axis['even_type'] == "group":
            # print('main axis', main_axis)
            # print("origin axis", y_axis)
            text_tick = [tick for tick in y_axis['tick'] if isinstance(tick['visual_object'], int)]
            new_tick = [{"position": tick['position']['y']} for tick in text_tick]
            print('new tick', new_tick)
            inter = 100
            if (len(new_tick) >= 2):
                inter = new_tick[1]['position'] - new_tick[0]['position']

            for item in new_tick:
                item['range'] = [item['position'] - inter / 2, item['position'] + inter / 2]

            main_axis['tick_position'] = new_tick

    elif main_axis['type'] == 'x' and x_axis != None:
        # print("show main axis", main_axis)
        if main_axis['even_type'] == "group":
            # print('main axis', main_axis)
            # print("origin axis", x_axis)
            text_tick = [tick for tick in x_axis['tick'] if isinstance(tick['visual_object'], int)]
            new_tick = [{"position": tick['position']['x']} for tick in text_tick]
            print('new tick', new_tick)
            inter = 100
            if (len(new_tick) >= 2):
                inter = new_tick[1]['position'] - new_tick[0]['position']

            for item in new_tick:
                item['range'] = [item['position'] - inter / 2, item['position'] + inter / 2]

            main_axis['tick_position'] = new_tick




def calculate_group(shared_stack_group_x, shared_stack_group_y, shared_width_group, shared_height_group, point_group, line_group, vertical_line):
    chosen_group = []

    shared_stack_x = [item for item in shared_stack_group_x if len(item['tick']) > 2]
    shared_stack_y = [item for item in shared_stack_group_y if len(item['tick']) > 2]

    # chosen.extend(shared_stack_x)


    shared_stack = shared_stack_x + shared_stack_y

    shared_stack.sort(key = lambda x: -len(x['vid']))

    existed_vid_set = set([])

    print("shared_stack_x", shared_stack_x)

    for current_stack in shared_stack:
        current_stack_vid_set = set(current_stack['vid']) - existed_vid_set
        if len(current_stack_vid_set) >= 2:
            current_stack['vid'] = list(current_stack_vid_set)
            chosen_group.append(current_stack)
            existed_vid_set = existed_vid_set | current_stack_vid_set # add the list to the existing set
            print('existed_vid_set', existed_vid_set)

    shared_size = shared_width_group + shared_height_group

    shared_size.sort(key = lambda x: -len(x['vid']))

    for current_size in shared_size:
        current_size_vid_set = set(current_size['vid']) - existed_vid_set
        if len(current_size_vid_set) >= 2:
            current_size['vid'] = list(current_size_vid_set)
            chosen_group.append(current_size)
            existed_vid_set = existed_vid_set | current_size_vid_set # add the list to the existing set

    if (len(point_group['vid']) > 0):
        chosen_group.append(point_group)

    if (len(line_group['vid']) > 0):
        chosen_group.append(line_group)

    if (len(vertical_line['vid']) > 0):
        chosen_group.append(vertical_line)


    # print("chosen_group", )


    # shared_stack_y = [item for item in shared_stack_group_y if len(item['tick']) > 2]

    # print("shared_stack_y", shared_stack_y)


    return chosen_group

def get_same_size_group_list(visual_objects, similar_rate):

    width_list = [{'size': round(item['right'] - item['left'], 1), 'id': item['id']} for item in visual_objects if item['type'] == "area"]

    height_list = [{'size': round(item['down'] - item['up'], 1), 'id': item['id']} for item in visual_objects if item['type'] == "area"]

    # height_list = [{'size': item['down'] - item['up'], 'id': item['id']} for item in visual_objects if item['type'] == 'area']

    width_dict_items = get_same_size_group(width_list, similar_rate)
    height_dict_items = get_same_size_group(height_list, similar_rate)


    shared_width_group = [{'vid': item[1], 'size': item[0], 'type': 'shared_width'} for item in width_dict_items if len(item[1]) > 1]
    shared_height_group = [{'vid': item[1], 'size': item[0], 'type': 'shared_height'} for item in height_dict_items if len(item[1]) > 1]


    # print('shared_width_group', shared_width_group)
    # print('shared_height_group', shared_height_group)

    # get_same_size_group(height)

    return shared_width_group, shared_height_group

def get_same_size_group(size_list, similar_rate):
    # sort the size of the list

    size_list.sort(key = lambda x: x['size'])
    size_dict = {}

    current_size = 0
    size_dict[current_size] = []

    for item in size_list:
        size = item['size']

        # print("size", size)

        if size > current_size * (1 + similar_rate) or size > current_size + 3:
            current_size = size
            size_dict[current_size] = []

        size_dict[current_size].append(item['id'])


        # if size not in size_dict:
        #     size_dict[size] = []
        
        # size_dict[size].append(item['id'])

    size_dict_items = list(size_dict.items())

    return size_dict_items


def get_crowd_points(visual_objects, control_points, max_inter = 10):
    point_vo = [vo for vo in visual_objects if vo['type'] == "point"]
    points = [control_points[item['control_point'][0]] for item in point_vo]
    ds = DisjointSet()
    point_num = len(points)
    inter_dict = {}

    for i in range(point_num):
        point_1 = points[i]
        for j in range(i + 1, point_num):
            point_2 = points[j]
            dis = math.sqrt(pow(point_1['ox'] - point_2['ox'], 2) + pow(point_1['oy'] - point_2['oy'], 2))
            if dis < point_1["radius"] + point_2["radius"] + max_inter:
                ds.add(point_1['id'], point_2['id'])
                inter = dis - point_1['radius'] - point_2['radius']
                # print("Closest", point_1['id'], point_2['id'], inter)
                if int(inter) not in inter_dict:
                    inter_dict[int(inter)] = 1
                else:
                    inter_dict[int(inter)] += 1

    inter_list = list(inter_dict.items())
    if (len(inter_list) == 0):
        return []

    inter_list.sort(key = lambda x: -x[1])
    print("inter list", inter_list)
    max_inter = inter_list[0][0] + 1
    print("max_inter", max_inter)

    groups = []

    for key in ds.group:
        current_group = ds.group[key]
        if len(current_group) < 5:
            continue
        current_points = [points[pid] for pid in current_group]
        center_x = sum([point['ox'] for point in current_points]) / len(current_points)
        center_y = sum([point['oy'] for point in current_points]) / len(current_points)
        group = {}
        group['pid'] = list(current_group)
        group['inter'] = max_inter 
        group['center'] = {"x": center_x, "y": center_y}
        print("center position", group['center'])
        groups.append(group)



    # print("point group", groups)

    return groups

def get_axis(visual_objects, control_points, axes_candidate, main_axis_list = []):
    # print(axes_candidate)
    def get_overlap(range_main, range_sec):
        overlap = min(max(range_main), max(range_sec)) - max(min(range_main), min(range_sec))
        sec_range = abs(range_sec[1] - range_sec[0])
        main_range = abs(range_main[1] - range_main[0])

        useful_rate = (overlap + 0.01) / (main_range + 0.01)
        coverage = (overlap + 0.01) / (sec_range + 0.01)


        return min([coverage, useful_rate])

    def get_max_closest(list_coverage):

        if (len(list_coverage) == 0):
            return []
        max_rate = 0.8
        max_coverage = max(list_coverage)
        barrier = max_coverage * max_rate
        barrier = max([barrier, 0.5])

        list_coverage = np.asarray(list_coverage)

        return list(list_coverage == max_coverage)

    def get_closest_idx(candidate, attr_range):
        average_list = []

        if len(candidate) == 0:
            return None


        for item in candidate:
            print("another attr", item['another_attr'])
            axis_position = item['another_attr']

            distance_list = [abs(item - axis_position) for item in attr_range]
            avg_dis = sum(distance_list) / len(distance_list)
            print('average distance', avg_dis)
            average_list.append(avg_dis)
        return average_list.index(min(average_list))
    print('length of visual_objects', len(visual_objects))
    print('length of control_points', len(control_points))


    # calculate which axis can cover most of the axis and the axis is closest 
    # to the visual mark

    x_list = [item['ox'] for item in control_points]
    y_list = [item['oy'] for item in control_points]

    if (len(x_list) == 0):
        print('the control point is empty')

    x_range = [min(x_list), max(x_list)]
    y_range = [min(y_list), max(y_list)]

    print("x_range", x_range)
    print("y_range", y_range)

    for item in axes_candidate['x']:
        print("x axis range,", item['range'])
    for item in axes_candidate['y']:
        print('y axis range.', item['range'])

    # for x_candicate in axes_candidate['x']:
    #     print("candidate_range", x_candicate['range'])

    # get x axis
    x_coverage = [get_overlap([item['range']['begin'], item['range']['end']], x_range) for item in axes_candidate['x']]
    print("x_coverage", x_coverage)

    chosen_x = get_max_closest(x_coverage)

    x_candidate = [item for i, item in enumerate(axes_candidate['x']) if chosen_x[i]]


    x_axis = get_closest_idx(x_candidate, y_list)

    # x_axis = axes_candidate['x'][x_coverage.index(max(x_coverage))]

    
    # get y axis
    y_coverage = [get_overlap([item['range']['begin'], item['range']['end']], y_range) for item in axes_candidate['y']]
    chosen_y = get_max_closest(y_coverage)

    y_candidate = [item for i, item in enumerate(axes_candidate['y']) if chosen_y[i]]
    y_axis = get_closest_idx(y_candidate, x_list)


    # check axis
    if x_axis != None:
        x_axis_object = axes_candidate['x'][x_axis]
        if x_axis_object['scale_type'] == "quantize":
            is_matched = False 
            for main_axis in main_axis_list:
                if main_axis['type'] == "x" and main_axis['even_type'] != False:
                    is_matched = True
            if not is_matched:
                x_axis = None

    def check_axis_quantize(axis_idx, direction = "x"):
        if axis_idx == None:
            return None

        axis_object = axes_candidate[direction][axis_idx]
        if axis_object['scale_type'] == "quantize":
            is_matched = False 
            for main_axis in main_axis_list:
                if main_axis['type'] == direction and main_axis['even_type'] != False:
                    is_matched = True
                    break
            if not is_matched:
                return None

        return axis_idx

    x_axis = check_axis_quantize(x_axis, direction = "x")
    y_axis = check_axis_quantize(y_axis, direction = "y")    
            

    if x_axis != None:
        current_axis = axes_candidate['x'][x_axis]
        current_axis['use_num'] += 1

    if y_axis != None:
        current_axis = axes_candidate['y'][y_axis]
        current_axis['use_num'] += 1


    return x_axis, y_axis

def get_fake_coordsys(new_visual_objects, new_control_points, x_axis, y_axis, main_axis, coordinate_id = 0, coordinate_type = "stack_x"):
    second_axis = ''
    if isinstance(main_axis, list):
        main_axis_list = main_axis 
        if len(main_axis_list) >= 2:
            main_axis = main_axis_list[0]
            second_axis = main_axis_list[1]
        elif len(main_axis_list) == 1: 
            main_axis = main_axis_list[0]
        else:
            main_axis = None

    for point in new_control_points:
        point['x'] = point['ox']
        point['y'] = point['oy']

    for vo in new_visual_objects:
        vo['x_min'] = vo['left']
        vo['x_max'] = vo['right']
        vo['y_min'] = vo['up']
        vo['y_max'] = vo['down']


    x_list = [item['ox'] for item in new_control_points]
    y_list = [item['oy'] for item in new_control_points]


    CoordSys = {
        "id": coordinate_id,
        "coordinate_type": coordinate_type,
        "origin": [
          0,
          0
        ],
        "plotarea": {
          "x": {
            "min": min(x_list),
            "max": max(x_list)
          },
          "y": {
            "min": min(y_list),
            "max": max(y_list)
          }
        },
        "transform": {
          "type": "simple",
          "x_rate": 1,
          "y_rate": 1,
          "origin": [
            0,
            0
          ]
        },
        'x_axis': x_axis,
        'y_axis': y_axis,
        'main_axis': main_axis,
    }

    if second_axis != '':
        CoordSys['second_axis'] = second_axis
        print('hhhhhhhh', second_axis)

    CoordSys['control_point'] = new_control_points
    for item in new_control_points:
        item['coordinate_id'] = coordinate_id
    for item in new_visual_objects:
        item['coordinate_id'] = coordinate_id
    CoordSys['visual_object'] = new_visual_objects
    CoordSys['visual_object_num'] = len(new_visual_objects)
    CoordSys["constraints"] = []
    return CoordSys

def get_interval(input_array):

    # print('input', input_array)
    if len(input_array) == 1:
        return []

    N = len(input_array)
    half_N = int(N/2)
    input_array = np.asarray(input_array)

    freq_result = fft(input_array)
    fp = np.abs(freq_result)[0: half_N]

    fp = fp / max(fp)

    chosen_peak = []
    for i in range(1, len(fp) - 1):
        if fp[i] > fp[i - 1] and fp[i] > fp[i + 1] and fp[i] > 0.8:
            chosen_peak.append(i)

    freq_list = []

    for i in chosen_peak:
        if i < 3:
            continue

        add_flag = True

        for j_idx, j in enumerate(freq_list):
            if i - 1 < round(i / j) * j < i + 1:
                add_flag = False
                freq_list[j_idx] = i / round(i / j)
                break

        if add_flag:
            freq_list.append(i)

    interval_list = [N / freq for freq in freq_list]
    return interval_list





def judge_evenly(visual_objects, direction = 'y', require_interval = False):

    if direction == "x":
        real_center_list = [(item['left'] + item['right']) / 2 for item in visual_objects]
    else:
        real_center_list = [(item['up'] + item['down']) / 2 for item in visual_objects]

    real_center_list.sort()
    center_list = [int(item) for item in real_center_list]

    value_range = max([(real_center_list[-1] - real_center_list[0])/800, 1])

    # print('real_center_list', real_center_list)
    # print('len center list', center_list)
    count_list = get_count_list(center_list)
    # print(f'{direction} count list', len(count_list))
    interval_list = get_interval(count_list)
    # print(interval_list)

    if require_interval:
        return interval_list


    if len(interval_list) == 0:
        if require_interval:
            return False, interval_list
        return False

    elif len(interval_list) > 1:
        if require_interval:
            return "group", interval_list
        return "group"

    else:
        interval = interval_list[0]
        ds = DisjointSet()
        center_num = len(real_center_list)

        for i in range(center_num):
            current_value = real_center_list[i]
            for j in range(i + 1, center_num):
                next_value = real_center_list[j]
                # print("diff time", abs(abs(next_value - current_value) - interval))
                if abs(abs(next_value - current_value) - interval) < value_range:
                    ds.add(current_value, next_value)
                if (next_value - current_value) > interval * 1.5:
                    break

        groups_num = [len(ds.group[idx]) for idx in ds.group]

        print("groups num", groups_num)

        count_dict = {}

        for num in groups_num:
            if num not in count_dict:
                count_dict[num] = 0
            count_dict[num] += 1

        for key in count_dict:
            if count_dict[key] >= 2:
                if require_interval:
                    return "group", interval_list
                return 'group'
        if require_interval:
            return "single", interval_list
        return 'single'


    # print(f"{direction} count interval", interval)


    return "wrong answer"


def get_count_list(x_center):
    count = {}
    for i in x_center:
        if i not in count:
            count[i] = 1
        else:
            count[i] += 1

    # print("count value", count)
    min_key = min(list(count.keys()))
    max_key = max(list(count.keys()))

    count_list = []
    for i in range(min_key, max_key + 1):
        if i in count:
            count_list.append(count[i])
        else:
            count_list.append(0.0)

    return count_list



def deepcopy(item):
    if isinstance(item, list):
        new_item = [deepcopy(item_small) for item_small in item]
        return new_item
    new_item = {}
    for key in item:
        new_item[key] = item[key]
    return new_item

def get_new_vo_cp(
    visual_area_clique,
    visual_objects,
    control_points,
    direction = 'x',
    remove_soup = True
):
    """
    Calculate new visual object and control points.
    """
    old_visual_objects = [visual_objects[vid] for vid in visual_area_clique['vid']]
    new_visual_objects = []
    new_control_points = []
    point_id = 0
    for i, current_vo in enumerate(old_visual_objects):
        if 'original_soup' in current_vo and remove_soup:
            current_vo['original_soup'].decompose()
            current_vo.pop('original_soup', None)


        current_vo = deepcopy(current_vo)
        current_vo['id'] = i 
        for j, _ in enumerate(current_vo['control_point']):
            cp_idx = current_vo['control_point'][j]
            current_old_point = control_points[cp_idx]
            current_new_point = pack_point(
                current_old_point['ox'],
                current_old_point['oy'],
                point_id,
                i,
                radius = current_old_point['radius'])
            new_control_points.append(current_new_point)
            current_vo['control_point'][j] = point_id
            point_id += 1

        new_visual_objects.append(current_vo)

    def get_tick_position_set(current_direction = "x"):
        tick_position_set = set([])
        for current_vo in new_visual_objects:
            if current_direction == "x":
                current_tick = round((current_vo['left'] + current_vo['right']) / 2, 1)
            else:
                current_tick = round((current_vo['up'] + current_vo['down']) / 2, 1)

            tick_position_set.add(current_tick)

        return tick_position_set

    def get_tick_position(tick_position_set):
        tick_position_list = list(tick_position_set)
        tick_position_list.sort()
        tick_num = len(tick_position_list)
        tick_position = []

        if tick_num < 2:
            for i, tick in enumerate(tick_position_list):
                current_tick = {}
                current_tick['position'] = tick
                inter = 100
                current_tick['range'] = [tick - inter, tick + inter]
            tick_position.append(current_tick)

        else:
            for i, tick in enumerate(tick_position_list):
                current_tick = {}
                current_tick['position'] = tick
                if i == 0:
                    inter = (tick_position_list[1] - tick) / 2
                    current_tick['range'] = [tick - inter, tick + inter]
                elif i == tick_num - 1:
                    inter = (tick - tick_position_list[tick_num - 2]) / 2
                    current_tick['range'] = [tick - inter, tick + inter]
                else:
                    current_tick['range'] = [
                        (tick + tick_position_list[i - 1]) / 2,
                        (tick + tick_position_list[i + 1]) / 2]

                tick_position.append(current_tick)
        return tick_position

    x_evenly = judge_evenly(new_visual_objects, 'x')
    y_evenly = judge_evenly(new_visual_objects, 'y')

    main_axis_list = []

    if (x_evenly or direction == "x"):
        tick_position_set = get_tick_position_set("x")
        tick_position = get_tick_position(tick_position_set)
        current_axis = {}
        current_axis['type'] = 'x'
        current_axis['tick_position'] = tick_position
        current_axis['even_type'] = x_evenly
        main_axis_list.append(current_axis)

    if (y_evenly or direction == "y"):
        tick_position_set = get_tick_position_set("y")
        tick_position = get_tick_position(tick_position_set)
        current_axis = {}
        current_axis['type'] = 'y'
        current_axis['tick_position'] = tick_position
        current_axis['even_type'] = y_evenly
        main_axis_list.append(current_axis)

    print('new_visual_objects', len(new_visual_objects))
    print('new_control_points', len(new_control_points))


    return new_visual_objects, new_control_points, main_axis_list


def add_miss_point(point_list, tick_list, direction = 'x'):
    begin_tick = 0
    check_point = []
    for i, tick in enumerate(tick_list):
        check_point = [item for item in point_list if item[direction] == tick]
        if len(check_point) > 0:
            begin_tick = i
            break
    
    if len(check_point) == 1:
        idx = [idx for idx, point in enumerate(point_list) if point['x'] == check_point[0]['x'] and point['y'] == check_point[0]['y']][0]
        print("position_of_list", idx)
        # print(point_list)
        point_list.insert(idx, {'x': check_point[0]['x'], 'y': check_point[0]['y']})



def re_interpolate_visual_area(
    visual_area_clique,
    visual_objects,
    control_points,
    direction = "x",
    remove_soup = True
):
    """
    Re-interpolate visual area
    """
    useful_tick = visual_area_clique['tick']
    print("useful_tick", len(useful_tick), useful_tick)
    eps = (useful_tick[-1] - useful_tick[0]) / float(len(useful_tick)) / 5 # the presion of the tick is 1/5 of the interval
    begin_time = time.time()
    new_visual_objects = [visual_objects[vid] for vid in visual_area_clique['vid']]

    point_id = 0

    new_point_list_group = []

    if direction == "x":
        main_dim = 'ox'
        sec_dim = 'oy'
        another_direction = "y"
    else:
        main_dim = 'oy'
        sec_dim = 'ox'
        another_direction = "x"

    def move_start_end(value, sim_value, eps):
        if (abs(value - sim_value) < eps):
            return sim_value
        return value



    for i, current_vo in enumerate(new_visual_objects):
        new_point_list = []
        vo_points = current_vo['control_point']
        vo_points_num = len(vo_points)

        for i in range(vo_points_num):
            current_idx = i
            next_idx = (i + 1) % vo_points_num
            current_point = control_points[vo_points[current_idx]]
            next_point = control_points[vo_points[next_idx]]
            start_x = current_point[main_dim]
            end_x = next_point[main_dim]

            start_x = move_start_end(start_x, useful_tick[0], eps)
            start_x = move_start_end(start_x, useful_tick[-1], eps)
            end_x = move_start_end(end_x, useful_tick[0], eps)
            end_x = move_start_end(end_x, useful_tick[-1], eps)


            # print("Interpolate:", start_x, end_x, eps)

            if start_x == end_x:
                for tick in useful_tick:
                    if abs(tick - start_x) < eps:
                        if direction == "x":
                            new_point_list.append({'x': tick, 'y': current_point['oy']})
                        else:
                            new_point_list.append({'x': current_point['ox'], 'y': tick})

            elif start_x < end_x:
                for tick_idx, tick in enumerate(useful_tick):
                    # if tick_idx == 0:
                    #     if abs(tick - start_x) < eps:
                    #         if direction == "x":
                    #             new_point_list.append({'x': tick, 'y': current_point['oy']})
                    #         else:
                    #             new_point_list.append({'x': current_point['ox'], 'y': tick})
                    
                    # if tick_idx == len(useful_tick) - 1:
                    #     if abs(tick - end_x) < eps:
                    #         if direction == "x":
                    #             new_point_list.append({'x': tick, 'y': current_point['oy']})
                    #         else:
                    #             new_point_list.append({'x': current_point['ox'], 'y': tick})
                    
                                
                    if start_x <= tick < end_x:
                        # If tick is near start_x
                        if abs(tick - start_x) < eps and abs(tick - start_x) < abs(tick - end_x):
                            if direction == "x":
                                new_point_list.append({'x': tick, 'y': current_point['oy']})
                            else:
                                new_point_list.append({'x': current_point['ox'], 'y': tick})

                        elif abs(end_x - tick) < eps:
                            if direction == "x":
                                new_point_list.append({'x': tick, 'y': next_point['oy']})
                            else:
                                new_point_list.append({'x': next_point['ox'], 'y': tick})

                        else:
                            if direction == 'x':
                                tmpline = svgpathtools.Line(complex(tick, current_vo['up'] - 100), complex(tick, current_vo['down'] + 100))
                                current_seg = svgpathtools.Line(complex(start_x, current_point['oy']), complex(end_x, next_point['oy']))
                            else:
                                tmpline = svgpathtools.Line(complex(current_vo['left'] - 100, tick), complex(current_vo['right'] + 100, tick))
                                current_seg = svgpathtools.Line(complex(current_point['ox'], start_x), complex(next_point['ox'], end_x))
                            intersect = svgpathtools.Path(tmpline).intersect(svgpathtools.Path(current_seg))

                            if (len(intersect) > 0):
                                if direction == "x":
                                    new_point_list.append({'x': tick, "y": tmpline.point(intersect[0][0][0]).imag})
                                else:
                                    new_point_list.append({'x': tmpline.point(intersect[0][0][0]).real, "y": tick})


            else:
                for tick in reversed(useful_tick):
                    if start_x >= tick > end_x:
                        if abs(tick - start_x) < eps and abs(tick - start_x) < abs(tick - end_x):
                            if direction == "x":
                                new_point_list.append({'x': tick, 'y': current_point['oy']})
                            else:
                                new_point_list.append({'x': current_point['ox'], 'y': tick})
                        elif abs(end_x - tick) < eps:
                            if direction == "x":
                                new_point_list.append({'x': tick, 'y': next_point['oy']})
                            else:
                                new_point_list.append({'x': next_point['ox'], 'y': tick})
                        else:
                            if direction == 'x':
                                tmpline = svgpathtools.Line(complex(tick, current_vo['up'] - 100), complex(tick, current_vo['down'] + 100))
                                current_seg = svgpathtools.Line(complex(start_x, current_point['oy']), complex(end_x, next_point['oy']))
                            else:
                                tmpline = svgpathtools.Line(complex(current_vo['left'] - 100, tick), complex(current_vo['right'] + 100, tick))
                                current_seg = svgpathtools.Line(complex(current_point['ox'], start_x), complex(next_point['ox'], end_x))
                            intersect = svgpathtools.Path(tmpline).intersect(svgpathtools.Path(current_seg))

                            if (len(intersect) > 0):
                                if direction == "x":
                                    new_point_list.append({'x': tick, "y": tmpline.point(intersect[0][0][0]).imag})
                                else:
                                    new_point_list.append({'x': tmpline.point(intersect[0][0][0]).real, "y": tick})
        add_miss_point(new_point_list, useful_tick, direction = direction)
        new_point_list_group.append(new_point_list)
        if remove_soup:
            current_vo['original_soup'].decompose()
            current_vo.pop('original_soup', None)



    new_control_points = []

    tick_num = len(useful_tick)

    tick_position = []

    for i, tick in enumerate(useful_tick):
        current_tick = {}
        current_tick['position'] = tick
        if i == 0:
            inter = (useful_tick[1] - tick) / 2
            current_tick['range'] = [tick - inter, tick + inter]
        elif i == tick_num - 1:
            inter = (tick - useful_tick[tick_num - 2]) / 2
            current_tick['range'] = [tick - inter, tick + inter]

        else:
            current_tick['range'] = [(tick + useful_tick[i - 1]) / 2, (tick + useful_tick[i + 1]) / 2]

        tick_position.append(current_tick)

    # print("tick position", tick_position)

    main_axis = {'type': direction, "tick_position": tick_position}
    main_axis['even_type'] = "single"

    print("main_axis", main_axis)
    print('new_point_list_group', [len(item) for item in new_point_list_group])

    # tick_position = [{'position': tick, 'control': []} for tick in useful_tick]

    # print('A item', new_visual_objects[0])

    # print("new_visual_objects", new_visual_objects)

    new_new_visual_objects = deepcopy(new_visual_objects) 
    new_visual_objects = new_new_visual_objects

    for i, current_vo in enumerate(new_visual_objects):
        current_vo['global_id'] = current_vo['id']
        current_vo['id'] = i
        current_vo['control_point'] = []

        obj_id = current_vo['id']
        new_point_list = new_point_list_group[i]
        for item in new_point_list:
            new_control_points.append(pack_point(item['x'], item['y'], point_id, obj_id))
            current_vo['control_point'].append(point_id)
            point_id += 1

        # print(new_point_list)
        # show_new_point_list.append(new_point_list)


    print(time.time() - begin_time)

    # print("new_visual_objects", new_visual_objects)

    return new_visual_objects, new_control_points, main_axis

def find_tick_group (visual_objects, control_points):
    # Filter those with only two control points
    line_vo = [item for item in visual_objects if item['type'] == "line" and len(item['control_point']) == 2]
    vertical_line = [item for item in line_vo if control_points[item['control_point'][0]]['ox'] == control_points[item['control_point'][1]]['ox']]

    vid_list = [obj['id'] for obj in vertical_line]

    return {'vid': vid_list, 'type': "vertical_line"}

def find_axis_group(visual_objects, control_points):
    line_vo = [item for item in visual_objects if item['type'] == "line" and len(item['control_point']) == 4]
    # axis_line = [item for item in line_vo if control_points[item['control_point'][1]]['oy'] == control_points[item['control_point'][2]]['oy']]
    vid_list = [obj['id'] for obj in line_vo]
    print("ddddddddaaaa", vid_list)
    return {'vid': vid_list, 'type': "axis_line"}

def find_line_group(visual_objects, control_points):

    line_vo = [item for item in visual_objects if item['type'] == 'line' ]

    vid_list = [obj['id'] for obj in line_vo]

    vertical_tick = find_tick_group(visual_objects, control_points)
    axis_line = find_axis_group(visual_objects, control_points)
    other_vid = set(vid_list) - set(vertical_tick['vid']) - set(axis_line['vid'])

    print("other_vid", other_vid)

    return {'vid': list(other_vid), 'type': "line"}, vertical_tick

def find_point_group(visual_objects, control_points):
    point_vo = [item for item in visual_objects if item['type'] == 'point']
    vid_list = [obj['id'] for obj in point_vo]

    return {'vid': vid_list, 'type': "point"}


# Get axis from the candidate list and axis. Match the axis and the 

def find_shared_value_group_by_visual_element(even_set, visual_objects, control_points, direction = 'x'):

    # calculate the common control point of the visual element

    # get area type visual objects
    area_vo = [item for item in visual_objects if item['type'] == 'area' and item['id'] in even_set]

    # print('area_vo', area_vo)

    area_vo_list = [set([round(control_points[pid]['o' + direction], 1) for pid in item['control_point']]) for item in area_vo]

    area_vo_list_num = len(area_vo_list)

    area_relation = []

    for i in range(area_vo_list_num):
        for j in range(i + 1, area_vo_list_num):
            item_i = area_vo_list[i] 
            item_j = area_vo_list[j]
            shared_num = get_shared_number(item_i, item_j)
            if (shared_num > min(len(item_i), len(item_j)) / 2) and shared_num > 2:
                area_relation.append((i, j))

            # print('shared_num', i, j, shared_num)
    # print('area_relation', area_relation)

    # print(area_vo[0]["original_soup"]["d"])
    # print("transform_matrix", area_vo[0]['original_soup']['transform_matrix'])


    G = nx.Graph()
    G.add_edges_from(area_relation)
    res = nx.find_cliques(G)

    visual_area_clique = []

    for area_clique in res:
        print("团", area_clique)
        intersection = area_vo_list[area_clique[0]]
        union = area_vo_list[area_clique[0]] 
        for set_id in area_clique:
            intersection = intersection & area_vo_list[set_id]
            union = union | area_vo_list[set_id]

        intersec_list = list(intersection)
        intersec_list.sort()

        useful_tick = get_useful_tick(area_clique, area_vo, area_vo_list)

        vid_list = [area_vo[idx]['id'] for idx in area_clique]
        if len(even_set & set(vid_list)) >= 2:
            visual_area_clique.append({"vid": vid_list, "tick": useful_tick, "type": "stack_" + direction})

        # print("Joint Set", intersec_list)
        # print('Joint set length', len(intersec_list))
        # print('defference set', union - intersection)
        # print('useful_tick: ', useful_tick)


    # print('position', position)




    return visual_area_clique




def get_useful_tick(area_clique, area_vo, area_vo_list, eps = 1):


    tick_count = {}

    for set_id in area_clique:
        current_set = area_vo_list[set_id]
        for current_can in current_set:
            if current_can in tick_count:
                tick_count[current_can] += 1
            else:
                tick_count[current_can] = 1


    # combine tick when they have small difference



    # get the tick that have more than half of the elements

    useful_tick = [item[0] for item in list(tick_count.items()) if item[1] > len(area_clique) / 2.0]


    useful_tick.sort()

    print(len(useful_tick))

    return useful_tick

def get_shared_number(set_i, set_j):
    return len(set_i & set_j)


def get_even_intervals_new(visual_objects, control_points):

    x_even_list = []
    y_even_list = []

    vo_id_group = [item['id'] for item in visual_objects if item['type'] == 'area' or item['type'] == 'line']

    for vid in vo_id_group:
        current_vo = visual_objects[vid]
        current_cp = [control_points[pid] for pid in current_vo['control_point']]
        x_list = [p['ox'] for p in current_cp]
        y_list = [p['oy'] for p in current_cp]

        x_position_list = [control_points[pid]['ox'] for pid in current_vo['control_point']]
        y_position_list = [control_points[pid]['oy'] for pid in current_vo['control_point']]

        x_position_list.sort()
        y_position_list.sort()

        multi_flag = False

        if ((x_position_list[-1] - x_position_list[0]) / len(x_position_list) < 5):
            multi_flag = True
            x_position_list = [int(item * 10) for item in x_position_list]
        else:
            x_position_list = [int(item) for item in x_position_list]

        if (y_position_list[-1] - y_position_list[0]) / len(y_position_list) < 5:
            multi_flag = True
            y_position_list = [int(item * 10) for item in x_position_list]
        else:
            y_position_list = [int(item) for item in y_position_list]

        # print('real_center_list', real_center_list)
        # print('len center list', center_list)
        x_count_list = get_count_list(x_position_list)
        # print(x_count_list)
        # print(f'{direction} count list', len(count_list))
        x_interval_list = get_interval(x_count_list)

        y_count_list = get_count_list(y_position_list)
        y_interval_list = get_interval(y_count_list)

        # print("Interval situation", vid, x_interval_list, y_interval_list)


        if len(x_interval_list) > 0:
            x_even_list.append({'vid': vid, "interval": x_interval_list})
        if len(y_interval_list) > 0:
            y_even_list.append({'vid': vid, "interval": y_interval_list})

        # if x_is_even and y_is_even:
        #     if x_candi[1] > y_candi[1]:
        #         y_is_even = False
        #     elif x_candi[1] < y_candi[1]:
        #         x_is_even = False

        # # print('vid ', vid)

        # if x_is_even:
        #     x_even_list.append({'vid': vid, "interval": x_candi})

        # if y_is_even:
        #     y_even_list.append({'vid': vid, "interval": y_candi})

    return x_even_list, y_even_list


# calculate the even intervals

def get_even_intervals(visual_objects, control_points):

    # get all control points of a

    x_even_list = []
    y_even_list = []


    vo_id_group = [item['id'] for item in visual_objects if item['type'] == 'area' or item['type'] == 'line']

    for vid in vo_id_group:
        current_vo = visual_objects[vid]
        current_cp = [control_points[pid] for pid in current_vo['control_point']]
        x_list = [p['ox'] for p in current_cp]
        y_list = [p['oy'] for p in current_cp]

        x_is_even, x_candi = cal_intervals(x_list)
        y_is_even, y_candi = cal_intervals(y_list)

        if x_is_even and y_is_even:
            if x_candi[1] > y_candi[1]:
                y_is_even = False
            elif x_candi[1] < y_candi[1]:
                x_is_even = False

        # print('vid ', vid)

        if x_is_even:
            x_even_list.append({'vid': vid, "interval": x_candi})

        if y_is_even:
            y_even_list.append({'vid': vid, "interval": y_candi})

    return x_even_list, y_even_list


def cal_intervals(cp_list, round_bit = 1):
    cp_list.sort()
    cp_min = cp_list[0] # get the first control point
    cp_max = cp_list[-1] # get the last control point
    cp_range = cp_max - cp_min

    
    eps = cp_range / (len(cp_list) * 10)

    # print('the range of the value is: ', cp_range)
    # print('the eps: ', eps)

    candidate_dict = {}

    for i in range(len(cp_list) - 1):
        current_inter = cp_list[i + 1] - cp_list[i]
        current_inter_round = round(current_inter, 1)
        if current_inter_round in candidate_dict:
            candidate_dict[current_inter_round] += 1
        else:
            candidate_dict[current_inter_round] = 1

    candidate_list = list(candidate_dict.items())
    candidate_list = [list(item) for item in candidate_list]
    candidate_list.sort(key =lambda x: x[0])

    candidate_num = len(candidate_list)

    # print("candidate_list before", candidate_list)

    for i in range(candidate_num):
        current_item = candidate_list[i]
        if current_item[1] == 0:
            continue
        for j in range(i + 1, candidate_num):
            next_item = candidate_list[j]
            if next_item[0] - current_item[0] > eps:
                break
            current_item[1] += next_item[1]
            next_item[1] = 0

    candidate_list = [item for item in candidate_list if item[1] != 0]


    # print('candidate_list after', candidate_list)


    point_num = len(cp_list)

    zero_num = 0


    if (candidate_list[0][0] == 0):
        zero_num = candidate_list[0][1]

    # print("zero_num", zero_num)

    non_zero_num = point_num - zero_num

    # print("non-zero_num", point_num - zero_num)

    for item in candidate_list:
        # print(item[1])
        if item[0] != 0 and item[1] > non_zero_num / 2 and item[1] > 2:
            return True, item

    return False, candidate_list


    # print(candidate_list)
    # return candidate_dict

def cal_inner_intervals(vo_id_group, visual_objects):

    return 


def find_baseline(visual_object_groups):


    return