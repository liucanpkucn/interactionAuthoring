
// Change the size of the chart 

draw_a_canvas.prototype.add_resize = function(current_canvas, resize, chart_width, chart_height, back_board_obj, back_board, div_margin, svg_contain_back){
  let size_change_group = current_canvas.append('g')
    .attr('id', "size_change_group")

  let corner_size = 30
  let start_point = this.start_point
  let current_canvas_object = this

  let four_cursor = ['ne', 'nw', 'se', 'sw']

  let chart_real_width = chart_width - chart_margin.x * 2
  let chart_real_height = chart_height - chart_margin.y * 2

  let plot_area = this.plot_area

  let chart_json = this.chart_json
  let content_group = this.content_group

  let brush_visual_obj = this.brush_visual_obj
  let edge = 10


  this.global_resize = resize
  if (this.chart_json.hasOwnProperty('CoordSys') && this.chart_json.CoordSys.length > 0){
    console.log(this.chart_json.CoordSys[0])
    this.global_resize = this.global_resize / this.chart_json.CoordSys[0].transform.x_rate
    console.log("Global resize", this.global_resize)
  }

  let size_change = size_change_group
    .selectAll('.size_change')
    .data(four_cursor)
    .enter()
    .append('rect')
    .attr('x', function(d){
      if (d === "ne" || d === "se")
        return chart_width - corner_size / 2
      else
        return - corner_size / 2

    })
    .attr('y', function(d){
      if (d === "ne" || d === "nw")
        return - corner_size / 2
      else 
        return chart_height - corner_size / 2
    })
    .attr('width', corner_size)
    .attr('height', corner_size)
    .attr('fill', 'red')
    .attr("fill-opacity", 0)
    .style('cursor', d => d + "-resize")


  let resize_drag = d3.drag()
      .on('start', resize_drag_start)
      .on('drag', function(e, d){
        resize_draged(e, d)
        reload_size()
      })
      .on('end', function(e, d){
        resize_draged(e, d)
        reload_size_end()
      })


  let resize_drag_point = {x: 0, y: 0}
  let resize_start_width = 0
  let original_real_width = 0
  let show_force = true

  function update_resize_position(){
    size_change
      .attr('x', function(d){
        if (d === "ne" || d === "se")
          return chart_width - corner_size / 2
        else
          return - corner_size / 2

      })
      .attr('y', function(d){
        if (d === "ne" || d === "nw")
          return - corner_size / 2
        else 
          return chart_height - corner_size / 2
      })
  }

  function resize_drag_start(e, d){

    let current_point = get_source_point(e)
    console.log('drag the corner', current_point.pageX, current_point.pageY)

    resize_start_width = chart_width
    resize_drag_point.x = current_point.pageX
    resize_drag_point.y = current_point.pageY

    if (current_canvas_object.force_group.style('display') === "none"){
      console.log('show force', show_force)
      show_force = false
    }

    if (show_force)
      current_canvas_object.force_group.style('display', "none")
  }

  function resize_draged(e, d){
    // console.log('drag the corner move', e.sourceEvent.pageX, e.sourceEvent.pageY)
    // get new width of the window

    let current_point = get_source_point(e)
    if (d === "ne" || d === "se"){
      new_width = current_point.pageX - resize_drag_point.x + resize_start_width
    }
    else{
      new_width = resize_drag_point.x - current_point.pageX + resize_start_width
    }
      // if new_width is too small, set a minimum of the width
    if (new_width <= chart_margin.x * 2)
      new_width = chart_margin.x * 2 + 2
    
    new_height = (new_width - chart_margin.x * 2) * chart_real_height / chart_real_width + chart_margin.y * 2

    original_real_width = chart_real_width

    if (d === "ne" || d === "nw")
      start_point.y = start_point.y + chart_height - new_height

    if (d === "sw" || d === "nw")
      start_point.x = start_point.x + chart_width - new_width

    plot_area.y = start_point.y
    plot_area.x = start_point.x

    chart_height = new_height
    chart_width = new_width

    chart_real_width = new_width - 2 * chart_margin.x
    chart_real_height = new_height - 2 * chart_margin.y

    plot_area.width = chart_width
    plot_area.height = chart_height

    // console.log('chart_width,', chart_width, chart_height)
  }



  function reload_size(){
    current_canvas
      .attr('transform', 'translate(' + plot_area.x + "," + plot_area.y + ")")

    let rescale = chart_real_width / (resize_start_width - chart_margin.x * 2) * current_canvas_object.global_resize

    content_group
      .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")  scale(" + chart_real_width / (resize_start_width - chart_margin.x * 2) + ")")

    // current_canvas_object.axis_canvas
    //   .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")  scale(" + rescale + ")")

    // change back board
    update_back_board()

    // change back svg
    update_svg_contrain_back(plot_area.width - chart_margin.x * 2, plot_area.height - chart_margin.y * 2)

    // update_corner_position()
    update_resize_position()

    // update brush position
    update_brush_position()

    // update_move_rec
    current_canvas_object.update_move_rect()

    current_canvas_object.CoordSys.forEach(function(d){
      d.force_area_array.forEach(rect => rect.attr("width", plot_area.width - chart_margin.x * 2).attr('height', plot_area.height - chart_margin.y * 2))
    })
  }


  function reload_size_end(){
    // change start point
    chart_json.size.width = chart_real_width
    chart_json.size.height = chart_real_height

    current_canvas
      .attr('transform', 'translate(' + plot_area.x + "," + plot_area.y + ")")

    content_group
      .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")")

    let rescale = chart_real_width / (resize_start_width - chart_margin.x * 2) * current_canvas_object.global_resize


    current_canvas_object.axis_canvas
      .attr('transform', "scale(" + rescale + ")")

    current_canvas_object.global_resize = rescale

    current_canvas_object.update_circle_radius()

    current_canvas_object.CoordSys.forEach(d => d.update_clip_path())

    // change back board
    update_back_board()

    // change back svg
    update_svg_contrain_back(plot_area.width - chart_margin.x * 2, plot_area.height - chart_margin.y * 2)

    // update_corner_position()
    update_resize_position()

    // update brush 
    update_brush_position()

    // update_move_rect()

    current_canvas_object.update_move_rect()

    // update transform
    chart_json.CoordSys.forEach(coordinate_data => resize_transform(coordinate_data.transform, chart_real_width / (resize_start_width - chart_margin.x * 2) )) 

    console.log('rescale', rescale)
    console.log('rescale_resize', 1.0 / (current_canvas_object.CoordSys[0].main_transform.x_rate))

    // update position
    current_canvas_object.update_simulation_tick()

    // update brush extent
    // update_brush_extent()

    // udpate text size
    current_canvas_object.update_text_object()

    // update_force_area

    current_canvas_object.CoordSys.forEach(function(d){
      d.force_area_array.forEach(rect => rect.attr("width", plot_area.width - chart_margin.x * 2).attr('height', plot_area.height - chart_margin.y * 2))
    })
    // force_area_array.forEach(rect => rect.attr("width", plot_area.width - chart_margin.x * 2).attr('height', plot_area.height - chart_margin.y * 2))
    current_canvas_object.update_force_button()
    current_canvas_object.update_all_handle()

    if (show_force)
      current_canvas_object.force_group.style('display', null)

  }

  function update_back_board(){

    // console.log(chart_width, chart_height)
    back_board_obj
      .attr('width', chart_width + div_margin.x * 2)
      .attr('height', chart_height + div_margin.y * 2)

    back_board
      .style('width', chart_width + 'px')
      .style('height', chart_height + 'px')
  }

  function update_svg_contrain_back(new_real_width, new_real_height){
    if (svg_contain_back != ''){
      svg_contain_back
        .attr('width', new_real_width)
        .attr('height', new_real_height)

    }
  }

  function update_brush_position(){

    // console.log(update_brush)

    brush_visual_obj
      .extent([[edge, edge], [plot_area.width - chart_margin.x * 2 - edge, plot_area.height - chart_margin.y * 2 - edge]])
    content_group.call(brush_visual_obj)
  }
  resize_drag(size_change)
}


