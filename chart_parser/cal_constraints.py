
def cmp_to_key(mycmp):
    """Convert a cmp= function into a key= function"""
    class K(object):
        __slots__ = ['obj']
        def __init__(self, obj):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        __hash__ = None
    return K

class DisjointSet(object):

    def __init__(self):
        self.leader = {} # maps a member to the group's leader
        self.group = {} # maps a group leader to the group (which is a set)

    def add(self, a, b):
        leadera = self.leader.get(a)
        leaderb = self.leader.get(b)
        if leadera is not None:
            if leaderb is not None:
                if leadera == leaderb: return # nothing to do
                groupa = self.group[leadera]
                groupb = self.group[leaderb]
                if len(groupa) < len(groupb):
                    a, leadera, groupa, b, leaderb, groupb = b, leaderb, groupb, a, leadera, groupa
                groupa |= groupb
                del self.group[leaderb]
                for k in groupb:
                    self.leader[k] = leadera
            else:
                self.group[leadera].add(b)
                self.leader[b] = leadera
        else:
            if leaderb is not None:
                self.group[leaderb].add(a)
                self.leader[a] = leaderb
            else:
                self.leader[a] = self.leader[b] = a
                self.group[a] = set([a, b])

# from heartrate import trace, files
# trace(files=files.all, browser=True)

def try_collision_gravity(control_point, visual_object, should_y = 170):
	collision_group = []
	constraints = []
	total = 20
	for obj in visual_object:
		if obj["type"] == 'point':
			pid = obj['control_point'][0]
			point = control_point[pid]
			# print(point)
			if 'x' in point:
				point['should_y'] = should_y
				point['should_x'] = point['x']
				collision_group.append(pid)	
				if total > 0:
					point['activate'] = True
					total -= 1
				else:
					point['activate'] = False


	constraints.append(pack_group_constraints(collision_group, force_type = "collision_group_point") )
	return constraints


def add_quantity_gravity(control_point, visual_object, axis):
	for obj in visual_object:
		if obj["type"] == 'point':
			pid = obj['control_point'][0]
			point = control_point[pid]
			point["should_" + axis['type']] = point[axis['type']]

def add_quantity_constraints(control_point, visual_object, direction):
	for obj in visual_object:
		for pid in obj['control_point']:
			point = control_point[pid]
			point['should_' + direction] = point[direction]
			point['quantity'] = direction

def add_should_axis_constraints(control_point, visual_object, main_axis):
	# 设定一个最小的范围，只要范围小于一定值，则认定具有约束力。

	axis_type = main_axis['type']
	axis_ticks = main_axis['tick_position']
	constraints = []
	# attr_index = axis_type

	for tick in axis_ticks:
		# position = tick["position"]

		# 找到穿过的visual mark，如果他整个都在其中，那么为这个tick所支配。如果不是整个都在其中，那么只有当前的control point 为它支配。
		tick_controlled_points, through_object, totally_object, partially_object = find_tick_controlled_points_by_range(control_point, visual_object, tick, axis_type = axis_type)

		# print("Position   aaa", position, totally_object, partially_object)

		# all the controlled points should have the corresponding value
		for pid in tick_controlled_points:
			point = control_point[pid]

			if axis_type == "y":
				should_attr = "should_y"

			else:
				should_attr = "should_x"

			point[should_attr] = tick['position']

		constraints.extend(add_fixed_along_axis_constraints(control_point, visual_object, tick_controlled_points, axis_type))

	return constraints



def add_fixed_along_axis_constraints(control_point, visual_object, tick_controlled_points, axis_type = "y"):
	constraints = []

	if (axis_type == "y"):
		another_attr = 'x'
	else:
		another_attr = 'y'

	# print("The axis is ", axis_type)
	for obj in visual_object:
		current_point_set = set(obj['control_point']) & set(tick_controlled_points)
		for p1_id in current_point_set:
			for p2_id in current_point_set:
				if p1_id < p2_id:
					point1 = control_point[p1_id]
					point2 = control_point[p2_id]
					if same_position(point1, point2, another_attr):
						constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-" + axis_type))

	return constraints




def add_axis_constraints(main_axis, control_point, visual_object):
	constraints = []

	if main_axis['type'] == "x":
		another_fixed_type = "fixed-y"
		attr_name = "y"
	else:
		another_fixed_type = "fixed-x"
		attr_name = "x"

	fixed_distance = abs(main_axis['fixed_distance'])

	begin_tick = main_axis['tick'][0]['control_point']
	end_tick = main_axis['tick'][-1]['control_point']

	min_value = min([tick['position'][main_axis['type']] for tick in main_axis['tick']])
	max_value = max([tick['position'][main_axis['type']] for tick in main_axis['tick']])

	print("min_value", min_value)
	print('max_value', max_value)

	print('main_axis', main_axis['type'])

	for i, tick in enumerate(main_axis['tick']):
		control_point[tick['control_point']][another_fixed_type] = control_point[tick['control_point']][attr_name]
		control_point[tick['control_point']]["larger_" + main_axis['type']] = min_value #- (max_value - min_value) * 2
		control_point[tick['control_point']]["smaller_" + main_axis['type']] = max_value #+ (max_value - min_value) * 2

		tick_point = tick['control_point']

		if tick['visual_object'] != None:
			text_vid = tick['visual_object']
			text_point = visual_object[text_vid]['control_point'][4]
			visual_object[text_vid]['tick_point'] = tick_point
			constraints.append(pack_fixed_dis(control_point, tick_point, text_point, "fixed-x"))
			constraints.append(pack_fixed_dis(control_point, tick_point, text_point, "fixed-y"))

		# if i != 0:
		# 	# constraints.append(pack_fixed_dis(control_point, tick_point, last_tick_point, "gravity-" + main_axis['type'], distance = 20))
		# 	# constraints.append(add_link_constraints(tick_point, begin_tick, force_type = main_axis['type'] + "_gravity", distance = 0)) 
		# 	constraints.append(add_link_constraints(tick_point, begin_tick, force_type = main_axis['type'] + "_larger", distance = 0)) 

	for i, tick_i in enumerate(main_axis['tick']):
		for j, tick_j in enumerate(main_axis['tick']):
			if (i >= j):
				continue
			tick_i_index = tick_i['control_point']
			tick_j_index = tick_j['control_point']

			constraints.append(add_link_constraints(tick_i_index, tick_j_index, force_type = main_axis['type'] + "_distance", distance = fixed_distance)) 


			# constraints.append(pack_fixed_dis(control_point, tick_point, last_tick_point, "fixed-" + main_axis['type'], distance = 20))


	# constraints.append(pack_fixed_dis(control_point, begin_tick, end_tick, "fixed-" + main_axis['type']))

	return constraints


# 垂直于轴的力
def perpendicular_gravity_new(control_point, visual_object, main_axis, groups, CoordSys = {}, small_range = 2, direction = "larger", need_tick = False):
	# 设定一个最小的范围，只要范围小于一定值，则认定具有约束力。

	axis_type = main_axis['type']
	axis_ticks = main_axis['tick_position']
	constraints = []
	attr_index = axis_type

	tick_list = []

	for tick in axis_ticks:
		position = tick["position"]

	
		# 找到穿过的visual mark，如果他整个都在其中，那么为这个tick所支配。如果不是整个都在其中，那么只有当前的control point 为它支配。
		tick_controlled_points, through_object, totally_object, partially_object = find_tick_controlled_points_by_range(control_point, visual_object, tick, axis_type = axis_type)


		for obj in totally_object:
			obj['control_by_' + axis_type] = True


		
		constraints.extend(add_inside_fixed(control_point, through_object, tick_controlled_points, axis_type = axis_type))		

		# print("Position   aaa", position, len(totally_object), len(partially_object), len(tick_controlled_points))

		# all the controlled points should have the corresponding value
		for pid in tick_controlled_points:
			point = control_point[pid]

			if axis_type == "y":
				should_attr = "should_y"

			else:
				should_attr = "should_x"

			point[should_attr] = tick['position']

		if axis_type == "x":
			direction_x_collision = add_collision_constraints(totally_object, tick_controlled_points, control_point, visual_object, attr_name = "x", eps = 2)
			direction_y_collision = add_collision_constraints(through_object, tick_controlled_points, control_point, visual_object, attr_name = "y", eps = 2)
		else:
			direction_x_collision = add_collision_constraints(through_object, tick_controlled_points, control_point, visual_object, attr_name = "x", eps = 2)
			direction_y_collision = add_collision_constraints(totally_object, tick_controlled_points, control_point, visual_object, attr_name = "y", eps = 2)
		
		# print("direction x collision", direction_x_collision)
		# print('direction y collision', direction_y_collision)

		current_tick = {}
		current_tick['through_object'] = through_object
		current_tick['totally_object'] = totally_object
		current_tick['collision_x'] = direction_x_collision
		current_tick['collision_y'] = direction_y_collision
		current_tick['tick_controlled_points'] = tick_controlled_points
		tick_list.append(current_tick)

		constraints.extend(direction_x_collision)
		constraints.extend(direction_y_collision)

		# tick_according_attr = order_tick_controlled_point(control_point, tick_controlled_points, axis_type = axis_type)

		# for y_pos in tick_according_attr:
		# 	current_point_list = tick_according_attr[y_pos]
		# 	constraints.extend(along_the_perpendicular_force(current_point_list, control_point, visual_object, tick, axis_type = axis_type, direction = direction, small_range = small_range))

	get_base_line(tick_list, control_point, axis_type = axis_type)

		
	get_order_from_collision(constraints, groups, direction = "x")
	get_order_from_collision(constraints, groups, direction = "y")

	return constraints

def get_base_line(tick_list, control_point, axis_type):
	if axis_type == "x":
		collision_name = "collision_y"
		another_direction = 'y'
	else:
		collision_name = 'collision_x'
		another_direction = 'x'


	min_list = []
	max_list = []

	for current_tick in tick_list:
		through_object = current_tick["through_object"]
		current_collision_list = current_tick[collision_name]
		current_control_point = current_tick['tick_controlled_points']

		# print("through_object", through_object)

		for current_collision in current_collision_list:
			min_list.append(current_collision['min_value'])
			max_list.append(current_collision['max_value'])

		for obj in through_object:
			obj_in_group = False
			for current_collision in current_collision_list:
				if obj['id'] in current_collision['collision_order']:
					obj_in_group = True
					break

			if not obj_in_group:
				# print("objection", obj)
				# print([control_point[point_idx] for point_idx in set(obj['control_point']) & set(current_control_point)])
				position_list = [control_point[point_idx][another_direction] for point_idx in set(obj['control_point']) & set(current_control_point)]
				# print("position_list", position_list)
				if (len(position_list) > 1):
					min_list.append(min(position_list))
					max_list.append(max(position_list))

	# print("min_list", min_list)
	# print('max_list', max_list)

	if (len(min_list) == 0):
		return

	is_min_shared, min_shared_value = get_share_value(min_list)
	is_max_shared, max_shared_value = get_share_value(max_list)


	compare_name = ""

	if (is_max_shared):
		compare_name = "smaller_" + another_direction
		shared_value = max_shared_value
	elif (is_min_shared):
		compare_name = "larger_" + another_direction
		shared_value = min_shared_value
	else:
		shared_value = (sum(min_list) + sum(max_list)) / (len(min_list) + len(max_list))

	should_name = "should_" + another_direction


	for current_tick in tick_list:
		current_control_point = current_tick['tick_controlled_points']
		for pid in current_control_point:
			current_point = control_point[pid]
			if compare_name != "":
				current_point[compare_name] = shared_value
			current_point[should_name] = shared_value


def get_share_value(value_list):


	value_list.sort()
	value_num = len(value_list)
	value_count = {}
	current_base = value_list[0]
	value_count[current_base] = 0
	for v in value_list:
		if abs(v - current_base) > 2:
			current_base = v
			value_count[current_base] = 0

		value_count[current_base] += 1

	have_share_value = False

	share_value = 0

	for value in value_count:
		if value_count[value] / value_num > 0.5:
			have_share_value = True 
			share_value = value 

	print("value count", value_count)

	return have_share_value, share_value



def get_order_from_collision(constraints, groups, direction = "x", eps = 2):
	collision_constraints = [cons for cons in constraints if cons['type'] == "collision_group" and cons['direction'] == direction]
	if len(collision_constraints) == 0:
		return 

	group = groups[0]
	group['order'] = direction
	group_order = group['order_list']

	for cons in collision_constraints:
		collision_order = cons['collision_order'] # vid list
		point_group_list = cons['point_group_list']

		# print("collision_order: ", collision_order)

		cons_in_group = [str(vid) in group['obj_group_dict'] for vid in collision_order]
		# print("cons_in_group", cons_in_group)
		if sum(cons_in_group) < len(cons_in_group):
			continue
		else:
			cons['group_id'] = 0


		group_index_value_dict = {group['obj_group_dict'][str(vid)]: point_group_list[i]['value'] for i, vid in enumerate(collision_order)}
		# print("group_index_value_dict", group_index_value_dict)
		# print('group_order', group_order)

		def cmp_dict(x, y):
			if x in group_index_value_dict and y in group_index_value_dict:
				# if direction == "y":
				return group_index_value_dict[x] - group_index_value_dict[y]
				# return group_index_value_dict[y] - group_index_value_dict[x]
			else: 
				return 0


		group_order.sort(key = cmp_to_key(cmp_dict))

	print("group_order: ", group_order)



def add_among_objs(control_point, totally_object, axis_type = "y"):

	# 1、 将这些物体全部取出来，
	# 2、 将他们的控制点取出来
	# 3、 将他们的控制点进行排序
	# 4、 将他们的根据相邻的控制点进行排序，如果前后两个控制点属于不同的物体，那么构建一个大于等于的关系，或者小于等于，这个取决的数据的顺序
	
	constraints = []
	return constraints

def add_collision_constraints(controlled_object, tick_controlled_points, control_point, visual_object, attr_name = "y", eps = 2, eps_inter = 20):
	def compare_value(a):
		return a['value']

	def is_overlap(obj_a, obj_b, need_print = False):
		if need_print:
			print(obj_a['another_min'], obj_b['another_min'], obj_b['another_max'], obj_a['another_max'])
			print(obj_a['another_min'] <= obj_b['another_min'] <= obj_b['another_max'] <= obj_a['another_max'])
			print(obj_b['another_min'], obj_a['another_min'], obj_a['another_max'], obj_b['another_max'])
			print(obj_b['another_min'] <= obj_a['another_min'] <= obj_a['another_max'] <= obj_b['another_max'])
			print(obj_a, obj_b)


		if obj_a['another_min'] <= obj_b['another_min'] <= obj_b['another_max'] <= obj_a['another_max']:
			return True
		if obj_b['another_min'] <= obj_a['another_min'] <= obj_a['another_max'] <= obj_b['another_max']:
			return True
		if obj_a['another_max'] <= obj_b['another_min'] + eps or obj_b['another_max'] <= obj_a['another_min'] + eps:
			return False
		else:
			return True

	obj_set = DisjointSet()


	clean_object = []

	for obj in controlled_object:
		# print(obj['type'])
		if obj['type'] == "area":
			current_obj = {}
			current_obj['id'] = obj["id"]
			current_control_point = [pid for pid in obj['control_point'] if pid in tick_controlled_points]
			current_x_list = [control_point[pid]['x'] for pid in current_control_point]
			current_y_list = [control_point[pid]['y'] for pid in current_control_point]

			if len(current_x_list) == 0:
				continue 
			if len(current_y_list) == 0:
				continue

			current_obj['x_min'] = min(current_x_list)
			current_obj['x_max'] = max(current_x_list)
			current_obj['y_min'] = min(current_y_list)
			current_obj['y_max'] = max(current_y_list)

			clean_object.append(current_obj)

	if attr_name == "y":
		obj_list = [{"id": obj['id'], "value": (obj["y_min"] + obj["y_max"]) / 2, "min": obj['y_min'], "max": obj['y_max'], "another_min": obj['x_min'], "another_max": obj['x_max']} for obj in clean_object]
	else:
		obj_list = [{"id": obj['id'], "value": (obj["x_min"] + obj["x_max"]) / 2, "min": obj['x_min'], "max": obj['x_max'], "another_min": obj['y_min'], "another_max": obj['y_max']} for obj in clean_object]
		
	obj_list.sort(key = compare_value)

	obj_dict = {obj['id']: obj for obj in obj_list}

	def get_vid_value(vid):
		return obj_dict[vid]['value']
		


	min_interval = 100000

	# print(obj_list)

	for i, obj_i in enumerate(obj_list):
		for j, obj_j in enumerate(obj_list):
			if j <= i: # Make sure j is larger than i
				continue
			# print("obji id , objj id: ", obj_i['id'], obj_j['id'], i, j)

			if obj_i["max"] - obj_j['min'] < eps and obj_j['min'] - obj_i['max'] < eps_inter and is_overlap(obj_i, obj_j):
				# print("true obji id , objj id: ", obj_i['id'], obj_j['id'])

				obj_set.add(obj_i['id'], obj_j['id'])
				# print("obj_i['id'], obj_i['max'], obj_j['id'], obj_j['min']", obj_i["id"], obj_i['max'], obj_j['id'], obj_j['min'])
				if (obj_j['min'] - obj_i['max']) < min_interval:
					min_interval = (obj_j['min'] - obj_i['max'])
				break


	constraints = []

	for group_key in obj_set.group:
		group = obj_set.group[group_key]


		collision_group = [{"point": list(set(visual_object[vid]['control_point']) &  set(tick_controlled_points)), "vid": vid, "value": obj_dict[vid]['value']} for vid in group]
		collision_group.sort(key = compare_value)
		collision_order = [obj["vid"] for obj in collision_group]

		# print("asdfasdfadsf list", [obj_dict[idx]['min'] for idx in collision_order])

		min_value = min([obj_dict[idx]['min'] for idx in collision_order])
		max_value = max([obj_dict[idx]['max'] for idx in collision_order])

		# print("collision_group: ", group, collision_order)
		constraints.append(get_collision_constraints(collision_group, collision_order, force_type = "collision_group", distance = min_interval, direction = attr_name, min_value = min_value, max_value = max_value))


	return constraints


def order_tick_controlled_point(control_point, tick_controlled_points, axis_type = "y"):

	tick_according_y = {}

	for pid in tick_controlled_points:
		point = control_point[pid]
		if point[axis_type] not in tick_according_y:
			tick_according_y[point[axis_type]] = []

		tick_according_y[point[axis_type]].append(point)

	# print("tick_according_y: ", tick_according_y.keys())
	# print("")

	return tick_according_y

def along_the_perpendicular_force(current_point_list, control_point, visual_object, tick, axis_type = "y", direction = "larger", small_range = 2, need_tick = False, combined_to_tick = False):


	if axis_type == "y":
		should_name = "should_x"
		gravity_force = "x_gravity"
		attr_name = "x"
		if direction == "larger":
			current_point_list.sort(key = get_x_position)
			compare_name = "larger_x"
		else:
			current_point_list.sort(key = get_minus_x_position)
			compare_name = "smaller_x"

	else:
		should_name = "should_y"
		attr_name = "y"
		gravity_force = "y_gravity"
		if direction == "larger":
			current_point_list.sort(key = get_y_position)
			compare_name = "larger_y"
		else:
			current_point_list.sort(key = get_minus_y_position)
			compare_name = "smaller_y"

	visual_point_dict = {}
	for point in current_point_list:
		current_obj_id = point['obj_id'] 
		if current_obj_id not in visual_point_dict:
			visual_point_dict[current_obj_id] = []
		visual_point_dict[current_obj_id].append(point)


	vid_value = []
	vid_value_dict = {}
	for vid in visual_point_dict:
		point_value_list = [point[attr_name] for point in visual_point_dict[vid]]
		value = sum(point_value_list)/len(point_value_list)
		min_value = min(point_value_list)
		max_value = max(point_value_list)
		vid_value.append({"vid": vid, "value": sum(point_value_list)/len(point_value_list), "min": min_value, "max": max_value})
		vid_value_dict[vid] = vid_value[-1]

	def get_value(d):
		if "smaller" in compare_name:
			return - d['value']
		return d['value']

	vid_value.sort(key = get_value)

	vid_order = [item['vid'] for item in vid_value]


	# print("vid order:", [item['vid'] for item in vid_value])

	for i, vid_i in enumerate(vid_order):
		for j, vid_j in enumerate(vid_order):
			if j <= i:   # make sure j is larger than i
				continue;


	for i in range(len(current_point_list) - 2):
		p1 = current_point_list[i]
		p2 = current_point_list[i + 1]
		p3 = current_point_list[i + 2]

		if p1['obj_id'] == p3['obj_id'] and p1['obj_id'] != p2['obj_id']:
			if abs(p2[attr_name] - p3[attr_name]) < small_range:
				current_point_list[i + 1] = p3
				current_point_list[i + 2] = p2

	constraints = []
	

	collision_constraints, obj_groups = collision_along_the_line(current_point_list, visual_object, attr_name = attr_name)

	# constraints.extend(collision_constraints)

	# print("obj_groups", obj_groups)
	# print("after   point_list: ", [[item['y'], item['obj_id'], item['id']] for item in current_point_list])


	vid_in_collision_group = []  # visual marks in collision group
	for group in obj_groups:
		vid_in_collision_group.extend(group)

	# print("obj_groups", obj_groups)

	for vid in vid_value_dict:
		if vid not in vid_in_collision_group:
			obj_groups.append([vid])

	# print("new_obj_groups", obj_groups)



	for group in obj_groups:
		# print("group", group)
		# print("compare_name", compare_name)
		if "smaller" in compare_name:
			compare_value = max([vid_value_dict[vid]['max'] for vid in group])
		else:
			compare_value = min([vid_value_dict[vid]['min'] for vid in group])

		# print("compare_value", compare_value)

		for vid in group:
			point_list = visual_point_dict[vid]
			for point in point_list:
				if combined_to_tick:
					constraints.append(add_link_constraints(point['id'], tick['control_point'], force_type = compare_name, distance = compare_value - tick["position"][attr_name])) 
					constraints.append(add_link_constraints(point['id'], tick['control_point'], force_type = gravity_force, distance = compare_value - tick["position"][attr_name])) 
				else:
					point[compare_name] = compare_value
					point[should_name] = compare_value

	return constraints

def collision_along_the_line(current_point_list, visual_object, attr_name = "y", eps = 2):

	# 获取 视觉标记的列表
	# print("current_point_list: ", current_point_list)
	current_obj_dict = {}

	for point in current_point_list:
		obj_id = point['obj_id']
		if obj_id not in current_obj_dict:
			current_obj_dict[obj_id] = []

		current_obj_dict[obj_id].append(point)


	current_obj_list = [{"point": current_obj_dict[i], "id": i} for i in current_obj_dict]

	obj_set = DisjointSet()

	for i, obj_i in enumerate(current_obj_list):
		for j, obj_j in enumerate(current_obj_list):
			if j <= i: # Make sure j is larger than i
				continue
			# print("the last of I:  ", obj_i['point'][-1][attr_name])
			# print("the first of J: ", obj_j['point'][0][attr_name])
			# print("")
			# print("obj_i['point'][-1][attr_name]", obj_i['point'][-1][attr_name])
			if abs(obj_i['point'][-1][attr_name] - obj_j['point'][0][attr_name]) < eps:
				obj_i['point'][-1][attr_name] = obj_j['point'][0][attr_name]
				obj_set.add(obj_i['id'], obj_j['id'])
				# print("nothing???")

	# print(obj_set.group)

	constraints = []

	obj_groups = []

	for g_i in obj_set.group:
		group = list(obj_set.group[g_i])
		obj_groups.append(group)
		for i in range(len(group)):
			for j in range(len(group)):
				if j <= i: # Make sure j is larger than i
					continue 
				obj_i = current_obj_dict[group[i]]
				obj_j = current_obj_dict[group[j]]
				# cal = (obj_i[0][attr_name] - obj_j[-1][attr_name]) * (obj_i[-1][attr_name] - obj_j[0][attr_name])
				# print(f"cal = ({obj_i[0][attr_name]} - {obj_j[-1][attr_name]}) * ({obj_i[-1][attr_name]} - {obj_j[0][attr_name]}) = {cal}")
				# console.log(attr_name)
				constraints.append(collision_pair_point_constraints(obj_i[0]['id'], obj_i[-1]['id'], obj_j[0]['id'], obj_j[-1]['id'], constraint_type = "collision_pair-" + attr_name)) 

	return constraints, obj_groups


	# for obj in current_obj_list:
	# 	if 

	# return current_obj_list




def link_current_point_list(current_point_list, control_point, tick, compare_name):
	tick_id = tick[3]
	tick_point = control_point[tick_id]

	constraints = []

	for point in current_point_list:
		constraints.append(get_larger_than_constraints(control_point, point['id'], tick_point['id'], constraint_type = compare_name, dis_type = "should"))

	return constraints


def get_minus_x_position(point):
	return - point['x']

def get_x_position(point):
	return point['x']

def get_minus_y_position(point):
	return - point['y']

def get_y_position(point):
	return point['y']


def add_inside_fixed(control_point, visual_object, tick_controlled_points, axis_type = "y"):

	constraints = []

	if (axis_type == "y"):
		another_attr = 'x'
	else:
		another_attr = 'y'

	
	# print("The axis is ", axis_type)
	for obj in visual_object:
		current_point_set = set(obj['control_point']) & set(tick_controlled_points)
		for p1_id in current_point_set:
			for p2_id in current_point_set:
				if p1_id < p2_id:
					point1 = control_point[p1_id]
					point2 = control_point[p2_id]

					if same_position(point1, point2, axis_type):
						constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-" + another_attr))
						constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-" + axis_type))
		flag = True
		control_point_num = len(obj['control_point'])

		for i, p1_id in enumerate(obj['control_point']):
			j = (i + 1) % control_point_num
			p2_id = obj['control_point'][j]
			point1 = control_point[p1_id]
			point2 = control_point[p2_id]

			if not (p1_id in tick_controlled_points and p2_id in tick_controlled_points):
				continue

			if same_position(point1, point2, another_attr) and not same_position(point1, point2, axis_type):
				constraints.append(add_link_constraints(p1_id, p2_id, force_type = axis_type + "_gravity", distance = point1[axis_type] - point2[axis_type]))
				constraints.append(add_link_constraints(p1_id, p2_id, force_type = another_attr + "_gravity", distance = point1[another_attr] - point2[another_attr]))

				if not flag:
					continue
				# constraints.append(add_link_constraints(p1_id, p2_id, force_type = "x_gravity", distance = 0))
				constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-" + another_attr))
				constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-" + axis_type))


					# flag = False

	# elif axis_type == "x":
	# 	# print("The axis is X")
	# 	for obj in visual_object:
	# 		for p1_id in obj['control_point']:
	# 			for p2_id in obj['control_point']:
	# 				if p1_id in tick_controlled_points and p2_id in tick_controlled_points and p1_id < p2_id:
	# 					point1 = control_point[p1_id]
	# 					point2 = control_point[p2_id]
	# 					if same_position(point1, point2, "x"):
	# 						constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-x"))
	# 						constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-y"))
	# 		flag = True
	# 		control_point_num = len(obj['control_point'])
	# 		for i, p1_id in enumerate(obj['control_point']):
	# 			j = (i + 1) % control_point_num
	# 			p2_id = obj['control_point'][j]
	# 			point1 = control_point[p1_id]
	# 			point2 = control_point[p2_id]

	# 			if not (p1_id in tick_controlled_points and p2_id in tick_controlled_points):
	# 				continue
					
				
	# 			if same_position(point1, point2, "y") and not same_position(point1, point2, "x"):
	# 				constraints.append(add_link_constraints(p1_id, p2_id, force_type = "y_gravity", distance = point1['y'] - point2['y']))
	# 				constraints.append(add_link_constraints(p1_id, p2_id, force_type = "x_gravity", distance = point1['x'] - point2['x']))

	# 				if not flag:
	# 					continue
	# 				# constraints.append(add_link_constraints(p1_id, p2_id, force_type = "y_gravity", distance = 0))
	# 				constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-x"))
	# 				constraints.append(pack_fixed_dis(control_point, p1_id, p2_id, "fixed-y"))
	# 				# flag = False

						
	return constraints
					

def same_position(point1, point2, attr_name = "x"):
	if point1[attr_name] == point2[attr_name]:
		return True
	else:
		return False

def same_x(point1, point2):
	if point1['x'] == point2['x']:
		return True
	else:
		return False


def same_y(point1, point2):
	if point1['y'] == point2['y']:
		return True
	else:
		return False

def find_tick_controlled_points_by_range(control_point, visual_object, tick, axis_type = "y"):
	# max_dis 是一个轴可以控制的最大的范围
	# 从tick 出发往两边出发。如果碰到了别的tick，那么停下，如果到了一个visual object那么从它出发，
	# 从 
	x_attr = "x"
	y_attr = "y"

	if (axis_type == "x"):
		tick_value = tick['position']
	else:
		tick_value = tick['position']

	through_object = []
	totally_object = []
	partially_object = []

	tick_range = tick['range']

	# print("tick range", tick_range)

	current_tick_range = abs(tick_range[0] - tick_range[1]) * 1.5

	for obj in visual_object:
		max_idx = axis_type + "_max"
		min_idx = axis_type + '_min'

		center_position = (obj[min_idx] + obj[max_idx]) / 2
		obj_size = abs(obj[max_idx] - obj[min_idx])

		# print("obj_size", obj_size)

		if obj_size <= current_tick_range and (tick_range[0] - center_position) * (tick_range[1] - center_position) < 0:
			totally_object.append(obj)
			# print("totally_inside!")

		elif obj_size > current_tick_range and (obj[min_idx] < tick_range[0] < obj[max_idx] or obj[min_idx] < tick_range[1] < obj[max_idx]):
			partially_object.append(obj)


	tick_controlled_points = []

	for obj in partially_object:
		for pid in obj['control_point']:
			point = control_point[pid]
			# print("point_id:", pid)
			# print(point['x'], tick[0] - max_dis / 2, tick[0] + max_dis / 2, ", tick: ", tick[0])
			if axis_type == "y":
				if tick_range[0] <= point[y_attr] < tick_range[1]:
					tick_controlled_points.append(pid)

			elif axis_type == "x":
				if tick_range[0] <= point[x_attr] < tick_range[1]:
					tick_controlled_points.append(pid)

	for obj in totally_object:
		tick_controlled_points.extend(obj['control_point'])

	through_object.extend(totally_object)
	through_object.extend(partially_object)

	return tick_controlled_points, through_object, totally_object, partially_object


def find_tick_controlled_points(control_point, visual_object, tick, max_dis, axis_type = "y", axis_related_vo = []):
	# max_dis 是一个轴可以控制的最大的范围
	# 从tick 出发往两边出发。如果碰到了别的tick，那么停下，如果到了一个visual object那么从它出发，
	# 从 


	x_attr = "x"
	y_attr = "y"

	if (axis_type == "x"):
		tick_value = tick['position'][x_attr]
	else:
		tick_value = tick['position'][y_attr]

	through_object = []

	# console.log('tick_vlaue')

	totally_object = []
	partially_object = []
	for obj in visual_object:
		if obj['id'] not in axis_related_vo:
			continue
		if axis_type == "y":
			if tick_value - max_dis / 2 <= obj['y_min'] and tick_value + max_dis / 2 >= obj['y_max']:
				totally_object.append(obj)
				# print("totally_inside!")

			elif tick_value - max_dis/2 <= obj['y_max'] < tick_value + max_dis/2 or tick_value - max_dis/2 <= obj['y_min'] < tick_value + max_dis/2 or obj['y_min'] < tick_value < obj['y_max']:
				partially_object.append(obj)
			
		if axis_type == "x":
			# print('type is x')
			if tick_value - max_dis/2 <= obj['x_min'] and tick_value + max_dis/2 >= obj['x_max']:
				totally_object.append(obj)
				# print("totally_inside!")
			elif tick_value - max_dis/2 <= obj['x_min'] < tick_value + max_dis/2 or tick_value - max_dis/2 <= obj['x_max'] < tick_value + max_dis/2 or obj['x_min'] < tick_value < obj['x_max']:
				partially_object.append(obj)

	tick_controlled_points = []

	for obj in partially_object:
		if obj['id'] not in axis_related_vo:
			continue
		for pid in obj['control_point']:
			point = control_point[pid]
			# print("point_id:", pid)
			# print(point['x'], tick[0] - max_dis / 2, tick[0] + max_dis / 2, ", tick: ", tick[0])
			if axis_type == "y":
				if tick_value - max_dis / 2 <= point[y_attr] < tick_value + max_dis / 2:
					tick_controlled_points.append(pid)

			elif axis_type == "x":
				if tick_value - max_dis / 2 <= point[x_attr] < tick_value + max_dis / 2:
					tick_controlled_points.append(pid)

	for obj in totally_object:
		tick_controlled_points.extend(obj['control_point'])

	through_object.extend(totally_object)
	through_object.extend(partially_object)

	return tick_controlled_points, through_object, totally_object, partially_object

def collision_pair_point_constraints(v1_p1, v1_p2, v2_p1, v2_p2, constraint_type = "collision_pair", eps = 0):

	return {"type": constraint_type, "v1_p1": v1_p1, "v1_p2": v1_p2, "v2_p1": v2_p1, "v2_p2": v2_p2, "eps": eps}


def get_larger_than_constraints(point_array, pid1, pid2, constraint_type = "x_larger_than", dis_type = "exact"):
	if constraint_type == "x_larger_than" or constraint_type == "x_smaller_than":
		if dis_type == "exact":
			distance = point_array[pid1]['x'] - point_array[pid2]['x']
		else:
			distance = point_array[pid1][constraint_type][0] - point_array[pid2]['x']

	elif constraint_type == "y_larger_than" or constraint_type == "y_smaller_than":
		if dis_type == "exact":
			distance = point_array[pid1]['y'] - point_array[pid2]['y']
		else:
			distance = point_array[pid1][constraint_type][0] - point_array[pid2]['y']

		

	return {"type": constraint_type, 'point1': pid1, "point2": pid2, 'distance': distance}

def pack_group_constraints(point_list, force_type = "collision_group_point"):
	return {"type": force_type, "point_list": point_list}

def add_link_constraints(pid1, pid2, force_type = "x_gravity", distance = 0):
	return {"type": force_type, "point1": pid1, "point2": pid2, "distance": distance}

def get_collision_constraints(point_group_list, collision_order, force_type = "collision_group", distance = 0, direction = "y", min_value = "", max_value = ""):
	another_direction = 'y'
	if direction == "y":
		another_direction = 'x'

	dis_this = "distance_" + direction
	dis_that = "distance_" + another_direction

	if min_value != "" and max_value != "":
		return {"type": force_type, "point_group_list": point_group_list, "collision_order": collision_order, dis_this: distance, dis_that: 0, "direction": direction, "min_value": min_value, "max_value": max_value}

	return {"type": force_type, "point_group_list": point_group_list, "collision_order": collision_order, dis_this: distance, dis_that: 0, "direction": direction}


def pack_fixed_dis(point_array, pid1, pid2, force_type = 'fixed-x', distance = None):
	if distance == None:
		if force_type == "fixed-x":
			distance = point_array[pid1]['x'] - point_array[pid2]['x']

		elif force_type == "fixed-y":
			distance = point_array[pid1]['y'] - point_array[pid2]['y']
	
	return {"type": force_type, "point1": pid1, "point2": pid2, "distance": distance}

