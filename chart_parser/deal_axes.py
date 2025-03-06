def format_axes(axis_objs, axis_type = "x"):
	special_icon = ['$']

	text_content = [item['content'].replace('$', '').strip() for item in axis_objs]
	
	text_is_number = [judge_number(text) for text in text_content]
	if axis_type == "x":
		posi = [[(item['left'] + item['right']) / 2, item['up'], item['content'], item["id"]] for item in axis_objs]
		axis_range = {"min": min([item[0] for item in posi]), "max": max([item[0] for item in posi])}
	else:
		posi = [[item['right'], (item['up'] + item['down']) / 2, item['content'], item['id']] for item in axis_objs]
		axis_range = {"min": min([item[1] for item in posi]), "max": max([item[1] for item in posi])}
	if sum(text_is_number) > len(text_is_number) / 2 :
		attr_type = "Q"

	else:
		attr_type = "C"

	return {"attr_type": attr_type, "axis_type": axis_type, "position": posi, "obj_id": [item['id'] for item in axis_objs], "content": [item['content'] for item in axis_objs], 'axis_range': axis_range}


def get_axes(control_point, visual_object, width, height, x_left_part = True):

	print("width", width)

	width_count = [0 for i in range(int(width) + 1)]
	height_count = [0 for i in range(int(height) + 1)]

	text_objs = [obj for obj in visual_object if obj['type'] == "text"]

	for obj in text_objs:
		for i in range(int(obj["left"]), int(obj['right'])):
			if i > width or i < 0:
				continue
			width_count[i] += 1

		for i in range(int(obj['up']), int(obj['down'])):
			if i > height or i < 0:
				continue
			height_count[i] += 1



	# print(width_count)

	# 假设Y轴就存在于左半边

	if x_left_part:
		width_count = width_count[0: int(width/2)]

	max_width_position = width_count.index(max(width_count))
	max_height_position = height_count.index(max(height_count))


	print('X 方向的排列: ', width_count)
	print("X 方向最大的值: ", max_width_position)
	print("Y 方向最大的值: ", max_height_position)


	x_axis_objs = [obj for obj in text_objs if obj['up'] - 1 <= max_height_position <= obj['down']]
	y_axis_objs = [obj for obj in text_objs if obj['left'] - 1 <= max_width_position <= obj['right']]

	formatted_x_axis = format_axes(x_axis_objs, 'x')
	formatted_y_axis = format_axes(y_axis_objs, "y")

	print('x content: ', formatted_x_axis['content'], formatted_x_axis['attr_type'])
	print('y content: ', formatted_y_axis['content'], formatted_y_axis['attr_type'])
	
	print('x range: ', formatted_x_axis['axis_range'])
	print('y range: ', formatted_y_axis['axis_range'])

	print('x posi 0: ', formatted_x_axis['position'][0])
	print('y posi 0: ', formatted_y_axis['position'][0])


	# y_axis_objs = [obj for obj in text_objs if obj['left'] - 1 <= max_width_position <= obj['right']]



	print("width", width_count.index(max(width_count)), max(width_count))

	print("height", height_count.index(max(height_count)), max(height_count))

	return formatted_x_axis, formatted_y_axis


def judge_number(text):
	return text.isnumeric()

