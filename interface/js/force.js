
let chart_margin = {x: 50, y: 50}
let main_canvas_trans = {x: 0, y: 0}
let window_interval = 30
let original_chart_json
let timerHintForAxis = null;

let action_list = []


let canvas_main = function(data){
  console.log("It works")

  let chart_json = data
  let svg_string = data.svg_string

  main_canvas_trans.x = 0
  main_canvas_trans.y = 0 

  d3.select("body").append('div')
    .attr('id', "tooltip")
    .style('opacity', 0)


  let window_width = document.getElementById("canvas").clientWidth
  let window_height = document.getElementById("canvas").clientHeight
  let chat_body_width = document.getElementById("chat-body")?.clientWidth
  if (chat_body_width){
    window_width = window_width - chat_body_width
  }
  this.chart_json = chart_json
  this.force_button_click = false
  this.brush_selected = false

  // chart_json.CoordSys.reverse()

  // Set the original Chart Json
  original_chart_json = chart_json

  // Set up the main svg

  d3.select("#canvas").selectAll('svg')
    .remove()

  let svg_contain = d3.select("#canvas").append("svg")
    .attr("width", window_width)
    .attr("height", window_height)
    .attr("id", "canvas_svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr('xmlns:xhtml', "http://www.w3.org/1999/xhtml")
    .attr("viewBox", [0, 0, window_width, window_height])

  // add strip 


  add_strip_defs(svg_contain)

  // move main canvas and resize the window

  let svg = move_main_canvas(svg_contain, window_width, window_height)

  // define main svg 

  new_chart_json = JSON.parse(JSON.stringify(chart_json))

  let resize = 1
  if (data.size.width > window_width ){
    resize = window_width * 0.7 / data.size.width
  }
  if (data.size.height > window_height ){
    resize = window_height * 0.7 / data.size.height
  }
  console.log(resize)
  let chart_object = []
  // let try_draw = new draw_a_canvas(svg, chart_json, {x: 100, y: 100}, loop_flag, move_current, try_polar, show_should = show_should, need_back_end_cal, resize = 1, node_radius = 0.1, svg_string = svg_string)
  let begin_point = {x: (window_width - data.size.width * resize) / 2 - chart_margin.x, y: (window_height - data.size.height * resize) / 2 - chart_margin.y}
  let try_draw = new draw_a_canvas(svg, new_chart_json, begin_point, resize = resize)

  console.log("begin_point", begin_point)
  
  chart_object.push(try_draw)

  console.log(chart_object)
  window._chart_object = chart_object

  this.begin_point = begin_point
  window._begin_point = begin_point
  // return begin_point
}


let draw_a_canvas = function(svg, chart_json, begin_point, resize = 1){

  // resize_transform(chart_json.transform, resize)

  // main_transform.y_rate *= 2  // This line is to reduce the y_rate into a half.

  // console.log("transform: ", chart_json.transform)
  
  this.share_json = [];

  console.log("axis~~~", chart_json.axis.x[0])
  this.dragOderStatus = 0;

  let svg_string = chart_json['svg_string']

  chart_json.size.width *= resize
  chart_json.size.height *= resize

  let chart_real_width = chart_json.size.width
  let chart_real_height = chart_json.size.height

  let chart_width = chart_real_width + 2 * chart_margin.x
  let chart_height = chart_real_height + 2 * chart_margin.y

  this.start_point = {x: begin_point.x, y: begin_point.y}

  let start_point = this.start_point


  this.chart_json = chart_json

  let plot_area = {x: start_point.x, y: start_point.y, width: chart_width, height: chart_height}
  this.plot_area = plot_area
  let current_canvas_object = this 
  let current_canvas_id = -1

  this.current_canvas_id = -1


  let current_canvas = svg
    .append('g')
    .attr('id', 'current_canvas')
    .attr('transform', 'translate(' + start_point.x + "," + start_point.y + ")")

  let current_canvas_svg = current_canvas.append('svg')
    .attr("id", 'current_canvas_svg')



  // add foreignObject


  let div_margin = {x: 20, y: 50}

  let back_board_obj = current_canvas.append('foreignObject')
    .attr('width', chart_width + div_margin.x * 2)
    .attr('height', chart_height + div_margin.y * 2)
    .attr('x', - div_margin.x)
    .attr('y', - div_margin.y)
    .style("pointer-events", "none")

  let back_board = back_board_obj.append('xhtml:div')
    .style('position', 'absolute')
    .style('width', chart_width + 'px')
    .style('height', chart_height + 'px')
    .style('left', div_margin.x + 'px')
    .style('top', div_margin.y + 'px')
    .attr('class', 'beautiful')



  current_canvas
    .on('mouseover', function(){
      // current_canvas.raise()
      back_board.classed('highlight', true)
    })
    .on('mouseout', function(){
      // current_canvas.raise()
      back_board.classed('highlight', false)
    })

  // 当点击时，当前窗口被唤起，顺序将调整到前方

  current_canvas
    .on('click', function(){
      current_canvas.raise()
    })

  this.canvas_part = current_canvas


  // add the background svg

  let svg_contain = current_canvas.append('g')
      .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ')')

  let svg_contain_back = ""

  if (svg_string !== ""){

    svg_contain
      .html(svg_string)

    svg_contain_back = svg_contain
      .select('svg')
      .attr('width', chart_real_width)
      .attr('height', chart_real_height)

  }


    // .append('g')
    // .attr('transform', "scale(0.5)")
    // .attr('transform', 'translate(' + (window_width - chart_width)/2 + "," + (window_height - chart_height)/2 + ")")

  let border_canvas = current_canvas.append('g')

  let border_rect = border_canvas.append('rect')
    .attr('width', chart_width)
    .attr('height', chart_height)
    .attr('fill', "#fff")
    .attr('opacity', 0)
    .attr("class", "mainrect")
    .style('cursor', 'move')

  this.update_move_rect = function()
  {
    border_rect
      .attr('width', this.plot_area.width)
      .attr('height', this.plot_area.height)
  }

  let corner_canvas = current_canvas.append('g')

  let button_width = 26
  let button_height = 26

  let button_left = 20
  let button_top = 20
  let button_interval = 14


  let button_array = ["delete", "copy", "reset", "force_up"]

  let svg_array = ['<svg width="25px" height="25px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">        <g id="main" transform="translate(-663.000000, -176.000000)">            <g id="View" transform="translate(272.000000, 172.000000)">                <g id="Group-5" transform="translate(391.000000, 4.000000)">                    <rect id="Rectangle" x="0" y="0" width="18" height="18"></rect>                    <path d="M9,17 C13.418278,17 17,13.418278 17,9 C17,4.581722 13.418278,1 9,1 C4.581722,1 1,4.581722 1,9 C1,13.418278 4.581722,17 9,17 Z M4.99917209,5.00124609 L13,13 M5,13 L13.0019084,5.00313936" id="Oval-2" stroke="#797979"></path>                </g>            </g>        </g>    </g></svg>',
  '<svg width="25px" height="25px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">        <g id="main" transform="translate(-664.000000, -201.000000)">            <g id="View" transform="translate(272.000000, 172.000000)">                <g id="Group-4" transform="translate(392.000000, 29.000000)">                    <rect id="Rectangle" fill="#FFFFFF" x="0" y="0" width="18" height="18"></rect>                    <rect id="Rectangle" stroke="#797979" x="1.5" y="2.5" width="12" height="12"></rect>                    <rect id="Rectangle" stroke="#797979" fill="#FFFFFF" x="4.5" y="5.5" width="11" height="11"></rect>                </g>            </g>        </g>    </g></svg>',
  '<svg width="25px" height="25px" viewBox="0 0 18 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">        <g id="main" transform="translate(-664.000000, -241.000000)">            <g id="reset" transform="translate(663.000000, 240.000000)">                <rect id="Rectangle" x="1" y="0" width="18" height="18"></rect>                <path d="M1.25,17 L18.5,17" id="Path" stroke="#797979"></path>                <g id="Group" transform="translate(2.000000, 2.000000)">                    <g id="Path">                        <path d="M1.625,2.80769231 C2.875,1.30769231 4.625,0.269230769 6.875,0.153846154 C10.875,-0.192307692 14.5,2.57692308 14.875,6.26923077 C15.25,9.96153846 12.25,13.3076923 8.25,13.6538462 C5.125,13.8846154 2.125,12.2692308 0.875,9.73076923" stroke="#797979"></path>                        <polygon fill="#797979" fill-rule="nonzero" points="3.625 3.26923077 0.5 5.11538462 0.25 1.65384615"></polygon>                    </g>                </g>            </g>        </g>    </g></svg>',
  '<svg width="25px" height="25px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">        <g id="main" transform="translate(-664.000000, -263.000000)">            <g id="View" transform="translate(268.000000, 165.000000)">                <g id="force_up" transform="translate(396.000000, 98.000000)">                    <rect id="Rectangle" fill="#FFFFFF" x="0" y="0" width="18" height="18"></rect>                    <g transform="translate(1.000000, 1.000000)">                        <path d="M0,15 L16,15" id="Path" stroke="#797979"></path>                        <g id="Group" transform="translate(1.000000, 0.000000)">                            <path d="M1.5,0 L1.5,13" id="Path"></path>                            <g id="Path">                                <path d="M1.93684211,3.08 L1.93684211,12.88" stroke="#797979"></path>                                <polygon fill="#797979" fill-rule="nonzero" points="0.0421052632 3.64 1.93684211 0 3.83157895 3.64"></polygon>                            </g>                        </g>                        <g id="Group" transform="translate(6.000000, 0.000000)">                            <path d="M1.5,0 L1.5,13" id="Path"></path>                            <g id="Path">                                <path d="M1.93684211,3.08 L1.93684211,12.88" stroke="#797979"></path>                                <polygon fill="#797979" fill-rule="nonzero" points="0.0421052632 3.64 1.93684211 0 3.83157895 3.64"></polygon>                            </g>                        </g>                        <g id="Group" transform="translate(11.000000, 0.000000)">                            <path d="M1.5,0 L1.5,13" id="Path"></path>                            <g id="Path">                                <path d="M1.93684211,3.08 L1.93684211,12.88" stroke="#797979"></path>                                <polygon fill="#797979" fill-rule="nonzero" points="0.0421052632 3.64 1.93684211 0 3.83157895 3.64"></polygon>                            </g>                        </g>                    </g>                </g>            </g>        </g>    </g></svg>']


  let current_button_group = current_canvas
    .append('g')
    .attr('id', 'button_group')

  let current_button = current_button_group
    .selectAll('.button')
    .data(button_array)
    .enter()
    .append('g')
    .attr('class', 'button')
    .attr('transform', (d, i) => 'translate(' + button_left + ',' + (button_top + i * (button_height + button_interval)) + ')')

  let current_icon = current_button.append('g')
    // .attr('href', d => server_position + "image/" + d + "_icon.svg")
    .html((d, i) => svg_array[i])

  current_icon
    .attr('width', button_width)
    .attr('height', button_height)

  current_button.append('rect')
    .attr('width', button_width)
    .attr('height', button_height)
    .attr('opacity', 0)

  current_button
    .on('mouseover', function(e, d){
      console.log("mouse over", d)
      show_tooltip(d, parseInt(e.x) - 100, parseInt(e.y) - 30)
    })
    .on('mouseout', function(e, d){
      hide_tooltip()
    })


  function delete_current_canvas(){
    let current_canvas_index = _chart_object.indexOf(current_canvas_object)
    _chart_object.splice(current_canvas_index, 1)
    current_canvas.remove()
  }
  function copy_current_canvas(){
    let new_begin_point = {x: plot_area.x + plot_area.width + 50, y: plot_area.y}
    new_chart_json = JSON.parse(JSON.stringify(chart_json))
    let new_canvas_object = new draw_a_canvas(svg, new_chart_json, new_begin_point, resize = 1)
    _chart_object.push(new_canvas_object)
  }
  function reset_current_canvas(){
    const allowed_json = JSON.parse(JSON.stringify(_chart_object[0].share_json));
    let new_begin_point = {x: plot_area.x, y: plot_area.y}
    let resize_rate = current_canvas_object.global_resize
    let new_chart_json = JSON.parse(JSON.stringify(original_chart_json))
    delete_current_canvas()
    let new_canvas_object = new draw_a_canvas(svg, new_chart_json, new_begin_point, resize = resize_rate)
    _chart_object.push(new_canvas_object)
    _chart_object[0].share_json = allowed_json;
    _chart_object[0].share_json.forEach(json => {
      activateInteraction(json);
    });
  }

  this.delete_current_canvas = delete_current_canvas
  this.copy_current_canvas = copy_current_canvas
  this.reset_current_canvas = reset_current_canvas
  

  current_button.on('click', function(e, d){
    let current_action = {click_position: {x: e.x, y: e.y}}
    current_action.type = d
    current_action.canvas_id = _chart_object.indexOf(current_canvas_object)
    action_list.push(current_action)

    if (d === "delete"){
      delete_current_canvas()
    }
    else if (d === "copy"){
      copy_current_canvas()
    }
    else if (d === "reset"){
      reset_current_canvas()
    }
    else {
      current_canvas_object.click_force_button() 
    }
  })


  var border_drag = d3.drag()
      .on('start', drag_border_start)
      .on('drag', drag_border)
      .on('end', drag_border_end)

  border_drag(border_canvas)


  let begin_drag = {x: 0, y: 0}
  let begin_begin_point = {x: 0, y: 0}

  let window_width = document.getElementById('canvas').clientWidth
  let window_height = document.getElementById("canvas").clientHeight

  function drag_border_start(e, d){
    current_canvas.raise()
    let current_point = get_source_point(e)
    begin_drag.x = current_point.pageX
    begin_drag.y = current_point.pageY
    begin_begin_point.x = start_point.x 
    begin_begin_point.y = start_point.y     
    current_canvas_object.current_canvas_id = _chart_object.indexOf(current_canvas_object)
  }

  function drag_border(e, d){
    let current_point = get_source_point(e)
    new_position = {x: current_point.pageX - begin_drag.x + begin_begin_point.x, y: current_point.pageY - begin_drag.y + begin_begin_point.y}
    start_point.x = new_position.x
    start_point.y = new_position.y 
    plot_area.x = start_point.x
    plot_area.y = start_point.y 
    current_canvas
      .attr('transform', 'translate(' + start_point.x + "," + start_point.y + ")")
  }

  function drag_border_end(e, d){
    let current_point = get_source_point(e)
    old_position = {x: current_point.pageX - begin_drag.x + begin_begin_point.x, y: current_point.pageY - begin_drag.y + begin_begin_point.y}
    console.log("current_canvas_id", current_canvas_id)
    new_position = find_near_correct_place(window_width, window_height, chart_json.size.width, chart_json.size.height, old_position, current_obj = current_canvas_object.current_canvas_id)


    let current_action = {"type": "move_canvas"}
    current_action.new_position = new_position
    current_action.canvas_id = _chart_object.indexOf(current_canvas_object)

    action_list.push(current_action)
    move_current_canvas(current_action)
  }

  function move_current_canvas(current_action){
    start_point.x = current_action.new_position.x
    start_point.y = current_action.new_position.y 

    plot_area.x = start_point.x
    plot_area.y = start_point.y 

    current_canvas
      .transition()
      .ease(d3.easeExp)
      .duration(500)
      .attr('transform', 'translate(' + start_point.x + "," + start_point.y + ")")
  }

  this.move_current_canvas = move_current_canvas

  window._axis = this.chart_json.axis

  let content_group = current_canvas.append("g")
    .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")")
    .attr('id', 'content_group')

  let text_canvas = content_group.append('g')
    // .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")")
    .attr('id', 'text_canvas')

  let force_group = current_canvas.append('g')
    .attr('id', 'force_layout')
    .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ')')
    .style('display', "none")

  this.text_canvas = text_canvas
  this.force_group = force_group
  this.content_group = content_group

  this.add_brush(content_group)

  this.add_resize(current_canvas, resize, chart_width, chart_height, back_board_obj, back_board, div_margin, svg_contain_back)

  let coor_sys_list

  this.draw_axis(content_group, coor_sys_list)

  this.add_force_layer(force_group)

  coor_sys_list = chart_json.CoordSys.map(function(coordinate_data){
    // if (coordinate_data.y_axis !== null)
    //   coordinate_data.y_axis = chart_json.axis.y[coordinate_data.y_axis]
    let current_coord_sys = new draw_a_coordinate(svg, content_group, text_canvas, coordinate_data, current_canvas_object, resize)
    return current_coord_sys
  })

  text_canvas.raise()

  this.CoordSys = coor_sys_list

  this.axis_canvas.raise()

  this.restart_all_simulations = function(){
    this.CoordSys.forEach(coordinate_object => coordinate_object.restart_all_simulations())
  }

  // this.x_gravity_handle.redraw_force_handle()
  this.update_all_handle()
  // this.x_gravity_handle.update_all_line_position()


  return this

}

draw_a_canvas.prototype.update_circle_radius = function(){
  this.CoordSys.forEach(d => d.update_circle_radius())
}



draw_a_canvas.prototype.update_all_handle = function(){
  console.log('redraw force')
  this.force_handle_list.forEach(force_handle => force_handle.redraw_force_handle())
  // To Do 
}

draw_a_canvas.prototype.add_brush = function(canvas){
  let edge = 10
  let current_canvas_object = this
  let brush_visual_obj = d3.brush()
    .on("end", brush_visual_obj_end)
    .extent([[edge, edge], [this.plot_area.width - chart_margin.x * 2 - edge, this.plot_area.height - chart_margin.y * 2 - edge]])


  canvas.call(brush_visual_obj)

  this.brush_visual_obj = brush_visual_obj

  function brush_visual_obj_end(e){
    console.log(e)
    console.log(e.selection)
    let selection = e.selection

    for (let current_coordinate_object of current_canvas_object.CoordSys){
      let visual_object = current_coordinate_object.visual_object
      let control_point = current_coordinate_object.control_point
      let visual_object_canvas = current_coordinate_object.link
      let circle_object_canvas = current_coordinate_object.circle_object

      if (e.selection === null){
        current_canvas_object.brush_selected = false
        visual_object
          .forEach(d => d.selected = true)
        control_point.forEach(d => d.selected = true)
      }
      else{
        current_canvas_object.brush_selected = true
        visual_object.forEach(function(d){
          if (!d.activate){
            d.selected = false
            d.control_point.forEach(pid => control_point[pid].selected = false)
            return
          }
          let selected = false
          for (let pid of d.control_point){
            
            let current_point = control_point[pid]
            if (current_point.show_x >= selection[0][0] &&
              current_point.show_x <= selection[1][0] &&
              current_point.show_y >= selection[0][1] &&
              current_point.show_y <= selection[1][1])
            {
              selected = true
              break
            }
          }
          d.selected = selected
          d.control_point.forEach(pid => control_point[pid].selected = selected)

        })
      }
      visual_object_canvas.attr('opacity', d => d.selected ? 1: 0.2)
      circle_object_canvas.attr('opacity', d => d.selected ? 1: 0.2)
    }
    current_canvas_object.update_all_handle()
  }
}

draw_a_canvas.prototype.update_simulation_tick = function(){
  this.CoordSys.forEach(d => d.update_simulation_tick())
}

draw_a_canvas.prototype.update_text_object = function(){
  this.CoordSys.forEach(d => d.update_text_object())
}

draw_a_canvas.prototype.draw_axis = function(current_canvas, coor_sys_list){
  // draw_axis draw axis
  console.log("아니야아니야아니야아니야");
  let main_canvas_object = this
  let axis_canvas = current_canvas.append('g')
    .attr('id', "axis_canvas")
    .attr('transform', 'scale(' + this.global_resize + ")")

  this.axis_canvas = axis_canvas

  let x_axis_object_list = this.chart_json.axis.x.map(function(d){
    if (d.use_num > 0)
      return new draw_axis(axis_canvas, d, main_canvas_object)
    else
      return null

  })

  let y_axis_object_list = this.chart_json.axis.y.map(function(d){
    if (d.use_num > 0)
      return new draw_axis(axis_canvas, d, main_canvas_object)
    else 
      return null
  })

  this.x_axis_object_list = x_axis_object_list
  this.y_axis_object_list = y_axis_object_list

  // window._x_axis
}



draw_a_canvas.prototype.deactivate_visual_object_group = function(vid_group, coordinate_id){
  console.log("asdf", this.CoordSys)
  this.CoordSys[coordinate_id].deactivate_visual_object_group(vid_group)
}

draw_a_canvas.prototype.stop_all_simulation = function(){
  this.CoordSys.forEach(d => d.stop_simulation())
}

draw_a_canvas.prototype.activate_visual_object_group = function(vid_group, coordinate_id){
  this.CoordSys[coordinate_id].activate_visual_object_group(vid_group)
}

draw_a_canvas.prototype.add_force_layer = function(force_canvas){

  let control_point = this.chart_json.CoordSys[0].control_point
  let chart_json = this.chart_json
  let node = control_point
  let current_canvas_object = this
  let main_transform = this.chart_json.CoordSys[0].transform

  console.log('force control_point', control_point)
  console.log('main_transform', main_transform)

// the force
  function get_force_position_all_coordinate(force_info, type = 'x', force_type = "should"){
    let attr_name = force_type + "_" + type
    let another_attr = type === "x"? "y": "x"
    console.log(attr_name)
    let control_point_num = control_point.length
    let gravity_power = new Array()
    chart_json.CoordSys.forEach(function(coordinate_data){
      control_point = coordinate_data.control_point
      for (let i = 0, control_point_num = control_point.length; i < control_point_num; i ++){
        let node = control_point[i]
        if (!node.hasOwnProperty(attr_name))
          continue;
        if (!node.activate)
          continue;
        if (!node.selected)
          continue;

      
        let attr_value = node[attr_name];
        if (!gravity_power.hasOwnProperty(attr_value))
          gravity_power[attr_value] = new Array()
        gravity_power[attr_value].push(node)
      }
    })

    force_info.length = 0
    for (const [key, value] of Object.entries(gravity_power)) {
      let current_force = {"value": key, "control_point": value, "type": type, "min": Math.min(...value.map(d=>d[another_attr])), "max": Math.max(...value.map(d=>d[another_attr]))}
      current_force.visual_object = new Array(...new Set(current_force.control_point.map(d => d.obj_id)))
      force_info.push(current_force)
    }
    force_info.sort((a, b) => b.control_point.length - a.control_point.length)
  }


  let forcemoveTimer = null;
  let draw_gravity_power = function(canvas, type = "x", force_type = "should", edge = 10){
    let gravity_power = new Array()

    let update_gravity_power = function(){
      get_force_position_all_coordinate(gravity_power, type, force_type)
      // get_force_position(control_point, gravity_power, type, force_type)
    }

    let max_size = 1

    let force_name = force_type + "_" + type

    let gravity_canvas = canvas.append("g")
      .attr("class", force_name)

    let g_base, line, point_handle, dragHandler, handle_text;

    let redraw_gravity_power = function(){
      update_gravity_power()
      if (gravity_power[0] !== undefined) 
        max_size = gravity_power[0].control_point.length

      let gravity_count = gravity_power.map(d => d.control_point.length).reduce((a, b) => a + b, 0)

      console.log("maxsize",gravity_power[0], max_size, gravity_count)
      console.log(gravity_power[0])
      console.log('gravity_power', gravity_power)
      gravity_canvas.selectAll("." + force_name).remove()



      g_base = gravity_canvas.selectAll("." + force_name)
        .data(gravity_power.splice(0,20))
        .enter()
        .append('g')
        .style('opacity', d => d.control_point.length / gravity_count * 5)
        .attr('class', force_name)
        .style('display', function(d, i){
          if (d.control_point.length / gravity_count < 0.1)
            return "none"
          if (i > 20)
            return "none"
          return null
        })

      let chart_real_width = current_canvas_object.plot_area.width - chart_margin.x * 2
      let chart_real_height = current_canvas_object.plot_area.height - chart_margin.y * 2


      draw_force_line(g_base, chart_real_width, chart_real_height, type, force_type)
      draw_handle(g_base, type, force_type)

      dragHandler = d3.drag()
        .on('start', dragstart)
        .on('drag', dragged)
        .on('end', dragend)

      dragHandler(g_base)
      let buttonTimer = null;
      let buttonTimerE = null;
      g_base.on("mouseover", function (e) {
        buttonTimerE = e;
        let target = e.target;
        let forcetype, directiontype;
        for (let ele of e.path) {
          if (ele.tagName == "g") {
            [forcetype, directiontype] = ele.classList.toString().split("_");
            break;
          }
        }
        // addHintForForce(e, forcetype, directiontype);
        addHintForForce(current_canvas_object, buttonTimerE, forcetype, directiontype);
        forcemoveTimer = removeHintLater(current_canvas_object, 1000);
        // buttonTimer = setTimeout(
        //   () => {
        //     console.log(current_canvas_object)
        //     addHintForForce(current_canvas_object, buttonTimerE, forcetype, directiontype);
        //     removeHintLater(current_canvas_object, 1000);
        //   },
        //   1000
        // );
      }).on("mousemove", function (e) {
        buttonTimerE = e;
        let cid = "cid"+_chart_object.indexOf(current_canvas_object);
        if (d3.select(`.dragHint.${cid}`).node() && d3.select(`.dragHint.${cid}`).style("display") != "none") {
          moveHint(current_canvas_object, e);
        }
      }).on("mouseout", function (e) {
        clearTimeout(buttonTimer);
      })

      update_all_line_position()
    }

    this.redraw_force_handle = redraw_gravity_power

    function dragstart(e, d) {
      let target = e.sourceEvent.target;
      let forcetype, directiontype;
      for (let ele of e.sourceEvent.path) {
        if (ele.tagName == "g") {
          [forcetype, directiontype] = ele.classList.toString().split("_");
          break;
        }
      }
      // addHintForForce(e, forcetype, directiontype);
    }
    function dragged(e, d) {
      console.log('event', e)
      console.log('event xy', e.sourceEvent.pageX, e.sourceEvent.pageY)

      d.value = screen2xy(e.x, e.y, main_transform)[type]
      update_line_position(d, d3.select(this))

      let cid = "cid"+_chart_object.indexOf(current_canvas_object);
      if (d3.select(`.dragHint.${cid}`).node() && d3.select(`.dragHint.${cid}`).style("display") != "none") {
        clearTimeout(forcemoveTimer);
        forcemoveTimer = null;
        // forcemoveTimer = removeHintLater(current_canvas_object, 1000);
        moveHint(current_canvas_object, e);
      }
      // removeHintLater();
    }

    function dragend(e, d) {
      removeHint(current_canvas_object);
      clearTimeout(forcemoveTimer);
      forcemoveTimer = null;

      console.log("drag_end_force", d)

      d.value = screen2xy(e.x, e.y, main_transform)[type]

      let current_action = {'type': "set_force"}
      current_action.set_list = []
      current_action.set_list[0] = {
        "visual_object": d.visual_object,
        "force_name":  force_name,
        "force_value": d.value,
        "canvas_id": _chart_object.indexOf(current_canvas_object),
        
      }

      action_list.push(current_action)

      for (let node of d.control_point)
        node[force_name] = d.value
      update_line_position(d, d3.select(this))
      update_all_line_position()
    }

    let update_all_line_position = function(){
      g_base
        .each(function(d){
          update_line_position(d, d3.select(this))
        })
      current_canvas_object.restart_all_simulations()
    }

    this.update_all_line_position = update_all_line_position

    let update_line_position = function(d, current_object){
      let start_point, end_point
      // console.log('hhhh', d)
      if (d.type === "x" || d.type === "cx"){
        start_point = xy2screen(d.value, 0, main_transform)
        // end_point = xy2screen(d.value, d.min - edge, main_transform)

        current_object
          .attr('transform', "translate(" + start_point.x + ",0)")
      }
      else{
        start_point = xy2screen(0, d.value, main_transform)
        // end_point = xy2screen(d.min - edge, d.value, main_transform)

        current_object
          .attr('transform', "translate(0," + start_point.y + ")")
      }
   
    }
    // redraw_gravity_power()
  }

  this.force_handle_list = []

  // addHintForGY({sourceEvent: {clientX: 200, clientY: 600}});
  // addHintForGX({sourceEvent: {clientX: 800, clientY: 400}});
  current_gravity_handle = new draw_gravity_power(force_canvas, "x", "should")
  this.force_handle_list.push(current_gravity_handle)
  current_gravity_handle = new draw_gravity_power(force_canvas, 'y', 'should')
  this.force_handle_list.push(current_gravity_handle)
  current_gravity_handle = new draw_gravity_power(force_canvas, "y", "larger")
  this.force_handle_list.push(current_gravity_handle)
  current_gravity_handle = new draw_gravity_power(force_canvas, "y", "smaller")
  this.force_handle_list.push(current_gravity_handle)
  current_gravity_handle = new draw_gravity_power(force_canvas, "x", "larger")
  this.force_handle_list.push(current_gravity_handle)
  current_gravity_handle = new draw_gravity_power(force_canvas, "x", "smaller")
  this.force_handle_list.push(current_gravity_handle)

  this.force_button_list = []
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "smaller", attr_type = "y", index = 0))
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "larger", attr_type = "y", index = 1))
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "should", attr_type = "y", index = 2))
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "smaller", attr_type = "x", index = 3))
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "larger", attr_type = "x", index = 4))
  this.force_button_list.push(new add_force_line_new(force_canvas, this, force_type = "should", attr_type = "x", index = 5))
  this.force_button_list.push(new add_force_collision(force_canvas, this, force_type = "collision", index = 6))
  this.force_button_list.push(new add_color_axis(force_canvas, this, index = 7))



  this.update_force_button = function(){
    this.force_button_list.forEach(d => d.update_force_button())
  }
// add_force_collision(force_type = "collision", index = 6)

  this.click_force_button = function(){
    this.force_group.style('display', this.force_group.style('display') === "none"? null: "none")
    this.update_all_handle()
  }
}


function draw_force_line(g_base, chart_real_width, chart_real_height, type = "x", force_type = "should"){
  let force_line_width = 6

  if (force_type === "should"){
    let line = g_base
      .append('rect')
      .attr('id', 'strip')
      .style('pointer-events', "none")

    if (type === "x"){
      line
        .attr('fill', 'url(#vertical_gradient)')
        .attr('width', force_line_width * 2)
        .attr('height', chart_real_height)
        .attr('x', - force_line_width)
    }
    else{
      line
        .attr('fill', 'url(#horizon_gradient)')
        .attr('width', chart_real_width)
        .attr('height', force_line_width * 2)
        .attr('y', - force_line_width)
    }   
  }
  else {
    let force_line_back_board = g_base.append('rect')
    let force_line_rect = g_base.append('rect')
    let force_line_border = g_base.append('rect')
    let force_line_border_thin = g_base.append('rect')

    if (type === 'x'){
      force_line_rect
        .attr('fill', 'url(#strip_pattern)')
        .attr('width', force_line_width)
        .attr('height', chart_real_height)

      force_line_border
        .attr('fill', "#757575")
        .attr('width', 1.5)
        .attr('height', chart_real_height)

      force_line_border_thin
        .attr('fill', "#757575")
        .attr('width', 0.5)
        .attr('height', chart_real_height)

      force_line_back_board
        .attr('fill', "#fff")
        .attr('opacity', 0.9)
        .attr('width', force_line_width)
        .attr('height', chart_real_height)

      if (force_type === "larger") {
        force_line_rect
          .attr('x', -force_line_width)
        force_line_border
          .attr('x', -1.5)
        force_line_border_thin
          .attr('x', -force_line_width)
        force_line_back_board
          .attr('x', -force_line_width)
      }
    }
    else{
      force_line_rect
        .attr('fill', 'url(#strip_pattern)')
        .attr('width', chart_real_width)
        .attr('height', force_line_width)

      force_line_border
        .attr('fill', "#757575")
        .attr('width', chart_real_width)
        .attr('height', 1.5)

      force_line_border_thin
        .attr('fill', "#757575")
        .attr('width', chart_real_width)
        .attr('height', 0.5)


      force_line_back_board
        .attr('fill', "#fff")
        .attr('opacity', 0.9)
        .attr('width', chart_real_width)
        .attr('height', force_line_width)

      if (force_type === "larger") {
        force_line_rect
          .attr('y', -force_line_width)
        force_line_border
          .attr('y', -1.5)
        force_line_border_thin
          .attr('y', -force_line_width)
        force_line_back_board
          .attr('y', -force_line_width)
      }
    }
  }
}

function draw_handle(g_base, type = "x", force_type = "should"){
  let handle_width = 25
  let handle_svg = '<svg width="25px" viewBox="0 0 17 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">    <defs>        <rect id="path-1" x="0" y="0" width="13" height="8" rx="1"></rect>        <filter x="-23.1%" y="-37.5%" width="146.2%" height="175.0%" filterUnits="objectBoundingBox" id="filter-2">            <feOffset dx="0" dy="0" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>            <feGaussianBlur stdDeviation="1" in="shadowOffsetOuter1" result="shadowBlurOuter1"></feGaussianBlur>            <feColorMatrix values="0 0 0 0 0.594229878   0 0 0 0 0.594229878   0 0 0 0 0.594229878  0 0 0 0.5 0" type="matrix" in="shadowBlurOuter1"></feColorMatrix>        </filter>    </defs>    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">        <g id="Group-12">            <g id="Group-10">                <g id="Rectangle">                    <use fill="black" fill-opacity="1" filter="url(#filter-2)" xlink:href="#path-1"></use>                    <use fill="#FFFFFF" fill-rule="evenodd" xlink:href="#path-1"></use>                </g>                <g id="Group-6" transform="translate(3.000000, 2.000000)"></g>                <path d="M3.5,2.33333333 L3.5,5.66666667" id="Line" stroke-opacity="0.28938859" stroke="#000000" stroke-linecap="round"></path>                <path d="M6.5,2.33333333 L6.5,5.66666667" id="Line-Copy" stroke-opacity="0.28938859" stroke="#000000" stroke-linecap="round"></path>                <path d="M9.5,2.33333333 L9.5,5.66666667" id="Line-Copy-2" stroke-opacity="0.28938859" stroke="#000000" stroke-linecap="round"></path>            </g>        </g>    </g></svg>'
  if (type === "x"){
    point_handle = g_base
      .append('image')
      .attr('href', "./image/handle.svg")
      .attr('width', handle_width)
      .attr('id', 'handle_image') 
      .attr('x', - handle_width / 2)
      .attr('y', - handle_width / 2)
      // .attr('transform', "translate(" + (- handle_width / 2) + "," +  ( - handle_width / 2) + ")")
      // .html(handle_svg)
    // if (force_type === "should")

  }
  else {
    point_handle = g_base
      .append('image')
      .attr('href', './image/handle.svg')
      .attr('width', handle_width)
      .attr('id', 'handle_image')
      .attr('x', - handle_width / 2)
      .attr('y', - handle_width / 2)
      .attr('transform', 'rotate(90)')


  }
}


function add_force_line_new(force_group, main_canvas_object, force_type = "smaller", attr_type = "y", index = 0){
  let force_name = force_type + "_" + attr_type
  const force_layer_canvas = force_group
    .append('g')
    .attr('id', force_type + "_" + attr_type + "_button")

  let should_color = "#f39800"
  let larger_color = "#52b333"

  let plot_area = main_canvas_object.plot_area
  let chart_json = main_canvas_object.chart_json

  let chart_real_width = plot_area.width - chart_margin.x * 2
  let chart_real_height = plot_area.height - chart_margin.y * 2

  let button, force_line, force_area;
  let button_width = 25
  let button_height = 25
  let button_interval = 10

  let force_name_dict = {"larger_y": "Upward", "smaller_y": "Downward", "larger_x": "Rightward", "smaller_x": "Leftward", "should_x": "Ver. Grav.", "should_y": "Hor. Grav."}


  console.log('button index: ', index, (button_height + button_interval))

  button = force_layer_canvas.append("g")
    .attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")

  button.append('rect')
    .attr('width', button_width)
    .attr('height', button_height)
    // .attr('fill', force_type === "should"? should_color: larger_color)
    // .attr('fill', 'url(#strip_pattern)')
    .attr('fill-opacity', 0)
    .attr('stroke', "#777")
    .attr('stroke-width', 1)
    .attr('class', "force_buttons")
    // .attr('rx', 2)
    // .attr('ry', 2)

  let bias_rate = 0.3

  let current_activated = false

  let button_icon = button.append('g')
    .attr('id', "icon")
    .attr('transform', function(){
      let x_position = 0
      let y_position = 0
      if (attr_type === "x"){
        if (force_type === "larger")
          x_position = button_width * bias_rate
        else if (force_type === "smaller")
          x_position = button_width * (1 - bias_rate)
        else
          x_position = button_width * 0.5
      }
      else{
        if (force_type === "larger")
          y_position = button_height * bias_rate
        else if (force_type === "smaller")
          y_position = button_height * (1 - bias_rate)
        else
          y_position = button_height * 0.5
      }
      return "translate(" + x_position + "," + y_position + ")"
    })

  draw_force_line(button_icon, button_width, button_height, attr_type, force_type)

  let buttonTimer = null;
  let buttonTimerE = null;
  button.on("mouseenter", function (e) {
    clearTimeout(timerHintForAxis);
    buttonTimerE = e;
    addHintForAxis(main_canvas_object, e);
    timerHintForAxis = removeHintLater(main_canvas_object, 1000);
    // buttonTimer = setTimeout(
    //   () => {
    //     addHintForAxis(main_canvas_object, buttonTimerE);
    //     removeHintLater(main_canvas_object, 1000);
    //   },
    //   1000
    // );
  }).on("mousemove", function (e) {
    buttonTimerE = e;
    // moveHint(main_canvas_object, buttonTimerE);
    let cid = "cid"+_chart_object.indexOf(main_canvas_object);
    if (d3.select(`.dragHint.${cid}`).node() && d3.select(`.dragHint.${cid}`).style("display") != "none") {
      moveHint(main_canvas_object, buttonTimerE);
    }
  }).on("mouseleave", function (e) {
    clearTimeout(buttonTimer);
  })
  button
    .on('click', function(e){
      if (current_activated)
      {
        main_canvas_object.force_button_click = false
        current_activated = false
        force_area.style('display', "none")
        main_canvas_object.restart_all_simulations()
        return
      }
      if (main_canvas_object.force_button_click){
        return
      }
      console.log('stop all simulations')
      main_canvas_object.stop_all_simulation()
      current_activated = true
      main_canvas_object.force_button_click = true
      force_area.style('display', null)
    })//force_area.style('display') === "none": null? "none"))

  force_area = force_layer_canvas.append('g')
    .style('display', "none")

  force_line = force_area.append('g')
    .style('pointer-events', "none")

  draw_force_line(force_line, chart_real_width, chart_real_height, attr_type, force_type)

  let force_rect = force_area.append('rect')
    .attr('width', chart_real_width)
    .attr('height', chart_real_height)
    .attr('fill', "#777")
    // .attr('fill', 'url(#strip_pattern)')
    .attr('opacity', 0.1)
    .on('mouseover', function(e, d){
      force_line.style('display', null)
    })
    .on('mouseout', function(e, d){
      force_line.style('display', 'none')
    })
    .on("mousemove", function(e, d){

      let chart_x = e.x - plot_area.x - chart_margin.x - main_canvas_trans.x
      let chart_y = e.y - plot_area.y - chart_margin.y - main_canvas_trans.y

      if (attr_type === "y"){ 
        force_line
          .transition()
          .duration(50)
          .attr("transform", 'translate(0,' + chart_y + ')')
      }
      else{
        force_line
          .transition()
          .duration(50)
          .attr('transform', 'translate(' + chart_x + ",0)")
      }
    })
    .on('click', function(e, d){
      main_canvas_object.force_button_click = false
      console.log(e.x, e.y)

      let chart_x = e.x - plot_area.x - chart_margin.x - main_canvas_trans.x
      let chart_y = e.y - plot_area.y - chart_margin.y - main_canvas_trans.y

      chart_json.CoordSys.forEach(function(coordinate_data){
        let value = screen2xy(chart_x, chart_y, coordinate_data.transform)[attr_type]
        coordinate_data.control_point
          .filter(d => d.selected)
          .forEach(d => d[force_name] = value)
      })
      // control_point
      //   .filter(d => d.selected)
      //   .forEach(d => d[force_name] = )
      
      main_canvas_object.update_all_handle()
      force_area.style("display", "none")
      main_canvas_object.restart_all_simulations()
      current_activated = false
    })
  // force_area_array.push(force_rect)
  this.update_force_button = function(){
    chart_real_width = plot_area.width - chart_margin.x * 2
    chart_real_height = plot_area.height - chart_margin.y * 2
    button.attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")
    force_rect
      .attr('width', chart_real_width)
      .attr('height', chart_real_height)
    force_line
      .selectAll('rect')
      .each(function(d){
        if (attr_type === "x")
          d3.select(this).attr('height', chart_real_height)
        else
          d3.select(this).attr('width', chart_real_width)
      })
  }
}


function add_color_axis(force_group, main_canvas_object, index = 0){
  const force_layer_canvas = force_group
    .append('g')
    .attr('id', force_type + "_" + attr_type + "_button")

  let plot_area = main_canvas_object.plot_area
  let chart_json = main_canvas_object.chart_json

  let chart_real_width = plot_area.width - chart_margin.x * 2
  let chart_real_height = plot_area.height - chart_margin.y * 2

  let button, force_line, force_area;
  let button_width = 25
  let button_height = 25
  let button_interval = 10

  button = force_layer_canvas.append("g")
    .attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")

  button.append('rect')
    .attr('width', button_width)
    .attr('height', button_height)
    // .attr('fill', force_type === "should"? should_color: larger_color)
    // .attr('fill', 'url(#strip_pattern)')
    .attr('fill-opacity', 0)
    .attr('stroke', "#777")
    .attr('stroke-width', 1)

  button.append('image')
    .attr('href', "./image/axis_icon.svg")
    .attr('width', 25)
    // .html('<svg width = "25" id="图层_1" data-name="图层 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><defs><style>.cls-1{fill:#fff;}.cls-2{fill:#474747;}.cls-3{fill:none;stroke:#474747;stroke-miterlimit:10;stroke-width:2px;}</style></defs><title>point_visual_mark画板 1</title><ellipse class="cls-1" cx="5" cy="14.61" rx="1" ry="3.64"/><path class="cls-2" d="M5,11c-.55,0-1,1.63-1,3.64s.45,3.64,1,3.64,1-1.63,1-3.64S5.55,11,5,11Z"/><ellipse class="cls-1" cx="15" cy="14.61" rx="1" ry="3.64"/><path class="cls-2" d="M15,11c-.55,0-1,1.63-1,3.64s.45,3.64,1,3.64,1-1.63,1-3.64S15.55,11,15,11Z"/><ellipse class="cls-1" cx="25" cy="14.61" rx="1" ry="3.64"/><path class="cls-2" d="M25,11c-.55,0-1,1.63-1,3.64s.45,3.64,1,3.64,1-1.63,1-3.64S25.55,11,25,11Z"/><line class="cls-3" x1="5" y1="14.61" x2="24.99" y2="14.61"/></svg>')
    // .attr('rx', 2)
    // .attr('ry', 2)

  let current_activated = false

  let buttonTimer = null;
  let buttonTimerE = null;
  button.on("mouseenter", function (e) {
    clearTimeout(timerHintForAxis);
    buttonTimerE = e;
    addHintForAxis(main_canvas_object, e);
    timerHintForAxis = removeHintLater(main_canvas_object, 1000);
    // buttonTimer = setTimeout(
    //   () => {
    //     addHintForAxis(main_canvas_object, buttonTimerE);
    //     removeHintLater(main_canvas_object, 1000);
    //   },
    //   1000
    // );
  }).on("mousemove", function (e) {
    buttonTimerE = e;
    // moveHint(main_canvas_object, buttonTimerE);
    let cid = "cid"+_chart_object.indexOf(main_canvas_object);
    if (d3.select(`.dragHint.${cid}`).node() && d3.select(`.dragHint.${cid}`).style("display") != "none") {
      moveHint(main_canvas_object, buttonTimerE);
    }
  }).on("mouseleave", function (e) {
    clearTimeout(buttonTimer);
  })
  button
    .on('click', function(e){
      if (current_activated)
      {
        main_canvas_object.force_button_click = false
        current_activated = false
        force_area.style('display', "none")
        main_canvas_object.restart_all_simulations()
        return
      }
      if (main_canvas_object.force_button_click){
        return
      }
      // addHintForAxis(e);
      // removeHintLater(1000);
      console.log('stop all simulations')
      main_canvas_object.stop_all_simulation()
      current_activated = true

      main_canvas_object.force_button_click = true
      force_area.style('display', null)
      force_rect.attr('pointer-events', null)

      axis_line.attr('display', 'none')
      
      choice_contain.attr('display', 'none')
    })//force_area.style('display') === "none": null? "none"))

  force_area = force_layer_canvas.append('g')
    .style('display', "none")

  let axis_line = force_area.append('g')
    .style('pointer-events', "none")

  let axis_link = axis_line.append('line')
    .attr('stroke', "#b3cde3")
    .attr('stroke-width', 3)

  let axis_begin = axis_line.append('circle')
    .attr('r', 10)
    .attr('fill', "#b3cde3")

  let axis_end = axis_line.append('circle')
    .attr('r', 10)
    .attr('fill', "#b3cde3")




  let begin_position = {x: 0, y: 0}
  let end_position = {x: 0, y:0}
  let direction = "x"

  let choice_axis_type = ['color', 'size']
  let choice_width = 40
  let choice_height = 30


  let force_rect = force_area.append('rect')
    .attr('width', chart_real_width)
    .attr('height', chart_real_height)
    .attr('fill', "#777")
    // .attr('fill', 'url(#strip_pattern)')
    .attr('opacity', 0.1)

  let choice_contain = force_area.append('g')
    .attr('display', 'none')

  let choice = choice_contain
    .selectAll('choice')
    .data(choice_axis_type)
    .enter()
    .append('g')
    .attr('transform', (d, i) => 'translate(0,' + choice_height * i + ")")

  choice
    .append('rect')
    .attr('height', choice_height)
    .attr('width', choice_width)
    .attr('font-size', 16)
    .attr('stroke', "#777")
    .attr('stroke-width', 1)
    .attr("fill", "white")
    .attr('rx', 3)
    .attr('ry', 3)
  
  choice
    .append('text')
    .text(d => d)
    .attr('y', choice_height / 2 + 8)
    .attr('x', choice_width / 2)
    .attr('text-anchor', 'middle')
    .attr('vertical-align', "center")

  choice
    .on('click', function(e, d){
      console.log('click on', d)
      if (d === "color"){
        update_constraints("fill")
      }
      else if (d === "size"){
        update_constraints('radius')
        set_up = false
      }
      main_canvas_object.update_all_handle()
      main_canvas_object.restart_all_simulations()
      force_area.style('display', "none")
      current_activated = false
      main_canvas_object.force_button_click = false

      choice_contain.attr('display', "none")

      main_canvas_object.click_force_button() 

    })

  let clearRemove = null;
  let draw_line_drag = d3.drag()
    .on('start', function(e, d){
      addHintForAxisClick(main_canvas_object, e);
      clearRemove = removeHintLater(main_canvas_object, 1000);
      console.log("begin draw")
      let chart_x = e.x
      let chart_y = e.y 

      axis_line.attr('display', null)

      begin_position.x = chart_x
      begin_position.y = chart_y

      axis_link
        .attr('x1', chart_x)
        .attr('y1', chart_y)
        .attr('x2', chart_x)
        .attr('y2', chart_y)

      axis_begin
        .attr('cx', chart_x)
        .attr('cy', chart_y)

      axis_end
        .attr('cx', chart_x)
        .attr('cy', chart_y)


    })
    .on('drag', function(e, d){
        let chart_x = e.x 
        let chart_y = e.y 

        if (Math.abs(chart_x - begin_position.x) > Math.abs(chart_y - begin_position.y)){
          end_position.y = begin_position.y
          end_position.x = chart_x
          direction = "x"
        }
        else{
          end_position.x = begin_position.x
          end_position.y = chart_y
          direction = "y"
        }

        // console.log("Direction", direction)

        axis_link
          .attr('x2', end_position.x)
          .attr('y2', end_position.y)          
        axis_end
          .attr('cx', end_position.x)
          .attr('cy', end_position.y)
    })
    .on('end', function(e, d){
      // force_rect.attr('pointer-events', 'none')
      removeHint(main_canvas_object);
      clearTimeout(clearRemove);

      let chart_x = e.x 
      let chart_y = e.y 

      choice_contain.attr("transform", 'translate(' + (end_position.x + rem2px(3)) + "," + end_position.y + ")")
        .attr('display', null)
      addHintForAxisDone(main_canvas_object, e, rem2px(3));
      removeHintLater(main_canvas_object, 1000);
    })







  draw_line_drag(force_rect)


  function get_attr_group(attr_type){
    let attr_group = []

    main_canvas_object.CoordSys.forEach(function(coordinate_object){
      let visual_object = coordinate_object.visual_object
      let control_point = coordinate_object.control_point

      visual_object.forEach(function(d){
        if (d.activate && d.selected && d.hasOwnProperty(attr_type)){
          console.log(attr_type, d)
          let current_attr = d[attr_type].toString()
          // console.log('Current attr value', current_attr)
          if (!(current_attr in attr_group))
            attr_group[current_attr] = []
          
          for (let pid of d.control_point){
            attr_group[current_attr].push(control_point[pid])
          }
        }
      })
    })
    let attr_list = []
    for (let i in attr_group){
      attr_list.push({"attr": i, "control_point": attr_group[i]})
    }

    return attr_list
  }

  function update_constraints(attr_type = "fill"){

    let attr_group = get_attr_group(attr_type)

    console.log('attr group', attr_group)

    let attr_num = attr_group.length
    let begin_value, end_value

    console.log("direction!!!", direction)

    if (direction === "y")
    {
      begin_value = begin_position.y 
      end_value = end_position.y
    }
    else{
      begin_value = begin_position.x 
      end_value = end_position.x
    }

    let min_attr, max_attr

    if (attr_type === "radius"){
      let attr_value_list = attr_group.map(d => parseFloat(d.attr))

      min_attr = Math.min(...attr_value_list)
      max_attr = Math.max(...attr_value_list)

      console.log('min max', min_attr, max_attr)

    }

    attr_group.forEach(function(d, i){
      let current_value
      if (attr_type === "radius")
        current_value = ((end_value - begin_value) / main_canvas_object.global_resize) * (parseFloat(d.attr) - min_attr) / (max_attr - min_attr) + begin_value
      if (attr_type === "fill")
        current_value = ((end_value - begin_value) / main_canvas_object.global_resize) * (i + 0.5) / attr_num + begin_value

      // console.log('value', value)
      d.control_point.forEach(function(d){
        // console.log('should_' + direction)
        if (d.hasOwnProperty('should_' + direction))
          d['should_' + direction] = current_value
        if (d.hasOwnProperty('smaller_' + direction))
          d['smaller_' + direction] = current_value
        // if (d.hasOwnProperty('smaller_' + direction))
        //   d['smaller_']
      })
    })
  }


  // force_area_array.push(force_rect)
  this.update_force_button = function(){
    chart_real_width = plot_area.width - chart_margin.x * 2
    chart_real_height = plot_area.height - chart_margin.y * 2
    button.attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")
    force_rect
      .attr('width', chart_real_width)
      .attr('height', chart_real_height)
  }
}

function add_force_collision(force_canvas, main_canvas_object, force_type = "collision", index = 0){
  let force_name = force_type + "_" + attr_type
  const force_layer_canvas = force_canvas
    .append('g')
    .attr('id', force_type)


  let plot_area = main_canvas_object.plot_area
  let chart_json = main_canvas_object.chart_json

  let chart_real_width = plot_area.width - chart_margin.x * 2
  let chart_real_height = plot_area.height - chart_margin.y * 2

  let button, force_line, force_area;
  let button_width = 25
  let button_height = 25
  let button_interval = 10

  console.log('button index: ', index, (button_height + button_interval))

  button = force_layer_canvas.append("g")
    .attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")

  button.append('rect')
    .attr('width', button_width)
    .attr('height', button_height)
    // .attr('fill', force_type === "should"? should_color: larger_color)
    // .attr('fill', 'url(#strip_pattern)')
    .attr('fill-opacity', 0)
    .attr('stroke', "#777")
    .attr('stroke-width', 1)
    // .attr('rx', 2)


  button.append('circle')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 7)
    .attr('fill', "none")
    .attr('stroke', "#777")

  button.append('circle')
    .attr('cx', 15)
    .attr('cy', 15)
    .attr('r', 10)
    .attr('fill', "none")
    .attr('stroke', "#777")


    // .text(force_type)

  button
    .on('click', function(d){
      main_canvas_object.CoordSys.forEach(function(d){
          d.control_point.forEach(function(d){
            if (d.activate && d.selected && d.radius > 0)
              d.collide = !d.collide 
          })
          d.update_collision_force()
          d.restart_all_simulations()
        })

    })//force_area.style('display') === "none": null? "none"))

  this.update_force_button = function(){

    chart_real_width = plot_area.width - chart_margin.x * 2
    chart_real_height = plot_area.height - chart_margin.y * 2
    button.attr('transform', 'translate(' + (chart_real_width) + ', ' + (button_height + button_interval) * index + ")")
  }
}
