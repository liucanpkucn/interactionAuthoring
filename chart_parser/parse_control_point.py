###parse_control_point与主函数的接口是 get_control_point
'''
def get_control_point(
    visual_objs, 
    width, height, 
    selected_area = '', 
    need_selected_vo = False)
    

    
    return control_point, visual_object, non_soup_visual_object
'''


# import copy
from uuid import uuid5, UUID
from utils import pprint



def obj_in_selected_area(current_obj, selected_area):

    if selected_area == "":
        return True

    if current_obj['right'] < selected_area[0][0] or current_obj['left'] > selected_area[1][0] or current_obj['up'] > selected_area[1][1] or current_obj['down'] < selected_area[0][1]:
        return False

    return True

def get_control_point(visual_objs, width, height, selected_area = '', need_selected_vo = False):
    control_point = []
    visual_object = []
    constraints = []
    point_id = 0
    obj_id = 0
    for obj in visual_objs:
        if obj['type'] == "polygon" :
            if obj['opacity'] == "none":
                continue
            if obj['fill'] == "none":
                continue
            # print(obj)
            # print("节点数目：", len(obj['polygon']))
            # print([i[0] for i in obj['polygon']])
            # print(obj['polygon'])

            vo_type = "area"
            current_obj = {
                "id": obj_id,
                "type": vo_type,
                "fill": obj['fill'],
                "opacity": obj['opacity'],
                "fill_opacity": obj['fill_opacity'],
                "stroke": obj['stroke'], 
                'original_soup': obj["original_soup"],
                "stroke_width": obj['stroke_width'],
                "control_point": [],
                "center": obj['center'],
                "append_info": obj['append_info']
            }

            current_obj['left'] = min([item[0] for item in obj['polygon']])
            current_obj['right'] = max([item[0] for item in obj['polygon']])
            current_obj['up'] = min([item[1] for item in obj['polygon']])
            current_obj['down'] = max([item[1] for item in obj['polygon']])

            if current_obj['right'] < 0 or current_obj['left'] > width or current_obj['up'] > height or current_obj['down'] < 0:
                continue

            if current_obj['right'] - current_obj['left'] < 1 and current_obj['down'] - current_obj['up'] < 1:
                continue

            if not obj_in_selected_area(current_obj, selected_area):
                continue
            if need_selected_vo:
                if not current_obj["original_soup"].has_attr("vivisfy_selected"):
                    continue
                if current_obj["original_soup"]["vivisfy_selected"] == "no":
                    continue
            for point in obj['polygon']:
                control_point.append(pack_point(point[0], point[1], point_id, obj_id))
                current_obj['control_point'].append(point_id)
                point_id += 1
            visual_object.append(current_obj)
            obj_id += 1

        elif obj['type'] == "line":

            if obj['opacity'] == 0:
                continue
            vo_type = "line"

            current_obj = {
                "id": obj_id,
                "type": vo_type, 
                "opacity": obj['opacity'],
                "stroke": obj['stroke'], 
                'original_soup': obj["original_soup"],
                "stroke_width": obj['stroke_width'],
                "control_point": []
            }

            current_obj['left'] = min([item[0] for item in obj['polygon']])
            current_obj['right'] = max([item[0] for item in obj['polygon']])
            current_obj['up'] = min([item[1] for item in obj['polygon']])
            current_obj['down'] = max([item[1] for item in obj['polygon']])


            # filter those straight lines
            
            # if abs(current_obj['right'] - current_obj['left']) < 1 or abs(current_obj['down'] - current_obj['up']) < 1:
            #     continue

            # if current_obj['right'] < 0 or current_obj['left'] > width or current_obj['up'] > height or current_obj['down'] < 0:
            #     continue
            if current_obj['stroke'] == '':
                continue

            if not obj_in_selected_area(current_obj, selected_area):
                continue


            if need_selected_vo:
                if not current_obj["original_soup"].has_attr("vivisfy_selected"):
                    print('has attr pass')
                    continue 

                if current_obj["original_soup"]["vivisfy_selected"] == "no":
                    print("attr no pass")
                    continue
                    
                print ('not pass', current_obj['type'])

            for point in obj['polygon']:
                control_point.append(pack_point(point[0], point[1], point_id, obj_id))
                current_obj['control_point'].append(point_id)
                point_id += 1
            visual_object.append(current_obj)
            obj_id += 1

        elif obj['type'] == "text":



            if obj["left"] >= obj['right'] or obj['up'] >= obj['down']:
                print("现在的文字是：", obj)
                
                print('因为大小删掉')
                
                continue
            if obj['text'].replace(' ', "") == "":
                print("现在的文字是：", obj)

                print('因为内容删掉')

                continue
            if obj['opacity'] == 0 or obj['fill_opacity'] == 0:
                print("现在的文字是：", obj)

                print('因为透明度删掉')
                continue

            # print('保留', obj['text'])

            current_obj = {
                "id": obj_id,
                "content": obj['text'],
                "type": "text", 
                'origin': str(obj['origin']),
                "fill": obj['fill'], 
                'original_soup': obj["original_soup"],
                "control_point": [
                    point_id, 
                    point_id + 1, 
                    point_id + 2, 
                    point_id + 3,
                    point_id + 4
                ],
                "up": obj["up"],
                "down": obj['down'],
                "left": obj['left'],
                "right": obj['right']
            }

            if current_obj['right'] < 0 or current_obj['left'] > width or current_obj['up'] > height or current_obj['down'] < 0:
                continue


            obj_id += 1

            control_point.append(pack_point(obj["left"], obj['up'], point_id, obj_id - 1))
            point_id += 1
            control_point.append(pack_point(obj["right"], obj['up'], point_id, obj_id - 1))
            point_id += 1
            control_point.append(pack_point(obj["right"], obj['down'], point_id, obj_id - 1))
            point_id += 1
            control_point.append(pack_point(obj["left"], obj['down'], point_id, obj_id - 1))
            point_id += 1
            control_point.append(pack_point(obj["ox"], obj['oy'], point_id, obj_id - 1))
            point_id += 1

            visual_object.append(current_obj)
        

        elif obj['type'] == "rect": #or obj['type'] == "text":

            if obj['opacity'] == "none":
                continue

            if float(obj['opacity']) < 0.01:
                continue

            if obj['height'] > 200 and obj['width'] > 200:
                continue

            current_obj = {
                "id": obj_id,
                "type": "area", 
                "fill": obj['fill'], 
                "opacity": obj['opacity'],
                "fill_opacity": obj['fill_opacity'],
                "stroke": obj['stroke'],
                'original_soup': obj["original_soup"],
                "stroke_width": obj['stroke_width'],
                "control_point": [
                    point_id, 
                    point_id + 1, 
                    point_id + 2, 
                    point_id + 3
                ],
                "up": obj["up"],
                "down": obj['down'],
                "left": obj['left'],
                "right": obj['right']
            }

            if current_obj['right'] - current_obj['left'] < 1 and current_obj['down'] - current_obj['up'] < 1:
                continue

            if current_obj['right'] < 0 or current_obj['left'] > width or current_obj['up'] > height or current_obj['down'] < 0:
                continue
    
            if not obj_in_selected_area(current_obj, selected_area):
                continue
            

            if need_selected_vo:
                if not current_obj["original_soup"].has_attr("vivisfy_selected"):

                    print('has attr pass')
                    continue 

                if current_obj["original_soup"]["vivisfy_selected"] == "no":
                    print("attr no pass")
                    continue
                    
                print ('not pass', current_obj['type'])

            control_point.append(pack_point(obj["left"], obj['up'], point_id, obj_id))
            point_id += 1
            control_point.append(pack_point(obj["right"], obj['up'], point_id, obj_id))
            point_id += 1
            control_point.append(pack_point(obj["right"], obj['down'], point_id, obj_id))
            point_id += 1
            control_point.append(pack_point(obj["left"], obj['down'], point_id, obj_id))
            point_id += 1

            obj_id += 1


            visual_object.append(current_obj)

        elif obj['type'] == "circle": #or obj['type'] == "text":

            if obj['opacity'] == "none":
                continue

            if float(obj['opacity']) < 0.01:
                continue

            if obj['height'] > 300 and obj['width'] > 300:
                continue

            # if obj["left"] >= obj['right'] or obj['up'] >= obj['down'] or obj['height'] < 5:
            #     continue

            current_obj = {
                "id": obj_id,
                "type": "point", 
                "fill": obj['fill'], 
                "opacity": obj['opacity'],
                "fill_opacity": obj['fill_opacity'],
                "stroke": obj['stroke'],
                "stroke_width": obj['stroke_width'],
                "control_point": [
                    point_id,
                ],
                'original_soup': obj["original_soup"],
                'radius': obj['r'],
                "up": obj["up"],
                "down": obj['down'],
                "left": obj['left'],
                "right": obj['right']
            }

            if current_obj['right'] < 0 or current_obj['left'] > width or current_obj['up'] > height or current_obj['down'] < 0:
                continue

            if not obj_in_selected_area(current_obj, selected_area):
                continue

            if need_selected_vo:
                if not current_obj["original_soup"].has_attr("vivisfy_selected") or not current_obj["original_soup"]["vivisfy_selected"] == "yes":
                    print("pass", current_obj['type'])
                    continue
                    
                print ('not pass', current_obj['type'])
            
            control_point.append(pack_point(obj["x"], obj['y'], point_id, obj_id, radius = obj['r']))
            point_id += 1
            obj_id += 1


            visual_object.append(current_obj)

    non_soup_visual_object = []
    for i, obj in enumerate(visual_object):
        new_obj = {}
        for attr in obj:
            if attr == "original_soup":
                continue
            new_obj[attr] = obj[attr]
            
        non_soup_visual_object.append(new_obj)
            # obj['original_soup'] = str(obj['original_soup'])

    for obj in visual_object:
        obj["uuid"] = str(uuid5(UUID(int=0), f'{obj["type"]}-{obj["id"]}'))
        obj["original_soup"]['uuid_mani'] = obj['uuid']

    # pprint(visual_object)
    return control_point, visual_object, non_soup_visual_object

def pack_point(x, y, index, obj_id, radius = 0, fixed = False):

    point = {"ox": x, "oy": y, "id": index, 'obj_id': obj_id, "radius": radius }
    # if index == 3030:
    #     print("asdfasdf", point)
    if fixed:
        point['fixed'] = True
    return point

def control_append_tick(control_point, visual_object, axes):
    axis_id = len(visual_object)
    axis_objects = {
        "id": axis_id,
        "type": "axis",
        "fill": [
            0,0,0
        ],
        "control_point": []
    }

    current_id = len(control_point)
    print(axes)
    for i, tick_posi in enumerate(axes['position']):
        current_point = {
            "type": "tick",
            "x": tick_posi[0],
            'y': tick_posi[1],
            "fixed": True,
            "id": current_id,
            "radius": 1,
            "obj_id": axis_id
        }
        axis_objects["control_point"].append(current_id)
        tick_posi.append(current_id)
        current_id += 1
        control_point.append(current_point)

    visual_object.append(axis_objects)


