// Draw_a_coordinate
let draw_a_coordinate = function (
  svg,
  current_canvas_contain,
  text_canvas,
  coordinate_data,
  main_canvas_object,
  resize
) {
  let clip_path_id = Math.random().toString();
  let clip_path_rect = current_canvas_contain
    .append("clipPath")
    .attr("id", clip_path_id)
    .append("rect")
    .attr("x", coordinate_data.area.x * main_canvas_object.global_resize)
    .attr("y", coordinate_data.area.y * main_canvas_object.global_resize)
    .attr(
      "width",
      coordinate_data.area.width * main_canvas_object.global_resize
    )
    .attr(
      "height",
      coordinate_data.area.height * main_canvas_object.global_resize
    );

  this.update_clip_path = function () {
    clip_path_rect
      .attr("x", coordinate_data.area.x * main_canvas_object.global_resize)
      .attr("y", coordinate_data.area.y * main_canvas_object.global_resize)
      .attr(
        "width",
        coordinate_data.area.width * main_canvas_object.global_resize
      )
      .attr(
        "height",
        coordinate_data.area.height * main_canvas_object.global_resize
      );
  };

  let current_canvas = current_canvas_contain
    .append("g")
    .attr("class", "coordinate")
    .attr("id", "coordinate_" + coordinate_data.id);

  let move_current = false;
  let drag_list = new Array();
  let current_move_list = [];

  let last_time = Date.now();
  let time_inter = 100;
  let main_transform = coordinate_data.transform;

  resize_transform(coordinate_data.transform, resize);

  let simulation_list = new Array();

  // Main part of the chart
  let control_point = coordinate_data.control_point;
  let constraints = coordinate_data.constraints;
  let visual_object = coordinate_data.visual_object;

  visual_object.forEach(function (d) {
    if (d.selected === undefined) d.selected = true;
    d.control_point.forEach(function (pid) {
      control_point[pid].selected = true;
    });
  });

  let append_text = coordinate_data.append_text;
  if (append_text === undefined) append_text = [];
  window._append_text = append_text;

  let text_id_dict = new Array();
  this.text_id_dict = text_id_dict;
  this.main_transform = main_transform;
  this.chart_size = coordinate_data.size;
  this.control_point = control_point;
  this.visual_object = visual_object;
  this.constraints = constraints;
  this.coordinate_data = coordinate_data;
  this.coordinate_id = coordinate_data.id;

  let current_coordinate_id = this.coordinate_id;
  let current_coordinate_object = this;

  let x_larger_list = constraints.filter((d) => d.type === "x_larger");
  this.x_larger_list = x_larger_list;

  let y_larger_list = constraints.filter((d) => d.type === "y_larger"); // node1 is larger than node2 in y direction
  this.y_larger_list = y_larger_list;

  let x_gravity_pairs = constraints.filter((d) => d.type === "x_gravity");
  this._x_gravity_pairs = x_gravity_pairs;

  let x_gravity_bias = initialize_bias(
    control_point,
    x_gravity_pairs,
    (type = "x")
  );
  let y_gravity_pairs = constraints.filter((d) => d.type === "y_gravity");
  this._y_gravity_pairs = y_gravity_pairs;

  let y_gravity_bias = initialize_bias(
    control_point,
    y_gravity_pairs,
    (type = "y")
  );

  let fixed_y_pairs = constraints.filter((d) => d.type === "fixed-y");
  let update_all_handle;
  this.fixed_y_pairs = fixed_y_pairs;
  let fixed_x_pairs = constraints.filter((d) => d.type === "fixed-x");
  let x_distance_list = constraints.filter((d) => d.type === "x_distance");
  let y_distance_list = constraints.filter((d) => d.type === "y_distance");
  console.log("fixed_y_pair", fixed_y_pairs);

  this.deal_with_axis();

  let x_axis_object; // x_axis scale
  let y_axis_object; // y_axis scale

  if (this.coordinate_data.y_axis !== null) {
    let y_axis_idx = this.coordinate_data.y_axis;
    y_axis_object = main_canvas_object.y_axis_object_list[y_axis_idx];
    if (!y_axis_object.hasOwnProperty("control_coordinate")) {
      y_axis_object.control_coordinate = [];
    }
    y_axis_object.control_coordinate.push(this);
    this.y_axis = y_axis_object;
    this.update_data_value((direction = "y"));
  }
  if (this.coordinate_data.x_axis !== null) {
    let x_axis_idx = this.coordinate_data.x_axis;
    x_axis_object = main_canvas_object.x_axis_object_list[x_axis_idx];
    if (!x_axis_object.hasOwnProperty("control_coordinate")) {
      x_axis_object.control_coordinate = [];
    }
    x_axis_object.control_coordinate.push(this);
    this.x_axis = x_axis_object;
    this.update_data_value((direction = "x"));
  }
  add_constraints_visual_object(constraints, visual_object, control_point);
  function update_hard_larger_list() {

    console.log('update_harder list!!!')
    x_larger_list.length = 0;
    current_coordinate_object.y_larger_list.length = 0;


    constraints.forEach(function (d) {
      if (d.type === "x_larger") {
        if (
          control_point[d.point1].activate &&
          control_point[d.point2].activate
        )
          x_larger_list.push(d);
      } else if (d.type === "y_larger") {
        if (
          control_point[d.point1].activate &&
          control_point[d.point2].activate
        ){
          current_coordinate_object.y_larger_list.push(d);
          console.log(d.point1, d.point2)
        }
      }
    });

    console.log(current_coordinate_object.y_larger_list)
    parse_collision_pair_new(
      x_larger_list,
      current_coordinate_object.y_larger_list,
      control_point,
      visual_object,
      constraints,
      coordinate_data.groups
    );

  }
  this.update_hard_larger_list = update_hard_larger_list;

  let non_text_visual_object = visual_object.filter(
    (d) => d.type !== "text" && d.type !== "axis"
  );
  let text_visual_object = visual_object.filter((d) => d.type === "text");

  let visual_object_canvas = current_canvas
    .append("g")
    // .attr('transform', 'translate(' + chart_margin.x + "," + chart_margin.y + ")")
    .attr("id", "vo canvas");

  let path_visual_object = visual_object.filter(
    (d) => d.type === "area" || d.type === "line"
  ).filter(d => d.activate);
  let point_visual_object = visual_object.filter((d) => d.type === "point");

  console.log("point_visual_object", point_visual_object);

  function get_chosen_idx_movement(
    current_position,
    current_value_list,
    axis_type = "x",
    sort_type = "x"
  ) {
    let value_length = current_value_list.length;
    let direction = "x";
    if (axis_type === "x") direction = "y";

    let chosen_idx = value_length - 1;

    if (
      current_position < control_point[current_value_list[0].pid[0]][sort_type]
    )
      chosen_idx = 0;

    for (let i = 0; i < value_length - 1; i++) {
      let current_cp = current_value_list[i].pid[0];
      let next_cp = current_value_list[i + 1].pid[0];
      if (
        current_position <
        (control_point[current_cp][sort_type] +
          control_point[next_cp][sort_type]) /
          2
      ) {
        chosen_idx = i;
        // console.log(current_position)
        break;
      }

      // console.log("value,", current_position, control_point[current_cp][direction], current_value_list[i].value)
    }
    // console.log("chosen idx", chosen_idx)
    let current_value = current_value_list[chosen_idx].value;

    let current_prefix =
      current_coordinate_object[axis_type + "_axis"].axis.prefix;
    let current_suffix =
      current_coordinate_object[axis_type + "_axis"].axis.suffix;
    let current_show_value;

    // console.log('typeof current value', typeof current_value)
    if (typeof current_value === "string")
      current_show_value = current_prefix + current_value + current_suffix;
    else if (typeof current_value === "object")
      current_show_value = current_value.toDateString();
    else
      current_show_value =
        current_prefix +
        (Math.round(Math.abs(current_value) * 10) / 10).toString() +
        current_suffix;

    return current_show_value;
  }
  window._point_object = point_visual_object;
  window._visual_object_canvas = visual_object_canvas;

  let circle_object = visual_object_canvas
    .selectAll(".circlea")
    .data(point_visual_object)
    .enter()
    .append("g")
    .attr("clip-path", "url(#" + clip_path_id + ")")
    .style("stroke-width", (d) =>
      d.stroke_width === undefined ? 0 : d.stroke_width
    )
    .attr("class", "circlea")
    .classed("visual_object", true)
    .attr("id", (d) => "visual_object_" + d.id)
    .style("stroke", (d) =>
      d.stroke === undefined ? "" : get_color_string(d.stroke)
    )
    .style("fill", function (d, i) {
      // console.log('Draw a point', d.id)
      if (d.type === "line") return "none";
      if (d.fill === "none") return "none";
      if (d.fill === "") return "none";
      return get_color_string(d.fill);
    })
    .attr("fill-opacity", (d) => d.fill_opacity)
    .on("mouseover", vo_mouse_over)
    .on("mousemove", vo_mouse_move)
    .on("mouseout", vo_mouse_out)
    .on("click", vo_click);

  let circle_object_circle = circle_object
    .append("circle")
    .attr("r", (d) => d.radius * main_canvas_object.global_resize);

  let link = visual_object_canvas
    .selectAll(".vo")
    .data(path_visual_object)
    .join("path")
    .attr("clip-path", "url(#" + clip_path_id + ")")
    .attr("stroke-width", (d) =>
      d.stroke_width === undefined ? 0 : d.stroke_width
    )
    .attr("class", "visual_object")
    .attr("id", (d) => "visual_object_" + d.id)
    .attr("stroke", (d) =>
      d.stroke === undefined ? "" : get_color_string(d.stroke)
    )
    .attr("fill", function (d) {
      if (d.type === "line") return "none";
      if (d.fill === "none") return "none";
      if (d.fill === "") return "none";
      return get_color_string(d.fill);
    })
    .attr("fill-opacity", (d) => d.fill_opacity)
    .on("mouseover", vo_mouse_over)
    .on("mousemove", vo_mouse_move)
    .on("mouseout", vo_mouse_out)
    .on("click", vo_click);

  let showHintStart = null;
  let showHintPosIn = false;
  function vo_mouse_over(e, d) {
    // console.log("Over")
    showHintPosIn = true;
    // console.log(showHintStart)
    if (showHintStart == null) {
      showHintStart = setTimeout(() => {
        if (showHintPosIn === false) {
          return;
        }
        addHint(main_canvas_object, showHintStartE);
        clearRemove = removeHintLater(main_canvas_object, 2000, () => {
          clearTimeout(showHintStart);
          showHintStart = null;
        });
      }, 1000);
    } else {
      showHintStartE = e;
    }
  }

  function vo_mouse_out(e, d) {
    showHintPosIn = false;
    d3.select(this).classed("chosen", false);
    clearTimeout(clearRemove);
    clearRemove = removeHintLater(main_canvas_object, 300, () => {
      clearTimeout(showHintStart);
      showHintStart = null;
    });
    hide_tooltip();
  }

  function vo_click(e, d) {
    console.log("vo_click");
    if (e.defaultPrevented) return;
    console.log("click on", d3.select(this));
    console.log(coordinate_data.groups[0].obj_group_dict);

    if (d.id in coordinate_data.groups[0].obj_group_dict) {
      let group = coordinate_data.groups[0];
      let group_id = group.obj_group_dict[d.id];
      let current_group = group.group_list[group_id].visual_object;
      console.log(group, group_id, current_group);

      visual_object.forEach(function (obj) {
        if (current_group.indexOf(obj.id) !== -1) {
          obj.selected = obj.activate;
        } else {
          obj.selected = false;
        }
        obj.control_point.forEach(function (pid) {
          control_point[pid].selected = obj.selected;
        });
      });
    }
    link.classed("selected", (d) => d.selected);
    link.classed("deselected", (d) => !d.selected);

    circle_object.classed("selected", (d) => d.selected);
    circle_object.classed("deselected", (d) => !d.selected);

    update_all_handle();
    console.log("Click on visual object: ", d);
  }

  let clearRemove = null;
  let showHintStartE = null;
  function vo_mouse_move(e, d) {
    // // when mouse hover
    showHintPosIn = true;
    let cid = "cid" + _chart_object.indexOf(main_canvas_object);
    if (
      d3.select(`.dragHint.${cid}`).node() &&
      d3.select(`.dragHint.${cid}`).style("display") != "none"
    ) {
      moveHint(main_canvas_object, e);
      clearTimeout(showHintStart);
      clearTimeout(clearRemove);
      clearRemove = removeHintLater(main_canvas_object, 2000, () => {
        clearTimeout(showHintStart);
        showHintStart = null;
      });
    } else {
      if (showHintStart) {
        showHintStartE = e;
      }
    }
    if (d.type === "area") d3.select(this).classed("chosen", true);
    // console.log('dddd', d.value)
    let show_info = "";

    let current_x =
      e.x -
      main_canvas_object.plot_area.x -
      main_canvas_trans.x -
      chart_margin.x;
    let current_y =
      e.y -
      main_canvas_object.plot_area.y -
      main_canvas_trans.y -
      chart_margin.y;
    // console.log(d, current_x, current_y)

    if (
      d.hasOwnProperty("fixed_x_value") &&
      coordinate_data.main_axis.type != "x"
    ) {
      let current_value_list = d.fixed_x_value;
      let current_show_value = get_chosen_idx_movement(
        current_y,
        current_value_list,
        "x",
        "y"
      );
      show_info += "X: " + current_show_value + "  " + "<BR>";
      // console.log('fixed-y_value', fixed_y_value)
    } else if (d.hasOwnProperty("should_x_value")) {
      let current_value_list = d.should_x_value;
      let current_show_value = get_chosen_idx_movement(
        current_x,
        current_value_list,
        (axis_type = "x"),
        (sort_type = "x")
      );

      show_info += "X: " + current_show_value + "  " + "<BR>";
    }

    if (d.hasOwnProperty("fixed_y_value")) {
      let current_value_list = d.fixed_y_value;
      let current_show_value = get_chosen_idx_movement(
        current_x,
        current_value_list,
        "y",
        "x"
      );
      show_info += "Y: " + current_show_value + "  " + "<BR>";
      // console.log('fixed-y_value', fixed_y_value)
    } else if (d.hasOwnProperty("should_y_value")) {
      let current_value_list = d.should_y_value;
      let current_show_value = get_chosen_idx_movement(
        current_y,
        current_value_list,
        (axis_type = "y"),
        (sort_type = "y")
      );

      show_info += "Y: " + current_show_value + "  " + "<BR>";
    }
    // console.log('show_info', show_info)

    // console.log(show_info.length)

    if (show_info.length > 0) {
      show_tooltip(
        show_info,
        parseInt(e.pageX) + rem2px(2),
        parseInt(e.pageY) + rem2px(1),
        0.8
      );
    }
    // d3.select('#tooltip')
    //   .html(show_info)
    //   .style('opacity', 0.8)
    //   .style('left', (parseInt(e.x)) + 'px')
    //   .style('top', (parseInt(e.y)) + 'px')
  }

  this.link = link;
  this.circle_object = circle_object;

  this.update_circle_radius = function () {
    console.log("global resize", main_canvas_object.global_resize);
    circle_object_circle.attr(
      "r",
      (d) =>
        control_point[d.control_point[0]].radius *
        main_canvas_object.global_resize
    );
  };

  const text_object = visual_object_canvas
    .append("g")
    .attr("id", "text_group")
    .selectAll(".text_object")
    .data(text_visual_object)
    .join("g")
    .attr("id", (d) => `visual_object_${d.id}`)
    .classed("text", true);

  let append_text_object = text_canvas
    .append("g")
    .attr("clip-path", "url(#" + clip_path_id + ")")
    .selectAll(".all_text")
    .data(append_text)
    .join("g")
    .attr("pointer-events", "none")
    .classed("text", true)
    .attr("id", function (d, i) {
      let text_id = `coord_${current_coordinate_id}_append_${i}`
      d3.selectAll(`#${text_id}`).remove()
      text_id_dict[d.control_point] = d3.select(this);
      return `coord_${current_coordinate_id}_append_${i}`;
    });

  append_text_object
    .append("g")
    .attr("id", "move_layer")
    .html((d) => d.text_origin);

  text_object.html((d) => d.origin);

  window.append_text_object = text_object;

  window._text_visual_object = text_visual_object;

  text_object.each(function (d) {
    d.original_size = parseFloat(
      d3.select(this).select("text").style("font-size").split("px")[0]
    );
  });

  append_text_object.each(function (d) {
    d.original_size = parseFloat(
      d3.select(this).select("text").style("font-size").split("px")[0]
    );
  });

  update_text_object();

  function update_text_object() {
    text_object.selectAll("text").style("font-size", function (d) {
      return d.original_size / main_transform.x_rate + "px";
    });

    append_text_object.selectAll("text").style("font-size", function (d) {
      return d.original_size / main_transform.x_rate + "px";
    });
  }

  this.update_text_object = update_text_object;

  let force_area_array = [];

  this.force_area_array = force_area_array;

  update_simulation_tick();

  set_up_simulations();

  update_activate();

  // update_simulation_tick()

  var dragVisualObject = d3
    .drag()
    .on("start", dragVisualObjectStart)
    .on("drag", dragedVisualObject_new)
    .on("end", dragEndVisualObject);

  // circle_object.on('touchmove', function(e, d){
  //   window._event = e
  //   console.log("touch move", e)
  // })

  dragVisualObject(link);
  dragVisualObject(text_object);
  dragVisualObject(circle_object);

  this.activate_visual_object = function (vid, activate = true) {
    this.activate_visual_object_group([vid], activate);
  };

  this.activate_visual_object_group = function (vid_group, activate = true) {
    for (let vid of vid_group) {
      visual_object[vid].activate = activate;
      visual_object[vid].control_point.forEach(
        (d) => (control_point[d].activate = activate)
      );
    }

    update_activate();
    // this.restart_all_simulations()
  };

  this.deactivate_visual_object = function (vid) {
    this.activate_visual_object(vid, (activate = false));
  };

  this.deactivate_visual_object_group = function (vid_group) {
    this.activate_visual_object_group(vid_group, (activate = false));
  };

  this.remove_current_canvas = function () {
    for (let simulation of simulation_list) simulation.stop();
    current_canvas.remove();
  };

  this.stop_simulation = function () {
    for (let simulation of simulation_list) simulation.stop();
  };

  let visual_object_drag_start_position = { x: 0, y: 0 };
  let current_drag_position = { x: 0, y: 0 };
  let current_move_elements = new Array();
  let current_move_text = new Array();

  // addHint({sourceEvent: {clientX: 800, clientY: 400}});
  function dragVisualObjectStart(e, d) {
    for (let simulation of simulation_list) {
      simulation.stop();
    }
    visual_object_drag_start_position.x = e.x;
    visual_object_drag_start_position.y = e.y;

    if (move_current || d.type === "text") {
      current_move_list = [d.id];
    } else if (
      main_canvas_object.brush_selected &&
      visual_object[d.id].selected && visual_object[d.id].activate
    ) {
      console.log("Selected brushed ");
      current_move_list = visual_object
        .filter((d) => d.selected && d.activate)
        .map((d) => d.id);
      console.log("current brush list", current_move_list);
    } else if (d.id in coordinate_data.groups[0].obj_group_dict) {
      current_move_list = coordinate_data.groups[0].group_list[
        coordinate_data.groups[0].obj_group_dict[d.id]
      ].visual_object.filter((vid) => visual_object[vid].activate);
    } else {
      current_move_list = [d.id];
    }

    current_move_elements.length = 0;
    current_move_text.length = 0;

    for (let vid of current_move_list) {
      let this_move_vb = current_canvas.select(`#visual_object_${vid}`);
      this_move_vb.raise();
      current_move_elements.push(this_move_vb);
    }

    for (let vid of current_move_list) {
      let vo = visual_object[vid];
      for (let pid of vo["control_point"]) {
        if (pid in text_id_dict) {
          current_move_text.push(text_id_dict[pid]);
        }
      }
    }

    d3.select(this).raise();
    main_canvas_object.canvas_part.raise();
    initial_drag_list(e);
  }

  function dragedVisualObject_new(e) {
    let cid = "cid" + _chart_object.indexOf(main_canvas_object);
    if (
      d3.select(`.dragHint.${cid}`).node() &&
      d3.select(`.dragHint.${cid}`).style("display") != "none"
    ) {
      moveHint(main_canvas_object, e);
      clearTimeout(showHintStart);
    } else {
      if (showHintStart) {
        showHintStartE = e;
      }
    }
    update_drag_list(e);
    current_drag_position.x = e.x;
    current_drag_position.y = e.y;
    let diff_position = {
      x: current_drag_position.x - visual_object_drag_start_position.x,
      y: current_drag_position.y - visual_object_drag_start_position.y,
    };

    current_move_elements.forEach(function (element) {
      element.attr(
        "transform",
        `translate(${diff_position.x},${diff_position.y})`
      );
    });
    current_move_text.forEach(function (element) {
      element
        .selectAll("#move_layer")
        .attr("transform", `translate(${diff_position.x},${diff_position.y})`);
    });
  }
  function dragEndVisualObject(e, d) {
    removeHint(main_canvas_object, () => {
      clearTimeout(showHintStart);
      showHintStart = null;
    });
    let status = judge_drag_status(e);

    console.log("status", status);
    if (status.drag_small) {
      console.log("click", current_move_list);
      main_canvas_object.brush_selected = false;
      main_canvas_object.chart_json.CoordSys.forEach(function (
        coordinate_data
      ) {
        if (coordinate_data.id !== current_coordinate_id) {
          coordinate_data.visual_object.forEach((d) => (d.selected = false));
          coordinate_data.control_point.forEach((d) => (d.selected = false));
        }
      });

      visual_object.forEach(function (vo) {
        let selected = false;
        // console.log(vo.id, vo.id in current_move_list)
        if (current_move_list.indexOf(vo.id) >= 0) selected = true;
        vo.selected = selected;
        vo.control_point.forEach(
          (pid) => (control_point[pid].selected = selected)
        );
      });
      link.classed("selected", (d) => d.selected);
      circle_object.classed("selected", (d) => selected);
      link.classed("deselected", (d) => !d.selected);
      circle_object.classed("deselected", (d) => !selected);
      main_canvas_object.update_all_handle();
      return;
    }

    dragedVisualObject_new(e);
    current_move_elements.forEach(function (element) {
      element.transition(1).attr("transform", "translate(0, 0)");
    });
    current_move_text.forEach(function (element) {
      element
        .selectAll("#move_layer")
        .transition()
        .attr("transform", "translate(0,0)");
    });

    current_position = screen2xy(
      e.x -
        chart_margin.x -
        main_canvas_object.plot_area.x -
        main_canvas_trans.x,
      e.y -
        chart_margin.y -
        main_canvas_object.plot_area.y -
        main_canvas_trans.y,
      main_transform
    );
    last_position = screen2xy(
      visual_object_drag_start_position.x -
        chart_margin.x -
        main_canvas_object.plot_area.x -
        main_canvas_trans.x,
      visual_object_drag_start_position.y -
        chart_margin.y -
        main_canvas_object.plot_area.y -
        main_canvas_trans.y,
      main_transform
    );

    let change_xy = {
      dx: current_position.x - last_position.x,
      dy: current_position.y - last_position.y,
    };
    let current_event_point = get_source_point(e);
    let mouse_point = {
      x: current_event_point.pageX - main_canvas_trans.x,
      y: current_event_point.pageY - main_canvas_trans.y,
    };
    let current_vo_id = d.id;
    let current_canvas_position = { x: e.x, y: e.y };
    let current_action = {
      type: "move_mark",
      status: status,
      move_vo_list: current_move_list,
      absolute_mouse_point: mouse_point,
      relative_mouse_point: current_canvas_position,
      current_vo_id: current_vo_id,
      change_position: change_xy,
      coordinate_id: current_coordinate_id,
      canvas_id: _chart_object.indexOf(main_canvas_object),
    };
    action_list.push(current_action);
    if (d.type === "text" && d.tick_point !== undefined) {
      control_point[d.tick_point].x += change_xy.dx;
      control_point[d.tick_point].y += change_xy.dy;
    }
    current_coordinate_object.drag_visual_element(
      status,
      current_move_list,
      change_xy,
      mouse_point,
      current_canvas_position,
      current_vo_id
    );
  }

  this.simulate_drag_visual_element = function (
    status,
    current_move_list,
    change_xy,
    mouse_point,
    current_canvas_position,
    current_vo_id,
    simulate_time
  ) {
    this.stop_simulation();
    let current_move_elements = new Array();
    // move current canvas to the top
    main_canvas_object.canvas_part.raise();
    for (let vid of current_move_list) {
      let this_move_vb = current_canvas.select(`#visual_object_${vid}`);
      this_move_vb.raise();
      current_move_elements.push(this_move_vb);
    }

    d3.select("#action_cursor")
      .raise()
      .style("opacity", 1)
      .attr(
        "transform",
        `translate(${mouse_point.x - change_xy.dx},${
          mouse_point.y - change_xy.dy
        })`
      )
      .transition()
      .duration(simulate_time)
      .attr("transform", `translate(${mouse_point.x},${mouse_point.y})`);

    setTimeout(function () {
      d3.select("#action_cursor").style("opacity", 0);
    }, simulate_time);

    current_move_elements.forEach(function (element) {
      element
        .transition()
        .duration(simulate_time)
        .attr("transform", `translate(${change_xy.dx},${change_xy.dy})`);
    });

    current_move_list.forEach(function (vid) {
      let vo = visual_object[vid];
      vo.control_point.forEach(function (p) {
        control_point[p].x += change_xy.dx;
        control_point[p].y += change_xy.dy;
      });
    });

    // update_simulation_tick_move(simulate_time)
    setTimeout(function () {
      update_simulation_tick();
      move_optimization(
        status,
        current_move_list,
        change_xy,
        mouse_point,
        current_canvas_position,
        current_vo_id
      );
    }, simulate_time + 500);
  };

  this.drag_visual_element = function (
    status,
    current_move_list,
    change_xy,
    mouse_point,
    current_canvas_position,
    current_vo_id
  ) {
    current_move_list.forEach(function (vid) {
      let vo = visual_object[vid];
      vo.control_point.forEach(function (p) {
        control_point[p].x += change_xy.dx;
        control_point[p].y += change_xy.dy;
      });
    });

    update_simulation_tick();
    move_optimization(
      status,
      current_move_list,
      change_xy,
      mouse_point,
      current_canvas_position,
      current_vo_id
    );
  };

  this.change_stack_order = function(direction = "y"){
    coordinate_data.groups[0].order = direction
    update_hard_larger_list();
    restart_all_simulations();
  }

  this.half_opacity = function(){
    link.filter(d => d.activate)
      .classed('half_opacity', true)
  }
  this.remove_half_opacity = function(){
    link.classed('half_opacity', false)
  }

  let move_optimization = function (
    status,
    current_move_list,
    change_xy,
    mouse_point,
    current_canvas_position,
    current_vo_id
  ) {
    restart_all_simulations();
    if (status.fast) {
      delete_color_group_by_d(current_vo_id);
      return;
    }
    if (is_point_in_current_area(mouse_point, main_canvas_object)) {
      console.log("In current area");
      if (
        status.main_direction !== coordinate_data.groups[0].order &&
        current_vo_id in coordinate_data.groups[0].obj_group_dict
      ) {
        console.log('change stack direction')
        coordinate_data.groups[0].order = status.main_direction;
        main_canvas_object.dragOderStatus =
          1 -
          (main_canvas_object.dragOderStatus === undefined
            ? 0
            : main_canvas_object.dragOderStatus);
        console.log("order changed", main_canvas_object.dragOderStatus);
      }
      current_coordinate_object.simple_change_order_list(
        current_canvas_position,
        current_move_list
      );
      return;
    }
    console.log("Out of current area");
    another_canvas_object = goes_to_which_area(mouse_point);

    if (another_canvas_object === null) {
      if (
        status.shaking &&
        current_vo_id in coordinate_data.groups[0].obj_group_dict
      ) {
        let resize = 0.5;
        console.log("new_start_point drag list", drag_list);
        let new_start_point = {
          x:
            drag_list.current_screen.x -
            (drag_list.begin_screen.x - start_point.x) * resize,
          y:
            drag_list.current_screen.y -
            (drag_list.begin_screen.y - start_point.y) * resize,
        };
        let group = coordinate_data.groups[0];
        let activate_order_list = group.order_list.filter(function (d) {
          let current_group = group.group_list[d];
          // console.log("current_group", current_group)
          return visual_object[current_group.visual_object[0]].activate;
        });
        console.log(activate_order_list);
        selected_group_id = group.obj_group_dict[current_vo_id];
        console.log(
          group.obj_group_dict,
          current_vo_id,
          selected_group_id,
          activate_order_list.indexOf(selected_group_id)
        );

        selected_group_position =
          activate_order_list.indexOf(selected_group_id);
        if (selected_group_position === -1) {
          alert("Wrong seleted position");
        }

        let new_canvas_object = create_a_new_area(
          svg,
          main_canvas_object.chart_json,
          new_start_point,
          (resize = 1),
          (coordinate_id = current_coordinate_id)
        );

        move_vis_obj_group_from_canvasA_to_canvasB(
          main_canvas_object,
          new_canvas_object,
          current_coordinate_id,
          current_move_list,
          current_vo_id,
          current_canvas_position,
          false
        );
        for (let current_group_id of activate_order_list) {
          if (current_group_id === selected_group_id) continue;
          let current_position = activate_order_list.indexOf(current_group_id);
          let try_move_list = group.group_list[current_group_id].visual_object;
          let try_start_point = {
            x: new_start_point.x,
            y:
              new_start_point.y -
              (current_position - selected_group_position) * 200,
          };
          let try_canvas_object = create_a_new_area(
            svg,
            main_canvas_object.chart_json,
            try_start_point,
            (resize = 1),
            (coordinate_id = current_coordinate_id)
          );
          move_vis_obj_group_from_canvasA_to_canvasB(
            current_canvas_object,
            try_canvas_object,
            current_coordinate_id,
            try_move_list,
            null,
            { x: 0, y: 0 },
            (direct = true)
          );
        }
      } else {
        // let movement = get_movement()
        // console.log("movement", movement.x, movement.y)
        console.log("change_xy", change_xy.dx, change_xy.dy);
        // let new_start_point = {x: main_canvas_object.plot_area.x + change_xy.x, y: main_canvas_object.plot_area.y + change_xy.y}
        let new_start_point = {
          x: main_canvas_object.plot_area.x + change_xy.dx,
          y: main_canvas_object.plot_area.y + change_xy.dy,
        };

        let new_canvas_object = create_a_new_area(
          svg,
          main_canvas_object.chart_json,
          new_start_point,
          (resize = 1),
          (coordinate_id = current_coordinate_id)
        );
        move_vis_obj_group_from_canvasA_to_canvasB(
          main_canvas_object,
          new_canvas_object,
          current_coordinate_id,
          current_move_list,
          current_vo_id,
          current_canvas_position,
          false
        );
      }
      return;
    }
    console.log("and go to: ", another_canvas_object.plot_area);
    move_vis_obj_group_from_canvasA_to_canvasB(
      main_canvas_object,
      another_canvas_object,
      current_coordinate_id,
      current_move_list,
      current_vo_id,
      current_canvas_position
    );
  };

  this.simple_change_order_list = function (point, vid_list) {
    let group_dict = coordinate_data.groups[0].obj_group_dict;
    let order_list = coordinate_data.groups[0].order_list;
    let useful_vid = vid_list.filter((d) => d in group_dict);
    let useful_group_index = new Set();
    for (let idx of useful_vid) {
      useful_group_index.add(group_dict[idx]);
    }
    let group_order_list = [];
    useful_group_index = Array.from(useful_group_index);
    order_len = order_list.length;
    let delete_position = [];
    for (let i = 0; i < order_len; i++) {
      let group_idx = order_list[i]; // group order
      if (useful_group_index.indexOf(group_idx) > -1) {
        group_order_list.push(group_idx);
        delete_position.push(i);
      }
    }
    console.log("delete position", delete_position);
    console.log("useful group index", useful_group_index);

    for (let i = delete_position.length - 1; i >= 0; i--) {
      order_list.splice(delete_position[i], 1);
    }

    let mouse_data_point = screen2xy(point.x, point.y, main_transform);

    let closest_point = find_closest_points_exclude_group(
      control_point,
      visual_object,
      mouse_data_point,
      useful_group_index,
      coordinate_data.groups[0]
    );
    let insert_position = 0;
    if (closest_point !== null) {
      console.log("closest_point", group_dict[closest_point.obj_id]);
      let compare_attr = coordinate_data.groups[0].order;
      let mid_attr = find_same_point_closest(
        closest_point,
        compare_attr,
        visual_object,
        control_point
      );
      insert_position = get_group_order_by_vid(
        coordinate_data.groups[0],
        closest_point.obj_id
      );
      console.log("insert_position", insert_position);
      if (mouse_data_point[compare_attr] > mid_attr) {
        insert_position += 1;
      }
    }
    console.log("insert_position", insert_position);
    coordinate_data.groups[0].order_list.splice(
      insert_position,
      0,
      ...group_order_list
    ); // add the new order
    console.log("order: " + coordinate_data.groups[0].order_list);
    update_hard_larger_list();
  };

  this.simple_change_order = function (point, vid) {
    if (vid in coordinate_data.groups[0].obj_group_dict) {
      console.log("Point", point);
      // group_index = coordinate_data.groups[0].obj_group_dict[d.id] // The index of the group
      // group_order = coordinate_data.groups[0].order_list.indexOf(group_index) // the order of the group
      let group_index = coordinate_data.groups[0].obj_group_dict[vid];
      let group_order = get_group_order_by_vid(coordinate_data.groups[0], vid);
      console.log("group order", group_order);
      console.log("before order" + coordinate_data.groups[0].order_list);
      coordinate_data.groups[0].order_list.splice(group_order, 1); // remove the original order
      let mouse_data_point = screen2xy(point.x, point.y, main_transform);
      let closest_point = find_closest_points(
        control_point,
        visual_object,
        mouse_data_point,
        vid,
        coordinate_data.groups[0]
      );
      let insert_position;
      if (closest_point === null) insert_position = 0;
      else {
        console.log("closest_point", closest_point);
        // current_canvas.select("#point_" + closest_point.id).attr('fill', "black").attr('r', 10).style("display", null)
        let compare_attr = coordinate_data.groups[0].order;
        let mid_attr = find_same_point_closest(
          closest_point,
          compare_attr,
          visual_object,
          control_point
        );
        insert_position = get_group_order_by_vid(
          coordinate_data.groups[0],
          closest_point.obj_id
        );
        console.log("insert_position", insert_position);
        if (mouse_data_point[compare_attr] > mid_attr) {
          insert_position += 1;
        }
      }
      console.log("insert_position", insert_position);
      coordinate_data.groups[0].order_list.splice(
        insert_position,
        0,
        group_index
      ); // add the new order
      console.log("order: " + coordinate_data.groups[0].order_list);
      update_hard_larger_list();
    }
  };

  function set_up_simulations() {
    update_hard_larger_list();
    window._y_larger_list = y_larger_list;

    let for_xiaopang = false;

    if (for_xiaopang) {
      constraints.push(...y_larger_list);
      console.log(
        JSON.stringify({
          nodes: control_point,
          visual_object: visual_object,
          constraints: constraints,
        })
      );
    }
    let simulation_node = d3
      .forceSimulation(control_point)
      .alphaMin(0.01)
      .alphaDecay(1 - Math.pow(0.01, 1 / 500))
      .on("tick", update_simulation_tick)
      .force("collide", myCollide().radius(collision_radius).strength(1))
      // .force("x", d3.forceX(should_x_force).strength(0.05))
      .force("should_force", should_force)
      .force("gravity_x", x_gravity_force)
      .force("gravity_y", y_gravity_force)
      .force("pair", larger_pair_force)
      .force("distance_pair", distance_pair_force)
      .force("fixed-pair", fixed_pair_force)
      .force("larger_force", larger_than_force)
      .force("fixed-force", fixed_force)
      .force("pair2", larger_pair_force)
      .force("distance_pair2", distance_pair_force)
      .force("fixed-pair2", fixed_pair_force)
      .force("larger_force2", larger_than_force)
      .force("fixed-force2", fixed_force)
      .force("pair3", larger_pair_force)
      .force("distance_pair3", distance_pair_force)
      .force("fixed-pair3", fixed_pair_force)
      .force("fixed-force3", fixed_force)
      .force("larger_force3", larger_than_force);
    // .stop()
    simulation_list.push(simulation_node);
  }

  function update_collision_force() {
    simulation_list[0]
      .force("collide", myCollide().radius(collision_radius).strength(1))
      .restart();
  }

  this.update_collision_force = update_collision_force;

  function find_same_point_closest(
    closest_point,
    compare_attr,
    visual_object,
    control_point
  ) {
    let another_attr = compare_attr === "y" ? "should_x" : "should_y";
    let point_list = [];
    for (let pid of visual_object[closest_point.obj_id].control_point) {
      let current_point = control_point[pid];
      if (current_point[another_attr] === closest_point[another_attr])
        point_list.push(current_point);
    }
    let compare_list = point_list.map((d) => d[compare_attr]);
    // console.log("compare_list", compare_list)
    return compare_list.reduce((a, b) => a + b, 0) / compare_list.length;
  }

  function get_group_order_by_vid(current_group, vid) {
    let group_index = current_group.obj_group_dict[vid]; // The index of the group
    let group_order = current_group.order_list.indexOf(group_index); // the order of the group
    return group_order;
  }

  function find_closest_points_exclude_group(
    control_point,
    visual_object,
    point,
    exclude_groups,
    current_group
  ) {
    function dis_p(p1, p2) {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    let min_dis = 100000000;
    let closest_point = null;

    console.log("current_group.obj_group_dict: ", current_group.obj_group_dict);
    for (let v_id in current_group.obj_group_dict) {
      // 排除和当前在同一组的
      if (exclude_groups.indexOf(current_group.obj_group_dict[v_id]) > -1)
        continue;
      // 排除不在同一个坐标系的
      let current_vo = visual_object[v_id];

      if (!current_vo.activate) continue;

      for (let pid of current_vo.control_point) {
        let current_point = control_point[pid];
        let dis = dis_p(point, current_point);
        if (dis < min_dis) {
          closest_point = current_point;
          min_dis = dis;
        }
      }
    }
    console.log("closest_point", closest_point);
    console.log("point", point);
    return closest_point;
  }

  function find_closest_points(
    control_point,
    visual_object,
    point,
    obj_id,
    current_group
  ) {
    function dis_p(p1, p2) {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    let min_dis = 100000000;
    let closest_point = null;

    console.log("current_group.obj_group_dict: ", current_group.obj_group_dict);
    for (let v_id in current_group.obj_group_dict) {
      // 排除和当前在同一组的
      if (
        current_group.obj_group_dict[v_id] ==
        current_group.obj_group_dict[obj_id]
      )
        continue;
      // 排除不在同一个坐标系的
      let current_vo = visual_object[v_id];

      if (!current_vo.activate) continue;

      for (let pid of current_vo.control_point) {
        let current_point = control_point[pid];
        let dis = dis_p(point, current_point);
        if (dis < min_dis) {
          closest_point = current_point;
          min_dis = dis;
        }
      }
    }
    console.log("closest_point", closest_point);
    console.log("point", point);
    return closest_point;
  }

  function delete_color_group_by_d(current_vo_id) {
    if (current_vo_id in coordinate_data.groups[0].obj_group_dict) {
      group_index = coordinate_data.groups[0].obj_group_dict[current_vo_id]; // The index of the group
      console.log(group_index);
      console.log(
        "coordinate_data.groups[0].group_list[group_index]: ",
        coordinate_data.groups[0].group_list[group_index]
      );

      for (let v of coordinate_data.groups[0].group_list[group_index]
        .visual_object) {
        current_vo = coordinate_data.visual_object[v];
        current_vo.activate = false;

        for (let p of current_vo.control_point) {
          control_point[p].activate = false;
          // console.log(p, false )
        }
      }
    }
    update_activate();
    restart_all_simulations();
  }

  function deactivate_visual_objects(visual_objects_id_list) {
    visual_objects_id_list.forEach((id) => {
      let current_object = coordinate_data.visual_object[id];
      current_object.activate = false;
      for (let p of current_object.control_point) {
        control_point[p].activate = false;
      }
    });
    update_activate();
  }
  function delete_visual_objects(visual_objects_id_list) {
    deactivate_visual_objects(visual_objects_id_list);
    restart_all_simulations();
  }
  this.deactivate_visual_objects = deactivate_visual_objects;
  this.delete_visual_objects = delete_visual_objects;

  function judge_speed_is_quick() {
    let total_time = drag_list.current_time - drag_list.begin_time;
    let total_distance_x =
      drag_list.current_screen.x - drag_list.begin_screen.x;
    let total_distance_y =
      drag_list.current_screen.y - drag_list.begin_screen.y;
    let x_speed = total_distance_x / total_time;
    let y_speed = total_distance_y / total_time;
    console.log("total_time: ", total_time);
    console.log("total_distance_x: ", total_distance_x);
    console.log("total_distance_y: ", total_distance_y);
    console.log("x_speed: ", x_speed);
    console.log("y_speed: ", y_speed);
    if (x_speed * x_speed + y_speed * y_speed > 5) return true;
    else return false;
  }

  function judge_shake() {
    if (drag_list.change_vx_num > 5) return true;
    return false;
  }

  function update_drag_list(e) {
    drag_list.current_xy = screen2xy(e.x, e.y, main_transform);

    // console.log(e.sourceEvent)
    let current_point = get_source_point(e);

    // console.log(e.sourceEvent, current_point)
    window._event = e.sourceEvent;

    let change_xy = {
      x: current_point.pageX - drag_list.current_screen.x,
      y: current_point.pageY - drag_list.current_screen.y,
    };

    drag_list.abs_x_move += Math.abs(change_xy.x);
    drag_list.abs_y_move += Math.abs(change_xy.y);

    drag_list.current_screen = {
      x: current_point.pageX,
      y: current_point.pageY,
    };
    drag_list.current_time = Date.now();

    if (change_xy.dx != 0) {
      if (change_xy.dx * drag_list.direction_x <= 0) {
        drag_list.direction_x = change_xy.dx;
        drag_list.change_vx_num++;
      }
    }

    if (change_xy.dy != 0) {
      if (change_xy.dy * drag_list.direction_y <= 0) {
        drag_list.direction_y = change_xy.dy;
        drag_list.change_vy_num++;
      }
    }
  }

  // let change_xy = {dx: current_position.x - last_position.x, dy: current_position.y - last_position.y}

  function get_movement() {
    let movement = {
      x: drag_list.current_screen.x - drag_list.begin_screen.x,
      y: drag_list.current_screen.y - drag_list.begin_screen.y,
    };
    return movement;
  }

  function initial_drag_list(e) {
    let current_point = get_source_point(e);
    drag_list.begin_xy = screen2xy(e.x, e.y, main_transform);
    drag_list.current_xy = { x: drag_list.begin_xy.x, y: drag_list.begin_xy.y };
    drag_list.begin_screen = { x: current_point.pageX, y: current_point.pageY };
    drag_list.current_screen = {
      x: current_point.pageX,
      y: current_point.pageY,
    };
    drag_list.direction_x = 0;
    drag_list.direction_y = 0;
    drag_list.change_vx_num = 0;
    drag_list.change_vy_num = 0;
    drag_list.begin_time = Date.now();
    drag_list.abs_x_move = 0;
    drag_list.abs_y_move = 0;
  }
  function judge_drag_status(e) {
    let status = {};
    if (drag_list.change_vy_num > 5 || drag_list.change_vy_num > 5) {
      status.shaking = true;
      if (drag_list.change_vx_num > drag_list.change_vy_num)
        status.shaking_direction = "x";
      else if (drag_list.change_vy_num > drag_list.change_vx_num)
        status.shaking_direction = "y";
      else {
        if (drag_list.abs_x_move > drag_list.abs_y_move)
          status.shaking_direction = "x";
        else status.shaking_direction = "y";
      }
    } else {
      status.shaking = false;
    }

    // drag_list.current_screen

    console.log(drag_list);
    if (
      Math.abs(drag_list.current_screen.x - drag_list.begin_screen.x) < 2 &&
      Math.abs(drag_list.current_screen.y - drag_list.begin_screen.y) < 2
    ) {
      status.drag_small = true;
    } else {
      status.drag_small = false;
    }
    status.main_direction =
      Math.abs(drag_list.current_xy.x - drag_list.begin_xy.x) >
      Math.abs(drag_list.current_xy.y - drag_list.begin_xy.y)
        ? "x"
        : "y";
    status.fast = judge_speed_is_quick();
    return status;
  }

  // Draw the gravity
  function transition_tick(time = 1000) {
    control_point.forEach(function (n) {
      n.x = n.n_x;
      n.y = n.n_y;
    });
    update_activate();
    trans(time);
  }

  function update_activate() {
    link.style("display", (d) => (d.activate ? null : "none"));
    text_object.style("display", (d) => (d.activate ? null : "none"));
    circle_object.style("display", (d) => (d.activate ? null : "none"));
    append_text_object.style("display", (d) =>
      control_point[d.control_point].activate ? null : "none"
    );
    update_collision_force();
    update_hard_larger_list();
  }

  this.update_activate = update_activate;

  function trans(time) {
    let trans = d3.transition().duration(time);

    control_point.forEach(function (d) {
      if (d.hasOwnProperty("coordinate_id")) {
        let position = xy2screen(d.x, d.y, main_transform);
        d.show_x = position.x;
        d.show_y = position.y;
      } else {
        d.show_x = d.x;
        d.show_y = d.y;
      }
    });

    // trans.selectAll('.node')
    //   .each(function(d){

    //   })
    //   .attr("cx", d => d.show_x)
    //   .attr("cy", d => d.show_y);

    trans.selectAll(".visual_object").attr("d", get_string);
  }

  function keep_accuracy(num) {
    return parseInt(num * 10) / 10;
  }

  function update_simulation_tick() {
    control_point.forEach(function (d) {
      if (d.hasOwnProperty("coordinate_id")) {
        let position = xy2screen(d.x, d.y, main_transform);
        d.show_x = keep_accuracy(position.x);
        d.show_y = keep_accuracy(position.y);
      } else {
        d.show_x = keep_accuracy(d.x);
        d.show_y = keep_accuracy(d.y);
      }
    });
    link.attr("transform", "translate(0, 0)").attr("d", get_string);

    text_object
      // .attr('transform', 'translate(0, 0)')
      .attr("transform", get_text_position);

    circle_object_circle.attr("transform", function (d) {
      let point = control_point[d.control_point[0]];
      return "translate(" + point.show_x + "," + point.show_y + ")";
    });

    append_text_object.attr("transform", function (d) {
      let point = control_point[d.control_point];
      let related_dis = d.related_dis;
      return (
        "translate(" +
        (point.show_x - related_dis.x) +
        "," +
        (point.show_y - related_dis.y) +
        ")"
      );
    });
  }

  function update_simulation_tick_move(trans = 500) {
    control_point.forEach(function (d) {
      if (d.hasOwnProperty("coordinate_id")) {
        let position = xy2screen(d.x, d.y, main_transform);
        d.show_x = keep_accuracy(position.x);
        d.show_y = keep_accuracy(position.y);
      } else {
        d.show_x = keep_accuracy(d.x);
        d.show_y = keep_accuracy(d.y);
      }
    });

    // link
    //   .attr('transform', 'translate(0, 0)')

    link.transition().duration(trans).attr("d", get_string);

    text_object
      // .attr('transform', 'translate(0, 0)')
      .attr("transform", get_text_position);

    circle_object_circle.attr("transform", function (d) {
      let point = control_point[d.control_point[0]];
      return "translate(" + point.show_x + "," + point.show_y + ")";
    });

    append_text_object.attr("transform", function (d) {
      let point = control_point[d.control_point];
      let related_dis = d.related_dis;
      return (
        "translate(" +
        (point.show_x - related_dis.x) +
        "," +
        (point.show_y - related_dis.y) +
        ")"
      );
    });
  }

  function update_simulation_tick_trans() {
    control_point.forEach(function (d) {
      if (d.hasOwnProperty("coordinate_id")) {
        let position = xy2screen(d.x, d.y, main_transform);
        d.show_x = keep_accuracy(position.x);
        d.show_y = keep_accuracy(position.y);
      } else {
        d.show_x = keep_accuracy(d.x);
        d.show_y = keep_accuracy(d.y);
      }
    });

    current_time = Date.now();
    if (current_time - last_time > time_inter) {
      let current_trans = current_time - last_time;
      last_time = current_time;

      link.transition().duration(current_trans).attr("d", get_string);

      text_object
        .transition()
        .duration(current_trans)
        .attr("transform", get_text_position);

      update_simulation_tick.attr("transform", function (d) {
        let point = control_point[d.control_point[0]];
        return "translate(" + point.show_x + "," + point.show_y + ")";
      });

      append_text_object
        .transition()
        .duration(current_trans)
        .attr("transform", function (d) {
          let point = control_point[d.control_point];
          let related_dis = d.related_dis;
          return (
            "translate(" +
            (point.show_x - related_dis.x) +
            "," +
            (point.show_y - related_dis.y) +
            ")"
          );
        });
    }
  }

  function restart_all_simulations() {
    update_simulation_tick();
    for (let simulation of simulation_list) {
      simulation.alpha(1).restart();
    }
  }

  this.update_simulation_tick = update_simulation_tick;
  this.update_simulation_tick_move = update_simulation_tick_move;
  this.restart_all_simulations = restart_all_simulations;

  function get_text_position(d) {
    let text_position = control_point[d.control_point[4]];
    let screen_xy = xy2screen(text_position.x, text_position.y, main_transform);
    return "translate(" + screen_xy.x + "," + screen_xy.y + ")";
  }

  function get_text_position_abs(d) {
    let text_position = control_point[d.control_point[4]];
    let screen_xy = xy2screen(text_position.x, text_position.y, main_transform);
    return screen_xy;
  }

  function get_string(d) {
    if (!d.activate){
      return "M 1,1Z"
    }
    let activate_control_point = d.control_point.filter(d => control_point[d].activate)
    if (!d.activate || activate_control_point.length === 0) {
      return "M 1,1Z";
    }
    // console.log(activate_control_point)

    let need_c = true;
    if (d.type === "area" || d.type === "text" || d.type === "line") {
      return_string = `M${control_point[activate_control_point[0]].show_x},${
        control_point[activate_control_point[0]].show_y
      }`;
      let last_type = "M";
      for (let i = 1, n = activate_control_point.length; i < n; i++) {
        if (need_c) {
          let last_x = control_point[activate_control_point[i - 1]].show_x;
          let last_y = control_point[activate_control_point[i - 1]].show_y;
          let this_x = control_point[activate_control_point[i]].show_x;
          let this_y = control_point[activate_control_point[i]].show_y;
          let next_x = control_point[activate_control_point[(i + 1) % n]].show_x;
          let next_y = control_point[activate_control_point[(i + 1) % n]].show_y;

          let before_x_rate, after_x_rate, before_y_rate, after_y_rate;
          if (Math.abs(last_x + next_x - this_x * 2) < 3) {
            before_y_rate = (next_y - last_y) / 6;
            after_y_rate = before_y_rate;
            before_x_rate = (next_x - last_x) / 6;
            after_x_rate = before_x_rate;
          } else {
            before_y_rate = (this_y - last_y) / 3;
            after_y_rate = (next_y - this_y) / 3;
            before_x_rate = (this_x - last_x) / 3;
            after_x_rate = (next_x - this_x) / 3;
          }

          if (i === n - 1) {
            if (last_type === "M")
              return_string += "L" + this_x + ", " + this_y;
            else
              return_string +=
                this_x -
                before_x_rate +
                ", " +
                (this_y - before_y_rate) +
                "," +
                this_x +
                "," +
                this_y;
          } else if (last_type === "M") {
            return_string +=
              "L" +
              this_x +
              ", " +
              this_y +
              "C" +
              (this_x + after_x_rate) +
              "," +
              (this_y + after_y_rate) +
              ",";
            last_type = "C";
          } else {
            return_string +=
              this_x -
              before_x_rate +
              ", " +
              (this_y - before_y_rate) +
              "," +
              this_x +
              ", " +
              this_y +
              "C" +
              (this_x + after_x_rate) +
              "," +
              (this_y + after_y_rate) +
              ",";
          }
        } else
          return_string +=
            "L" +
            control_point[activate_control_point[i]].show_x +
            ", " +
            control_point[activate_control_point[i]].show_y;
      }
      if (d.type === "area") return_string += "Z";
    } else if (d.type === "point") {
      let cpoint = control_point[activate_control_point[0]];
      let radius = cpoint.radius * main_canvas_object.global_resize;
      return_string =
        "M" +
        (cpoint.show_x - radius) +
        "," +
        cpoint.show_y +
        "A" +
        radius +
        "," +
        radius +
        " 0 0,0 " +
        (cpoint.show_x + radius) +
        "," +
        cpoint.show_y;
      return_string +=
        "A" +
        radius +
        "," +
        radius +
        " 0 0,0 " +
        (cpoint.show_x - radius) +
        "," +
        cpoint.show_y;

      // console.log(return_string)
    }
    // console.log(return_string)
    return return_string;
  }

  function update_json(send_data) {
    if (!need_back_end_cal)
      // 如果不需要后台计算
      return;

    console.log("send_data", send_data);

    $.ajax({
      type: "POST",
      url: "retarget/update_chart",
      data: send_data,
      dataType: "json",
      success: function (json_data) {
        window.return_json_data = json_data;

        // console.log("return_json_data: ", json_data)
        let point_num = control_point.length;
        for (let i = 0; i < point_num; i++) {
          control_point[i].n_x = json_data.control_point[i].n_x;
          control_point[i].n_y = json_data.control_point[i].n_y;
        }

        transition_tick(1000);
      },
      error: function (jqXHR) {
        // $('.loading').hide()
        alert("There is something wrong with our server");
      },
    });
  }

  function get_color_string(color_list) {
    if (Array.isArray(color_list) && color_list.length === 3)
      return (
        "rgb(" + color_list[0] + "," + color_list[1] + "," + color_list[2] + ")"
      );
    else {
      console.log(color_list);
      if (color_list.indexOf("url") === 0) return "#777";
      return color_list;
    }
  }

  function fixed_pair_force(alpha) {
    fixed_force_template(alpha, (type = "x"));
    fixed_force_template(alpha, (type = "y"));
  }

  function collision_radius(node) {
    if (node.collide && node.activate) return node.radius + 1;
    else return 0;
  }

  function fixed_y_force(alpha) {
    fixed_force_template(alpha, (type = "y"));
    // let nodes = control_point
    // for (var i = 0, pair_num = fixed_y_pairs.length; i < pair_num; i ++ ){
    //   pair = fixed_y_pairs[i]
    //   source = nodes[pair.point1]
    //   target = nodes[pair.point2]
    //   if ((!source.activate) || (!target.activate))
    //     continue
    //   let dis = pair.distance

    //   current_distance = source.y + source.vy - target.y - target.vy

    //   mid_v = (source.vy + target.vy) / 2
    //   source.vy = mid_v
    //   target.vy = mid_v

    //   strength = (current_distance - dis) / (current_distance) * alpha

    //   source.y -= (current_distance - dis) / 2
    //   target.y += (current_distance - dis) / 2
    // }
  }
  function fixed_force_template(alpha, type = "y") {
    let nodes = control_point;
    let fixed_pair;
    let bias;
    let p;
    let vp;
    if (type === "y") {
      fixed_pair = fixed_y_pairs;
      // bias = fixed_y_bias
      p = "y";
      vp = "vy";
    } else {
      fixed_pair = fixed_x_pairs;
      // bias = fixed_x_bias
      p = "x";
      vp = "vx";
    }
    for (var i = 0, pair_num = fixed_pair.length; i < pair_num; i++) {
      pair = fixed_pair[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;
      let dis = pair.distance;

      current_distance = source[p] + source[vp] - target[p] - target[vp];

      mid_v = (source[vp] + target[vp]) / 2;
      source[vp] = mid_v;
      target[vp] = mid_v;

      strength = ((current_distance - dis) / current_distance) * alpha;

      source[p] -= (current_distance - dis) * 0.5;
      target[p] += (current_distance - dis) * 0.5;
    }
  }

  function x_gravity_force(alpha) {
    let nodes = control_point;
    let bias = x_gravity_bias;
    for (var i = 0, pair_num = x_gravity_pairs.length; i < pair_num; i++) {
      pair = x_gravity_pairs[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;
      let dis = pair.distance;
      current_distance = source.x + source.vx - target.x - target.vx;
      move_force = current_distance - dis;
      source.vx -= move_force * 0.1 * alpha * (1 - bias[i]);
      target.vx += move_force * 0.1 * alpha * bias[i];
    }
  }

  function y_gravity_force(alpha) {
    let nodes = control_point;
    let bias = y_gravity_bias;
    for (var i = 0, pair_num = y_gravity_pairs.length; i < pair_num; i++) {
      pair = y_gravity_pairs[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;
      let dis = pair.distance;
      current_distance = source.y + source.vy - target.y - target.vy;
      move_force = current_distance - dis;
      source.vy -= move_force * 0.1 * alpha * (1 - bias[i]);
      target.vy += move_force * 0.1 * alpha * bias[i];
    }
  }

  function should_force(alpha) {
    let nodes = control_point;
    for (var i = 0, node_num = control_point.length; i < node_num; i++) {
      let node = nodes[i];
      if (!node.activate) continue;
      if ("should_x" in node) {
        let force_rate = 0.05;
        // if (node.small_force_x || node.collide)
        //   force_rate = 0.01

        let disx = node.should_x - node.x - node.vx;
        node.vx += disx * force_rate * alpha;
      }
      if ("should_y" in node) {
        let force_rate = 0.05;
        // if (node.small_force_y || node.collide)
        //   force_rate = 0.01
        let disy = node.should_y - node.y - node.vy;
        node.vy += disy * force_rate * alpha;
      }
    }
  }

  function y_gravity_force(alpha) {
    let nodes = control_point;
    let bias = y_gravity_bias;
    for (var i = 0, pair_num = y_gravity_pairs.length; i < pair_num; i++) {
      pair = y_gravity_pairs[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;
      let dis = pair.distance;
      current_distance = source.y + source.vy - target.y - target.vy;
      move_force = current_distance - dis;
      source.vy -= move_force * 0.1 * alpha * (1 - bias[i]);
      target.vy += move_force * 0.1 * alpha * bias[i];
    }
  }

  function initialize_bias(nodes, links, type = "y") {
    var i,
      n = nodes.length,
      m = links.length,
      link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      (link = links[i]), (link.index = i);
      count[nodes[link.point1].id] = (count[nodes[link.point1].id] || 0) + 1;
      count[nodes[link.point2].id] = (count[nodes[link.point2].id] || 0) + 1;
    }
    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i];
      bias[i] =
        count[nodes[link.point1].id] /
        (count[nodes[link.point1].id] + count[nodes[link.point2].id]);
      if ("fixed-" + type in nodes[link.point1]) bias[i] = 1;
      if ("fixed-" + type in nodes[link.point2]) bias[i] = 0;
    }
    return bias;
  }

  function fixed_force(alpha) {
    let nodes = control_point;
    for (var i = 0, node_num = nodes.length; i < node_num; i++) {
      current_node = nodes[i];
      if (!current_node.activate) continue;
      if ("fixed-y" in current_node) {
        value = current_node["fixed-y"];
        current_node.y = value;
        current_node.vy = 0;
      }
      if ("fixed-x" in current_node) {
        value = current_node["fixed-x"];
        current_node.x = value;
        current_node.vx = 0;
      }
    }
  }

  function distance_pair_force(alpha) {
    let nodes = control_point;
    let pairs = y_distance_list;
    pair_distance_force_template(
      alpha,
      pairs,
      nodes,
      (p = "y"),
      (vp = "vy"),
      (fixed = "fixed-y")
    );
    pairs = x_distance_list;
    pair_distance_force_template(
      alpha,
      pairs,
      nodes,
      (p = "x"),
      (vp = "vx"),
      (fixed = "fixed-x")
    );
  }

  function pair_distance_force_template(
    alpha,
    pairs,
    nodes,
    p = "y",
    vp = "vy",
    fixed = "fixed-y"
  ) {
    for (var i = 0, pair_num = pairs.length; i < pair_num; i++) {
      pair = pairs[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;

      let dis = pair.distance;
      current_distance = source[p] + source[vp] - target[p] - target[vp];

      if (current_distance > 0) {
        // source is larger than target
        if (current_distance < dis) {
          move_vy = current_distance - dis;
          if (fixed in source || fixed in target) {
            // console.log("pair", pair)
            source[vp] = 0;
            target[vp] = 0;
            if (fixed in source) {
              source[p] = source[fixed];
              target[p] = source[p] - dis;
            } else {
              target[p] = target[fixed];
              source[p] = target[fixed] + dis;
            }
          } else {
            mid_v = (source[vp] + target[vp]) / 2;
            v_decay = 0.8;

            source[vp] = (mid_v / 2) * v_decay;
            target[vp] = (mid_v / 2) * v_decay;

            source[p] -= move_vy / 2;
            target[p] += move_vy / 2;
          }
        }
      } else {
        // source is smaller than target
        if (current_distance > -dis) {
          move_vy = current_distance + dis;
          if (fixed in source || fixed in target) {
            // console.log("pair", pair)
            source[vp] = 0;
            target[vp] = 0;
            if (fixed in source) {
              source[p] = source[fixed];
              target[p] = source[p] + dis;
            } else {
              target[p] = target[fixed];
              source[p] = target[fixed] - dis;
            }
          } else {
            mid_v = (source[vp] + target[vp]) / 2;
            v_decay = 0.8;

            source[vp] = (mid_v / 2) * v_decay;
            target[vp] = (mid_v / 2) * v_decay;

            source[p] -= move_vy / 2;
            target[p] += move_vy / 2;
          }
        }
      }
    }
  }

  function larger_pair_force(alpha) {
    let nodes = control_point;
    let pairs = y_larger_list;
    larger_pair_force_template(
      alpha,
      pairs,
      nodes,
      (p = "y"),
      (vp = "vy"),
      (fixed = "fixed-y")
    );
    pairs = x_larger_list;
    larger_pair_force_template(
      alpha,
      pairs,
      nodes,
      (p = "x"),
      (vp = "vx"),
      (fixed = "fixed-x")
    );
  }

  function larger_pair_force_template(
    alpha,
    pairs,
    nodes,
    p = "y",
    vp = "vy",
    fixed = "fixed-y"
  ) {
    for (var i = 0, pair_num = pairs.length; i < pair_num; i++) {
      pair = pairs[i];
      source = nodes[pair.point1];
      target = nodes[pair.point2];
      if (!source.activate || !target.activate) continue;

      let dis = pair.distance;
      current_distance = source[p] + source[vp] - target[p] - target[vp];

      if (current_distance < dis) {
        // strength = (current_distance - dis) / (current_distance) * alpha

        move_vy = current_distance - dis;
        current_dis = source[p] - target[p] - dis;

        if (false) {
          source[vp] -= move_vy / 2;
          target[vp] += move_vy / 2; //(current_distance - dis) / 2 * alpha
        } else {
          if (fixed in source || fixed in target) {
            // console.log("pair", pair)
            source[vp] = 0;
            target[vp] = 0;
            if (fixed in source) {
              source[p] = source[fixed];
              target[p] = source[p] - dis;
            } else {
              target[p] = target[fixed];
              source[p] = target[fixed] + dis;
            }
          } else {
            mid_v = (source[vp] + target[vp]) / 2;
            v_decay = 1;

            source[vp] = (mid_v / 2) * v_decay;
            target[vp] = (mid_v / 2) * v_decay;

            source[p] -= current_dis / 2;
            target[p] += current_dis / 2;
          }
        }
      }
    }
  }

  function larger_than_force(alpha) {
    let nodes = control_point;
    for (var i = 0, node_num = nodes.length; i < node_num; i++) {
      current_node = nodes[i];
      if (!current_node.activate) continue;
      // if (i === 152){
      //   console.log(current_node)
      //   console.log(current_node.larger_y, current_node.smaller_y, current_node.y)
      // }
      if ("larger_y" in current_node) {
        compare_value = current_node["larger_y"];
        if (
          current_node.y + current_node.vy <
          compare_value + current_node.radius
        ) {
          current_node.y = compare_value + current_node.radius;
          current_node.vy = 0;
        }
      }
      if ("smaller_y" in current_node) {
        compare_value = current_node["smaller_y"];
        if (
          current_node.y + current_node.vy >
          compare_value - current_node.radius
        ) {
          current_node.y = compare_value - current_node.radius;
          current_node.vy = 0;
        }
      }
      if ("larger_x" in current_node) {
        compare_value = current_node["larger_x"];
        if (
          current_node.x + current_node.vx <
          compare_value + current_node.radius
        ) {
          current_node.x = compare_value + current_node.radius;
          current_node.vx = 0;
        }
      }
      if ("smaller_x" in current_node) {
        compare_value = current_node["smaller_x"];
        if (
          current_node.x + current_node.vx >
          compare_value - current_node.radius
        ) {
          current_node.x = compare_value - current_node.radius;
          current_node.vx = 0;
        }
      }
    }
  }
};

draw_a_coordinate.prototype.deal_with_axis = function () {
  let control_point = this.control_point;
  let constraints = this.constraints;

  function update_data_value(direction = "y") {
    let current_axis = this[direction + "_axis"];
    if (
      current_axis.axis.scale_type === "linear" ||
      current_axis.axis.scale_type === "time"
    ) {
      let attr_group = [
        `should_${direction}`,
        `o${direction}`,
        direction,
        `smaller_${direction}`,
        `larger_${direction}`,
      ];
      control_point.forEach(function (d, i) {
        for (let attr of attr_group) {
          if (d.hasOwnProperty(attr) && !d.hasOwnProperty(`${attr}_value`))
            d[`${attr}_value`] = current_axis.scale.invert(d[attr]);
          if (current_axis.axis.scale_type === "time") {
            if (
              d.hasOwnProperty(`${attr}_value`) &&
              typeof d[`${attr}_value`] === "string"
            ) {
              d[`${attr}_value`] = new Date(d[`${attr}_value`]);
            }
          }
        }
      });
      constraints.forEach(function (d) {
        if (
          d.type === "fixed-" + direction &&
          !d.hasOwnProperty("distance_value")
        ) {
          d.distance_value = current_axis.scale.invert(
            d.distance + current_axis.scale(0)
          );
        }
        if (current_axis.axis.scale_type === "time") {
          if (
            d.hasOwnProperty("distance_value") &&
            typeof d["distance_value"] === "string"
          ) {
            d["distance_value"] = new Date(d["distance_value"]);
          }
        }
      });
    } else if (current_axis.axis.scale_type === "quantize") {
      control_point.forEach(function (d, i) {
        // console.log("第" + i + "点" , d)
        if (
          d.hasOwnProperty(`should_${direction}`) &&
          !d.hasOwnProperty(`should_${direction}_value`)
        ) {
          let value = d[`should_${direction}`];
          let should_value = current_axis.scale(value);
          let inver_extent = current_axis.scale.invertExtent(should_value);
          if (inver_extent[0] <= value && value <= inver_extent[1]) {
            d[`should_${direction}_value`] = current_axis.scale(
              d[`should_${direction}`]
            );
          }
        }
      });
    }
  }

  function update_data_value_hard(direction = "y") {
    let current_axis = this[`${direction}_axis`];
    if (
      current_axis.axis.scale_type === "linear" ||
      current_axis.axis.scale_type === "time"
    ) {
      let attr_group = [
        `should_${direction}`,
        `o${direction}`,
        direction,
        `show_${direction}`,
        `smaller_${direction}`,
        `larger_${direction}`,
      ];
      control_point.forEach(function (d, i) {
        for (let attr of attr_group) {
          if (d.hasOwnProperty(attr))
            d[`${attr}_value`] = current_axis.scale.invert(d[attr]);
        }
      });
      constraints.forEach(function (d) {
        if (d.type === "fixed-" + direction) {
          d.distance_value = current_axis.scale.invert(
            d.distance + current_axis.scale(0)
          );
        }
      });
    } else if (current_axis.axis.scale_type === "quantize") {
      control_point.forEach(function (d, i) {
        // console.log("第" + i + "点" , d)
        if (d.hasOwnProperty("should_" + direction)) {
          let value = d["should_" + direction];
          let should_value = current_axis.scale(value);
          let inver_extent = current_axis.scale.invertExtent(should_value);
          if (inver_extent[0] <= value && value <= inver_extent[1]) {
            d["should_" + direction + "_value"] = current_axis.scale(
              d["should_" + direction]
            );
          }
          // d['should_' + direction + "_value"] = current_axis.scale(d["should_" + direction])
        }
      });
      constraints.forEach(function (d) {
        if (d.type === "fixed-" + direction) {
          d.distance_value = d.distance;
        }
      });
    }
  }

  function update_new_scale_light(current_scale, direction = "y") {
    // Update position x, y, should_x, should_y

    // console.log("update_axis")

    let current_axis = this[direction + "_axis"];

    if (
      current_axis.axis.scale_type === "linear" ||
      current_axis.axis.scale_type === "time"
    ) {
      let attr_group = [
        "should_" + direction,
        "o" + direction,
        direction,
        "smaller_" + direction,
        "larger_" + direction,
      ];
      control_point.forEach(function (d) {
        for (let attr of attr_group) {
          if (d.hasOwnProperty(attr)) {
            let before_value, after_value;
            if (attr === "x") before_value = d[attr];
            d[attr] = current_scale(d[attr + "_value"]);
            if (attr === "x") {
              after_value = d[attr];
            }
          }
        }
      });

      // Update larger smaller,
      constraints.forEach(function (d) {
        if (d.type === "fixed-" + direction) {
          d.distance = current_scale(d.distance_value) - current_scale(0);
        }
      });
    } else if (current_axis.axis.scale_type === "quantize") {
      control_point.forEach(function (d) {
        if (d.hasOwnProperty(`should_${direction}_value`)) {
          let old_should = d[`should_${direction}`];
          let extent = current_scale.invertExtent(
            d[`should_${direction}_value`]
          );
          d["should_" + direction] = (extent[0] + extent[1]) / 2;
          let new_should = d[`should_${direction}`];
          let should_change = new_should - old_should;
          d[`show_${direction}`] = d[`show_${direction}`] + should_change;
          d[direction] = d[direction] + should_change;
        }
      });
      this.update_simulation_tick_move();
    }
  }

  function update_new_scale(current_scale, direction = "y") {
    let current_axis;
    if (direction === "x") current_axis = this.x_axis;
    else current_axis = this.y_axis;
    this.update_new_scale_light(current_scale, direction);
    this.update_hard_larger_list();
  }

  function update_fixed_size(resize, direction = "y") {
    constraints.forEach(function (d) {
      if (d.type === "fixed-" + direction) {
        d.distance = d.distance * resize;
      }
    });
  }

  this.update_data_value = update_data_value;
  this.update_data_value_hard = update_data_value_hard;
  this.update_new_scale = update_new_scale;
  this.update_new_scale_light = update_new_scale_light;
  this.update_fixed_size = update_fixed_size;
};
