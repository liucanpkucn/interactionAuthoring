from deal_with_object import get_interval, judge_evenly
import json
def go_to_original_format(texts_objs, direction = "x", another_dir = "up"):
    interval_list = judge_evenly(texts_objs, direction= direction, require_interval= True)
    def get_middle(item):
        return (item['left'] + item['right']) / 2
    texts_objs = sorted(texts_objs, key= get_middle)

    for text in texts_objs:
        text['cx'] = (text['left'] + text['right']) / 2
        text['cy'] = (text['up'] + text['down']) / 2

    if direction == "x":
        key_x = "cx"
        key_y = another_dir
    else:
        key_x = another_dir
        key_y = 'cy'
    
    ticks = [{"position": {'x': item[key_x], 'y': item[key_y]}, "controlled": None, "visual_object": item['id'], 'content': item['content']} for item in texts_objs]
    ticks = sorted(ticks, key=lambda k:k['position'][direction])
    middle_list = [tick["position"][direction] for tick in ticks]

    axis = {
        "type": direction,
        "main": False,
        "attr_type": "Q",
        "fixed_distance": interval_list[0] if len(interval_list) > 0 else None,
        "range": {
            "begin": middle_list[0],
            "end": middle_list[-1]
        },
        "tick": ticks,
        "align": another_dir
    }
    return axis


def same_row_text(text_objs, follow = 'up', direction = "x", eps = 2):
    value_row_dict = {}
    for text_obj in text_objs:
        in_flag = False
        for key, array in value_row_dict.items():
            if abs(text_obj[follow] - key) < eps:
                array.append(text_obj)
                in_flag = True
        if not in_flag:
            value_row_dict[int(text_obj[follow])] = [text_obj]
    value_row = [{'value': key, 'follow': follow, 'texts': array} for key, array in value_row_dict.items()]
    value_row = [item for item in value_row if len(item['texts']) > 2]
    axes = []

    for row in value_row:
        axis = go_to_original_format(row['texts'], direction = direction, another_dir=follow)
        axes.append(axis)
    return axes

def adjust_tick_line(axis, visual_object):
    tick_object = [vo for vo in visual_object if vo['type'] == 'line' and len(vo['control_point']) == 2]

    if axis['type'] == 'x':
        tick_position = [vo['left'] for vo in tick_object if abs(vo['left'] - vo['right']) < 1]
    else:
        tick_position = [vo['up'] for vo in tick_object if abs(vo['up'] - vo['down']) < 1]
    
    tick_position = sorted(tick_position)

    position_name = ['left', 'right'] if axis['type'] == 'x' else ['up', 'down']

    print("tick position", axis['type'], tick_position)
    print("axis tick", [tick['position'][axis['type']] for tick in axis['tick']])

    for tick in axis['tick']:
        current_vo = visual_object[tick['visual_object']]
        tick_line_in_tick = [tick_line for tick_line in tick_position if current_vo[position_name[0]] <= tick_line <= current_vo[position_name[1]]]
        print(tick_line_in_tick)
        print(tick['position'][axis['type']])
        if len(tick_line_in_tick) > 0:
            tick['position'][axis['type']] = tick_line_in_tick[0]
    
    # print("tick_object", len(tick_object))
    return


def get_ticks_robust(control_point, visual_object):
    eps = 10
    text_objs = [vo for vo in visual_object if vo['type'] == 'text']
    
    up_group = same_row_text(text_objs, follow = 'up', direction = "x", eps = eps)
    right_group = same_row_text(text_objs, follow = "right", direction = 'y', eps = eps)
    # left_group = same_row_text(text_objs, follow = "left", direction = 'y', eps = eps)

    y_group = []
    y_group.extend(right_group)
    # y_group.extend(left_group)

    y_group = sorted(y_group, key=lambda k:-len(k['tick']))

    if len(y_group) > 0:
        y_group = y_group[:1]

    # print("The same row group", [(item['value'], len(item['texts'])) for item in up_group])
    axes = {
        "x": up_group,
        "y": y_group
    }
    print("There are ", len(axes['x']), "x axes")
    print("There are ", len(axes['y']), "y axes")
    if len(axes['x']) > 0:
        adjust_tick_line(axes['x'][0], visual_object)
    if len(axes['y']) > 0:
        adjust_tick_line(axes['y'][0], visual_object)

    with open('tmp/axes_array_new.json', 'w', encoding="utf8") as f:
        json.dump(axes, f, indent = 2)
    return axes
