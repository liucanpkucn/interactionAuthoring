function get_close_data(){
    return _chart_object[0].CoordSys[0].coordinate_data
}

function get_chart_data(){
    return _chart_object[0].chart_json
}

function re_encode(canvas){
    let coord_data = canvas.CoordSys[0].coordinate_data
    let new_coord_data = JSON.parse(JSON.stringify(coord_data))
    let data_list = canvas.chart_json.parsed_data.data_list
    convert_bar_chart_to_area_chart(new_coord_data, data_list)
    console.log(new_coord_data)
    window._new_coord_data = new_coord_data
    canvas.draw_new_coordsys(new_coord_data)
}

function re_encode_area2bar(canvas, bar_width=10){
    let coord_data = canvas.CoordSys[0].coordinate_data
    let new_coord_data = JSON.parse(JSON.stringify(coord_data))
    let data_list = canvas.chart_json.parsed_data.data_list
    convert_area_chart_to_bar_chart(new_coord_data, data_list, bar_width)
    console.log(new_coord_data)
    window._new_coord_data = new_coord_data
    canvas.draw_new_coordsys(new_coord_data)
}

function re_encode_area2line(canvas){
    let coord_data = canvas.CoordSys[0].coordinate_data
    let new_coord_data = JSON.parse(JSON.stringify(coord_data))
    let data_list = canvas.chart_json.parsed_data.data_list
    convert_area_chart_to_line_chart(new_coord_data, data_list)
    console.log(new_coord_data)
    window._new_coord_data = new_coord_data
    canvas.draw_new_coordsys(new_coord_data)
}

function re_encode_line2area(canvas){
    let coord_data = canvas.CoordSys[0].coordinate_data
    let new_coord_data = JSON.parse(JSON.stringify(coord_data))
    let data_list = canvas.chart_json.parsed_data.data_list
    let should_y = canvas.y_axis_object_list[coord_data.y_axis].scale(0)
    convert_line_chart_to_area_chart(new_coord_data, should_y, data_list)
    console.log(new_coord_data)
    window._new_coord_data = new_coord_data
    canvas.draw_new_coordsys(new_coord_data)
}

function derive_line(canvas, obj_list, operation='diff') {
    let coord_data = canvas.CoordSys[0].coordinate_data
    let new_coord_data = JSON.parse(JSON.stringify(coord_data))
    let data_list = canvas.chart_json.parsed_data.data_list
    let should_y = canvas.y_axis_object_list[coord_data.y_axis].scale(0)
    if (operation == 'diff') {
        diff_line(new_coord_data, obj_list, should_y)
    }
    if (operation == 'sum') {
        sum_line(new_coord_data, obj_list, should_y)
    }
    console.log(new_coord_data)
    window._new_coord_data = new_coord_data
    canvas.draw_new_coordsys(new_coord_data)
    setTimeout(function(){
      auto_change_quantitative_scale(canvas, "y")
    }, 1000)
}

// function filter_range(canvas, attr, range) {
//     let coord_data = canvas.CoordSys[0].coordinate_data
//     coord_data.control_point.
// }

function split_visual_objects(visual_object, control_point, constraint, color_group){
}


function remove_useless_attr(new_vo){
    let remove_name = ['fixed_y_value', 'fixed_x_value', 'should_x_value', 'should_y_value', 'append_info']
    remove_name.forEach(function(d){
        if (d in new_vo)
            delete new_vo[d]
    })
}


function collision_group_new_idx(constraint, control_point){
    constraint.filter(d => d.type == "collision_group").forEach(function(d){
        let old_new_dict = new Array()
        d.point_group_list.forEach(function(point_group){
            let new_vid = control_point[point_group.point[0]].obj_id
            old_new_dict[point_group.vid] = new_vid
            point_group.vid = new_vid
        })
        d.collision_order = d.collision_order.map(q => old_new_dict[q])
    })
}

function deep_copy(old_obj){
    return JSON.parse(JSON.stringify(old_obj))
}


function convert_area_chart_to_bar_chart(new_coord_data, data_list, bar_width=10){
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    let constraints = new_coord_data.constraints
    let color_group = new_coord_data.groups[0]
    let obj_group_dict = deep_copy(color_group.obj_group_dict)
    color_group.group_list.forEach(d => {
        d.visual_object = []
    })
    color_group.group_list.obj_group_dict = {}
    let new_visual_object = []

    let control_point_length = control_point.length
    let new_control_point = deep_copy(control_point)
    let new_control_point_2 = deep_copy(control_point)
    new_control_point_2.forEach(d => {
        d.id = d.id+control_point_length;
    })
    console.log(new_control_point)
    console.log(new_control_point_2)
    new_control_point.push(...new_control_point_2)

    visual_object.forEach(function(old_vo){
        let direction_name = "fixed_y_value"
        if (!(direction_name in old_vo && old_vo[direction_name].length > 1)) return;

        let fixed_list = old_vo[direction_name]
        let pixel = bar_width
        fixed_list.forEach(function(d){
            let correspond_constraint = constraints[d.cons_idx]
            let new_vo = deep_copy(old_vo)
            new_vo.control_point = [d.pid[0], d.pid[1], d.pid[1]+control_point_length, d.pid[0]+control_point_length]
            new_vo['O_selected'] = new_control_point[d.pid[0]]['O_selected']
            new_vo['activate']= new_control_point[d.pid[0]]['activate']
            remove_useless_attr(new_vo)
            new_visual_object.push(new_vo)
            let vid = new_visual_object.length-1;
            new_vo.id = vid;
            new_control_point[d.pid[0]].obj_id = vid;
            new_control_point[d.pid[1]].obj_id = vid;
            new_control_point[d.pid[0]+control_point_length].obj_id = vid;
            new_control_point[d.pid[1]+control_point_length].obj_id = vid;
            constraints.push({'type': 'fixed-x', 'point1': d.pid[0], 'point2': d.pid[0]+control_point_length, 'distance': pixel})
            constraints.push({'type': 'fixed-x', 'point1': d.pid[1], 'point2': d.pid[1]+control_point_length, 'distance': pixel})
            constraints.push({'type': 'fixed-y', 'point1': d.pid[0]+control_point_length, 'point2': d.pid[1]+control_point_length, 'distance': constraints[d.cons_idx].distance})
            color_group.group_list[obj_group_dict[old_vo.id]].visual_object.push(vid);
            color_group.obj_group_dict[vid] = obj_group_dict[old_vo.id];
        })
    })
    constraints.filter(d => d.type == "collision_group").forEach(function(d){
        let old_new_dict = new Array()
        d.point_group_list.forEach(function(point_group){
            let new_vid = new_control_point[point_group.point[0]].obj_id
            point_group.point.push(point_group.point[0]+control_point_length);
            point_group.point.push(point_group.point[1]+control_point_length);
            old_new_dict[point_group.vid] = new_vid
            point_group.vid = new_vid
        })
        d.collision_order = d.collision_order.map(q => old_new_dict[q])
    })
    new_control_point.forEach(function(d, i){
        d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })
    
    data_list.forEach(function(d) {
        d.related_point.push(...d.related_point.map(d => d+control_point_length))
        d.related_vo = new_control_point[d.related_point[0]].obj_id;
    })

    new_coord_data.visual_object = new_visual_object
    new_coord_data.constraints = constraints
    new_coord_data.control_point = new_control_point
    new_coord_data.visual_object_num = new_visual_object.length
}


function convert_area_chart_to_line_chart(new_coord_data, data_list){
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    let constraints = new_coord_data.constraints
    let color_group = new_coord_data.groups[0]
    let new_visual_object = []

    let new_control_point = deep_copy(control_point)

    visual_object.forEach(function(old_vo){
        let direction_name = "fixed_y_value"
        let fixed_list = old_vo[direction_name]
        let new_vo = deep_copy(old_vo)
        new_vo.type = 'line'
        new_vo.stroke_width = 5
        new_vo.stroke = new_vo.fill
        remove_useless_attr(new_vo)
        new_vo.control_point = []
        fixed_list.forEach(function(d){
            let correspond_constraint = constraints[d.cons_idx]
            new_control_point[d.pid[0]].should_y = new_control_point[d.pid[0]].should_y - Math.abs(correspond_constraint.distance);
            console.log(d.pid[0], control_point[d.pid[0]].should_y, correspond_constraint.distance)
            new_vo.control_point.push(d.pid[0])
            new_control_point[d.pid[1]].remove = true
        })
        new_visual_object.push(new_vo);
    })
    
    
    //delete useless control point
    new_control_point = new_control_point.filter(d => !d.remove)
    control_point_dict = new Array()
    new_control_point.forEach(function(d,i){
        control_point_dict[d.id] = i
    })
    new_visual_object.forEach(function(d){
        d.control_point = d.control_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
    })

    new_control_point.forEach(function(d, i){
        d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })

    data_list.forEach(function(d) {
        d.related_point = d.related_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
        d.related_vo = new_control_point[d.related_point[0]].obj_id
    })

    new_coord_data.append_text = []

    new_coord_data.visual_object = new_visual_object
    new_coord_data.constraints = []
    new_coord_data.control_point = new_control_point
    new_coord_data.visual_object_num = new_visual_object.length
}


function diff_line(new_coord_data, object_list, should_y) {
    let obj1 = object_list[0]
    let obj2 = object_list[1]
    
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    console.log(control_point)
    let constraint = new_coord_data.constraints
    console.log('constraint', constraint)
    let color_group = new_coord_data.groups[0]
    let new_visual_object = []

    let old_vo1 = visual_object[obj1]
    let old_vo2 = visual_object[obj2]
    let new_vo = deep_copy(old_vo1)
    remove_useless_attr(new_vo)
    new_vo.id = 0
    new_visual_object.push(new_vo)

    old_vo1.control_point.forEach(function(d, i) {
        control_point[d].should_y = should_y + control_point[d].should_y - control_point[old_vo2.control_point[i]].should_y;
        control_point[d].obj_id = 0
    })
    visual_object.forEach(function(old_vo, i) {
        console.log(obj1, i)
        if (i != obj1) {
            old_vo.control_point.forEach(function(d) {
                control_point[d].remove = true
            })
        }
    })
  
    new_control_point = control_point.filter(d => !d.remove)
    control_point_dict = new Array()
    new_control_point.forEach(function(d,i){
        control_point_dict[d.id] = i
    })
    
    new_control_point.forEach(function(d, i){
        d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })

    new_visual_object.forEach(function(d){
        d.control_point = d.control_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
    })

    new_coord_data.visual_object = new_visual_object
    new_coord_data.control_point = new_control_point
    console.log(new_coord_data)
}

function sum_line(new_coord_data, object_list, should_y) {
    let obj1 = object_list[0]
    
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    console.log(control_point)
    let constraint = new_coord_data.constraints
    console.log('constraint', constraint)
    let color_group = new_coord_data.groups[0]
    let new_visual_object = []

    let old_vo1 = visual_object[obj1]
    let new_vo = deep_copy(old_vo1)
    remove_useless_attr(new_vo)
    new_vo.id = 0
    new_visual_object.push(new_vo)

    old_vo1.control_point.forEach(function(d, i) {
        for (let j = 1; j < object_list.length; j++) {
            control_point[d].should_y = control_point[d].should_y + control_point[visual_object[object_list[j]].control_point[i]].should_y - should_y;
        }
        control_point[d].obj_id = 0
    })
    visual_object.forEach(function(old_vo, i) {
        console.log(obj1, i)
        if (object_list.indexOf(i) > 0) {
            old_vo.control_point.forEach(function(d) {
                control_point[d].remove = true
            })
        }
        else if (object_list.indexOf(i) == -1){
            new_visual_object.push(old_vo)
            remove_useless_attr(old_vo)
            old_vo.id = new_visual_object.length - 1
            old_vo.control_point.forEach(function(d, i) {
                control_point[d].obj_id = old_vo.id
            })
        }
    })
  
    new_control_point = control_point.filter(d => !d.remove)
    control_point_dict = new Array()
    new_control_point.forEach(function(d,i){
        control_point_dict[d.id] = i
    })
    
    new_control_point.forEach(function(d, i){
        d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })

    new_visual_object.forEach(function(d){
        d.control_point = d.control_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
    })

    new_coord_data.visual_object = new_visual_object
    new_coord_data.control_point = new_control_point
    console.log(new_coord_data)
}

function convert_line_chart_to_area_chart(new_coord_data, should_y, data_list){
    console.log(should_y)
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    let constraints = new_coord_data.constraints
    let color_group = new_coord_data.groups[0]
    let new_visual_object = []

    let new_control_point = deep_copy(control_point)

    let control_point_length = control_point.length
    let new_control_point_2 = deep_copy(control_point)
    new_control_point_2.forEach(d => {
        d.id = d.id+control_point_length;
    })
    new_control_point.push(...new_control_point_2)
    console.log(new_control_point)

    let collision_dict = {}
    let groups = []
    groups.push({'type': 'single', 'group_list': [], 'obj_group_dict': {}, 'order': 'x', 'order_list': []})

    visual_object.forEach(function(old_vo){
        let direction_name = "fixed_y_value"
        let fixed_list = old_vo[direction_name]
        let new_vo = deep_copy(old_vo)
        new_visual_object.push(new_vo);
        new_vo.obj_id = new_visual_object.length-1;
        new_vo.type = 'area'
        new_vo.fill = new_vo.stroke
        remove_useless_attr(new_vo)
        new_vo.control_point = []
        old_vo.control_point.forEach(function(d){
            let distance = Math.abs(should_y - new_control_point[d].should_y)
            new_control_point[d].should_y = should_y
            new_control_point[d].smaller_y = should_y
            new_control_point[d+control_point_length].should_y = should_y
            new_control_point[d+control_point_length].smaller_y = should_y
            constraints.push({'type': 'fixed-y', 'point1': d, 'point2': d+control_point_length, 'distance': distance})
            new_vo.control_point.push(d)
            if (!collision_dict.hasOwnProperty(new_control_point[d].should_x)) {
                collision_dict[new_control_point[d].should_x] = {'type': 'collision_group', 'direction': 'y', collision_order: [], point_group_list: [], 'distance_x': 0, 'distance_y': 0, 'group_id': 0}
            }
            collision_dict[new_control_point[d].should_x].collision_order.push(new_vo.obj_id)
            collision_dict[new_control_point[d].should_x].point_group_list.push({'point': [d, d+control_point_length], vid: new_vo.obj_id})
        })
        
        old_vo.control_point.reverse().forEach(function(d){
            new_vo.control_point.push(d+control_point_length)
        })
        groups[0].group_list.push({'color': new_vo.fill, visual_object: [new_vo.obj_id]})
        groups[0].obj_group_dict[new_vo.obj_id] = new_vo.obj_id
        groups[0].order_list.push(new_vo.obj_id)
    })

    for (let key in collision_dict) {
        constraints.push(collision_dict[key])
    }

    new_control_point.forEach(function(d, i){
        // d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })

    data_list.forEach(function(d) {
        d.related_point.push(...d.related_point.map(d => d+control_point_length))
        d.related_vo = new_control_point[d.related_point[0]].obj_id;
    })
    new_coord_data.visual_object = new_visual_object
    new_coord_data.constraints = constraints
    new_coord_data.control_point = new_control_point
    new_coord_data.visual_object_num = new_visual_object.length
    new_coord_data.groups = groups;
}



function convert_bar_chart_to_area_chart(new_coord_data, data_list){
    let visual_object = new_coord_data.visual_object
    let control_point = new_coord_data.control_point
    let constraint = new_coord_data.constraints
    let color_group = new_coord_data.groups[0]
    let new_visual_object = color_group.group_list.map(function(d, i){
        let old_vo_list = d.visual_object.map(idx => visual_object[idx])
        let new_vo = JSON.parse(JSON.stringify(old_vo_list[0]))
        remove_useless_attr(new_vo)
        let direction_name = "fixed_y_value"
        let fixed_list = old_vo_list.map(d =>d[direction_name][0])
        let remove_list = old_vo_list.map(d =>d[direction_name][1])

        new_vo.control_point = []
        new_vo.control_point = fixed_list.map(d => d.pid[0])
        new_vo.id = i
        new_vo.control_point.push(...fixed_list.map(d => d.pid[1]).reverse())
        remove_list.forEach(function(old_vo){
            control_point[old_vo.pid[0]].remove = true
            control_point[old_vo.pid[1]].remove = true
            // old_vo.control_point.forEach(function(cp){
            //     control_point[cp].obj_id = i
            // })
        })
        new_vo.control_point.forEach(pid => control_point[pid].obj_id = i)
        return new_vo
    })
    color_group.group_list.forEach((d, i) => d.visual_object = [i])
    color_group.obj_group_dict = new Array()
    new_visual_object.forEach(function(d, i){
        color_group.obj_group_dict[d.id] = i
    })
    
    collision_group_new_idx(constraint, control_point)
    new_control_point = control_point.filter(d => !d.remove)
    control_point_dict = new Array()
    new_control_point.forEach(function(d,i){
        control_point_dict[d.id] = i
    })
    constraint = constraint.filter(function(d){
        if (d.hasOwnProperty('point1'))
            if (!(d.point1 in control_point_dict))
                return false
        if (d.hasOwnProperty('point2'))
            if (!(d.point2 in control_point_dict))
                return false
        return true
    })
    constraint.forEach(function(d){
        if (d.hasOwnProperty('point1'))
            d.point1 = control_point_dict[d.point1]
        if (d.hasOwnProperty('point2'))
            d.point2 = control_point_dict[d.point2]
        if (d.hasOwnProperty('point_group_list'))
        {
            d.point_group_list.forEach(function(point_group){
                point_group.point = point_group.point
                    .filter(d => d in control_point_dict)
                    .map(d => control_point_dict[d])
            })
        }
    })
    new_control_point.forEach(function(d, i){
        d.id = i
        delete d.index
        delete d.vx
        delete d.vy
    })
    new_visual_object.forEach(function(d){
        d.control_point = d.control_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
    })

    data_list.forEach(function(d) {
        d.related_point = d.related_point.filter(d => d in control_point_dict).map(d => control_point_dict[d])
        d.related_vo = new_control_point[d.related_point[0]].obj_id
    })

    new_coord_data.visual_object = new_visual_object
    new_coord_data.constraints = constraint
    new_coord_data.control_point = new_control_point
    new_coord_data.visual_object_num = new_visual_object.length
}
