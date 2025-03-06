

function parse_collision_pair_new(x_larger_list, y_larger_list, control_point, visual_object, constraints, groups){

  let pair_constraints = constraints.filter(d => d.type === "collision_group")

  // console.log('pair_constraints', pair_constraints)

  for (let cons of pair_constraints){
    if ('group_id' in cons){
      let group = groups[cons['group_id']]
      if (group.activate === false)
        continue
      let order = group['order']
      let larger_list = []
      if (order === "x")
        larger_list = x_larger_list
      else if (order === "y")
        larger_list = y_larger_list
      let larger_name = order + "_larger"
      let color_group_dict = group["obj_group_dict"]
      let color_order_list = group['order_list']
      let point_group_list = cons.point_group_list

      let activate_group_order_index = []

      for (let current_sub of point_group_list){
        let vid = current_sub.vid
        if (!visual_object[vid].activate)
          continue

        if (!(vid in color_group_dict))
          continue

        let current_group = color_group_dict[vid]
        let current_group_index = color_order_list.indexOf(current_group)
        // console.log(current_group_index)
        if (activate_group_order_index.indexOf(current_group_index) === -1)
          activate_group_order_index.push(current_group_index)
      }

      activate_group_order_index.sort((a, b)=> a - b)
      // console.log('color_order_list', color_order_list)
      // console.log("activate_group_order_index", activate_group_order_index)

      for (let i = 0, n = point_group_list.length; i < n; i ++){
        for (let j = i + 1; j < n; j ++){
          let v1 = point_group_list[i].vid
          let v2 = point_group_list[j].vid
          let point_list_1 = point_group_list[i].point 
          let point_list_2 = point_group_list[j].point
          if (!(v1 in color_group_dict && v2 in color_group_dict))
            continue
          if (!visual_object[v1].activate || !visual_object[v2].activate)
            continue

          let v1_group = color_group_dict[v1]
          let v2_group = color_group_dict[v2]

          let v1_group_index = color_order_list.indexOf(v1_group)
          let v2_group_index = color_order_list.indexOf(v2_group)

          if (activate_group_order_index.indexOf(v1_group_index) === activate_group_order_index.indexOf(v2_group_index) + 1){
            for (let p1 of point_list_1){
              for (let p2 of point_list_2){
                larger_list.push({point1: p1, point2: p2, distance: cons["distance_" + order], type: larger_name})
              }
            }
          }
          else if (activate_group_order_index.indexOf(v1_group_index) === activate_group_order_index.indexOf(v2_group_index) - 1){
            for (let p1 of point_list_1){
              for (let p2 of point_list_2){
                larger_list.push({point1: p2, point2: p1, distance: cons["distance_" + order], type: larger_name})
              }
            }
          }
        }
      }
    }
    else{
      let collision_order = cons.collision_order
      let point_group_list = cons.point_group_list
      let activate_vid_list = collision_order.filter(vid => visual_object[vid].activate)
      let larger_list, larger_name
      if (cons.direction === "x"){
        larger_list = x_larger_list
        larger_name = "x_larger"
      }
      else{
        larger_list = y_larger_list
        larger_name = "y_larger"
      }
      for (let i = 0, n = point_group_list.length; i < n; i ++){
        for (let j = i + 1; j < n; j ++){
          let v1 = point_group_list[i].vid
          let v2 = point_group_list[j].vid
          let point_list_1 = point_group_list[i].point 
          let point_list_2 = point_group_list[j].point

          if (!visual_object[v1].activate || !visual_object[v2].activate)
            continue

          if (activate_vid_list.indexOf(v1) === activate_vid_list.indexOf(v2) + 1){
            for (let p1 of point_list_1){
              for (let p2 of point_list_2){
                larger_list.push({point1: p1, point2: p2, distance: cons.distance, type: larger_name})
              }
            }
          }
          else if (activate_vid_list.indexOf(v1) === activate_vid_list.indexOf(v2) - 1){
            for (let p1 of point_list_1){
              for (let p2 of point_list_2){
                larger_list.push({point1: p2, point2: p1, distance: cons.distance, type: larger_name})
              }
            }
          }
        }
      }
    }
  }
}

function parse_collision_pair_with_order(larger_list, control_point, visual_object, constraints, group, larger_name = "y_larger"){
  let color_group_dict = group["obj_group_dict"]
  let color_order_list = group['order_list']
  let pair_constraints
  if (larger_name === "y_larger"){
    pair_constraints = constraints.filter(d => d.type === "collision_pair-y" || d.type === "collision_pair-cy")
  }
  else {
    pair_constraints = constraints.filter(d => d.type === "collision_pair-x" || d.type === "collision_pair-cx")
  }


  for (let cons of pair_constraints){
    let v1_p1 = cons['v1_p1']
    let v1_p2 = cons['v1_p2']
    let v2_p1 = cons['v2_p1']
    let v2_p2 = cons['v2_p2']

    let v1 = control_point[v1_p1]['obj_id']
    let v2 = control_point[v2_p2]['obj_id']

    if (v1 in color_group_dict && v2 in color_group_dict){
      if (!visual_object[v1].activate || !visual_object[v2].activate)
        continue

      v1_group = color_group_dict[v1]
      v2_group = color_group_dict[v2]

      v1_group_index = color_order_list.indexOf(v1_group)
      v2_group_index = color_order_list.indexOf(v2_group)

      if (v1_group_index > v2_group_index ){
        larger_list.push({point1: v1_p1, point2: v2_p1, distance: 0, type: larger_name})
        larger_list.push({point1: v1_p1, point2: v2_p2, distance: 0, type: larger_name})
        larger_list.push({point1: v1_p2, point2: v2_p1, distance: 0, type: larger_name})
        larger_list.push({point1: v1_p2, point2: v2_p2, distance: 0, type: larger_name})
      }
      else if (v1_group_index < v2_group_index){
        larger_list.push({point1: v2_p1, point2: v1_p1, distance: 0, type: larger_name})
        larger_list.push({point1: v2_p1, point2: v1_p2, distance: 0, type: larger_name})
        larger_list.push({point1: v2_p2, point2: v1_p1, distance: 0, type: larger_name})
        larger_list.push({point1: v2_p2, point2: v1_p2, distance: 0, type: larger_name})
      }
    }
    else{

    }
  }
}



function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}



function add_constraints_visual_object(constraints, visual_object, control_point){
  
  let value_name = ['fixed_y_value', 'fixed_x_value', 'should_x_value', 'should_y_value']
  constraints.forEach(function(cons){
    if (cons.type === "fixed-y")
    {
      let obj_1 = control_point[cons.point1].obj_id
      let obj_2 = control_point[cons.point2].obj_id
      if (obj_1 === obj_2 && cons.hasOwnProperty('distance_value') && Math.abs(control_point[cons.point1].ox - control_point[cons.point2].ox) < 2){
        let current_vo = visual_object[obj_1]
        if (!current_vo.hasOwnProperty('fixed_y_value')){
          current_vo['fixed_y_value'] = []
        }
        current_vo['fixed_y_value'].push({"pid": [cons.point1, cons.point2], "value": cons.distance_value})
      }
    }
    else if (cons.type === "fixed-x")
    {
      let obj_1 = control_point[cons.point1].obj_id
      let obj_2 = control_point[cons.point2].obj_id
      if (obj_1 === obj_2 && cons.hasOwnProperty('distance_value') && Math.abs(control_point[cons.point1].oy - control_point[cons.point2].oy) < 2 && Math.abs(cons.distance) > 1){
        let current_vo = visual_object[obj_1]
        if (!current_vo.hasOwnProperty('fixed_x_value')){
          current_vo['fixed_x_value'] = []
        }
        current_vo['fixed_x_value'].push({"pid": [cons.point1, cons.point2], "value": cons.distance_value})
      }
    }
  })

  control_point.forEach(function(cp){
    let current_vo = visual_object[cp.obj_id]
    if (cp.hasOwnProperty('should_y_value')){
      if (!current_vo.hasOwnProperty('should_y_value'))
        current_vo['should_y_value'] = []
      current_vo['should_y_value'].push({'pid': [cp.id], 'value':cp.should_y_value})
    }
    if (cp.hasOwnProperty('should_x_value')){
      if (!current_vo.hasOwnProperty('should_x_value'))
        current_vo['should_x_value'] = []
      current_vo['should_x_value'].push({'pid': [cp.id], 'value':cp.should_x_value})
    }
  })
  visual_object.forEach(function(current_vo){
    value_name.forEach(function(attr){
      if (current_vo.hasOwnProperty(attr)){
        current_vo[attr].sort(function(a, b){
          if (attr === "should_y_value" || attr === "fixed_x_value"){
            return control_point[a.pid[0]].oy - control_point[b.pid[0]].oy
          }
          else{
            return control_point[a.pid[0]].ox - control_point[b.pid[0]].ox
          }
        })
      }
    })
  })
}



