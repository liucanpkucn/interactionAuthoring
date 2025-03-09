function deactivate_all_object_and_control_point(chart_json) {
  for (let coordinate_data of chart_json.CoordSys) {
    for (let point of coordinate_data.control_point)
      if ("tick" in point) point.activate = true;
      else point.activate = false;

    for (let vo of coordinate_data.visual_object)
      if (vo.type === "axis" || vo.tick) {
        vo.activate = true;
        vo.control_point.forEach(
          (d) => (coordinate_data.control_point[d].activate = true)
        );
      } else vo.activate = false;
  }
}

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function get_action() {
  let action = {
    begin_point: window._begin_point,
    pre_action_list: action_list,
  };
  console.log(JSON.stringify(action));
  return action;
}

function deactivate_vo_cp_of_coordinate(chart_json, coordinate_id) {
  coordinate_data = chart_json.CoordSys[coordinate_id];
  for (let point of coordinate_data.control_point)
    if ("tick" in point) point.activate = true;
    else point.activate = false;

  for (let vo of coordinate_data.visual_object)
    if (vo.type === "axis" || vo.tick) {
      vo.activate = true;
      vo.control_point.forEach(
        (d) => (coordinate_data.control_point[d].activate = true)
      );
    } else vo.activate = false;
}

// Add defs to svg
function add_strip_defs(svg_contain) {
  svg_contain
    .append("defs")
    .append("pattern")
    .attr("id", "strip_pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", "2")
    .attr("height", "2")
    .attr("patternTransform", "rotate(45)")
    .append("line")
    .attr("x1", 0)
    .attr("y", 0)
    .attr("x2", 0)
    .attr("y2", 2)
    .attr("stroke", "#D8D8D8")
    .attr("stroke-width", 1);

  let gravity_color = [
    { color: "#fff", offset: "0%", opacity: 0 },
    { color: "#2E2E2E", offset: "50%", opacity: 1 },
    { color: "#fff", offset: "100%", opacity: 0 },
  ];

  svg_contain
    .append("defs")
    .append("linearGradient")
    .attr("id", "vertical_gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "50%")
    .attr("y2", "50%")
    .selectAll("stop")
    .data(gravity_color)
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .style("stop-color", (d) => d.color)
    .style("stop-opacity", (d) => d.opacity);

  svg_contain
    .append("defs")
    .append("linearGradient")
    .attr("id", "horizon_gradient")
    .attr("x1", "50%")
    .attr("x2", "50%")
    .attr("y1", "0%")
    .attr("y2", "100%")
    .selectAll("stop")
    .data(gravity_color)
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .style("stop-color", (d) => d.color)
    .style("stop-opacity", (d) => d.opacity);
}

// Move main canvas when drag

function move_main_canvas(svg_contain, window_width, window_height) {
  let main_canvas_move = svg_contain
    .append("g")
    .append("rect")
    .attr("width", window_width)
    .attr("height", window_height)
    .attr("opacity", 0)
    .attr("cursor", "move");

  window.onresize = function () {
    window_width = document.getElementById("canvas").clientWidth;
    window_height = document.getElementById("canvas").clientHeight;

    svg_contain
      .attr("width", window_width)
      .attr("height", window_height)
      .attr("viewBox", [0, 0, window_width, window_height]);

    main_canvas_move.attr("width", window_width).attr("height", window_height);
    console.log("Change size");
  };

  let svg = svg_contain.append("g").attr("id", "main_canvas");

  // move the whole canvas
  let main_canvas_drag = d3
    .drag()
    .on("start", main_drag_start)
    .on("drag", main_drag)
    .on("end", main_drag_end);

  main_canvas_move.on("wheel", function (e) {
    // console.log('e', e)
    main_canvas_trans.x = main_canvas_trans.x - e.deltaX;
    main_canvas_trans.y = main_canvas_trans.y - e.deltaY;
    // console.log()
    svg.attr(
      "transform",
      "translate(" + main_canvas_trans.x + "," + main_canvas_trans.y + ")"
    );
  });

  main_canvas_drag(main_canvas_move);

  let main_canvas_start = { x: 0, y: 0 };
  let main_canvas_start_drag = { x: 0, y: 0 };

  function main_drag_start(e) {
    let current_point = get_source_point(e);
    main_canvas_start.x = current_point.pageX;
    main_canvas_start.y = current_point.pageY;
    main_canvas_start_drag.x = main_canvas_trans.x;
    main_canvas_start_drag.y = main_canvas_trans.y;
  }
  function main_drag(e) {
    let current_point = get_source_point(e);
    main_canvas_trans.x =
      main_canvas_start_drag.x + current_point.pageX - main_canvas_start.x;
    main_canvas_trans.y =
      main_canvas_start_drag.y + current_point.pageY - main_canvas_start.y;

    svg.attr(
      "transform",
      "translate(" + main_canvas_trans.x + "," + main_canvas_trans.y + ")"
    );
  }

  function main_drag_end(e) {
    main_drag(e);
    let current_point = get_source_point(e);
    change_xy = {
      dx: current_point.pageX - main_canvas_start.x,
      dy: current_point.pageY - main_canvas_start.y,
    };
    let current_action = {
      type: "move_background",
      change_position: change_xy,
    };
    action_list.push(current_action);
  }
  return svg;
}

function move_background(change_position, duration_time) {
  main_canvas_trans.x = main_canvas_trans.x + change_position.dx;
  main_canvas_trans.y = main_canvas_trans.y + change_position.dy;

  d3.select("#main_canvas")
    .transition()
    .duration(duration_time)
    .attr(
      "transform",
      "translate(" + main_canvas_trans.x + "," + main_canvas_trans.y + ")"
    );
}

function find_near_correct_place(
  window_width,
  window_height,
  chart_width,
  chart_height,
  original_start_point,
  current_obj = -1
) {
  console.log("original_start_point", original_start_point);
  // let window_width = document.getElementById("canvas").clientWidth
  // let window_height = document.getElementById("canvas").clientHeight
  let new_start_point = {
    x: original_start_point.x,
    y: original_start_point.y,
  };
  let edge = 50;

  let snap_range = 100;

  for (let i = 0, n = _chart_object.length; i < n; i++) {
    if (i == current_obj) continue;

    current_chart_object = _chart_object[i];

    let current_size = {
      width: current_chart_object.plot_area.width,
      height: current_chart_object.plot_area.height,
    };
    let current_start = {
      x: current_chart_object.plot_area.x,
      y: current_chart_object.plot_area.y,
    };

    let current_center = {
      x: current_start.x + current_size.width / 2,
      y: current_start.y + current_size.height / 2,
    };

    let new_size = {
      width: chart_width + 2 * chart_margin.x,
      height: chart_height + 2 * chart_margin.y,
    };

    let chart_center = {
      x: new_start_point.x + chart_width / 2 + chart_margin.x,
      y: new_start_point.y + chart_height / 2 + chart_margin.y,
    };
    console.log("chart_center", chart_center);
    let chart_center_2 = {
      x: new_start_point.x + new_size.width / 2,
      y: new_start_point.y + new_size.height / 2,
    };
    console.log("chart_center2", chart_center_2);

    if (
      judge_canvas_overlap(
        new_start_point,
        new_size,
        current_start,
        current_size
      )
    ) {
      if (
        Math.abs(chart_center.x - current_center.x) >
        Math.abs(chart_center.y - current_center.y)
      ) {
        if (chart_center.x - current_center.x > 0) {
          new_start_point.x =
            current_start.x + current_size.width + window_interval;
        } else {
          new_start_point.x =
            current_start.x - new_size.width - window_interval;
        }

        if (Math.abs(new_start_point.y - current_start.y) < snap_range) {
          new_start_point.y = current_start.y;
        }

        if (
          Math.abs(
            new_start_point.y +
              new_size.height -
              current_start.y -
              current_size.height
          ) < snap_range
        ) {
          new_start_point.y =
            current_start.y + current_size.height - new_size.height;
        }
      } else {
        if (chart_center.y - current_center.y > 0) {
          console.log("new chart is below the original chart");

          new_start_point.y =
            current_start.y + current_size.height + window_interval;
        } else {
          new_start_point.y =
            current_start.y - new_size.height - window_interval;
        }

        if (Math.abs(new_start_point.x - current_start.x) < snap_range) {
          new_start_point.x = current_start.x;
        }

        if (
          Math.abs(
            new_start_point.x +
              new_size.width -
              current_start.x -
              current_size.width
          ) < snap_range
        ) {
          new_start_point.x =
            current_start.x + current_size.width - new_size.width;
        }
      }
    }
  }

  return new_start_point;
}

function judge_canvas_overlap(a_start, a_size, b_start, b_size, edge = 150) {
  if (a_start.x > b_start.x + b_size.width + edge) return false;
  if (a_start.y > b_start.y + b_size.height + edge) return false;
  if (b_start.x > a_start.x + a_size.width + edge) return false;
  if (b_start.y > a_start.y + a_size.height + edge) return false;
  return true;
}

// Judge if the point is in current area

function is_point_in_current_area(point, current_object) {
  let current_plot_area = current_object.plot_area;
  let x_min = current_plot_area.x;
  let x_max = current_plot_area.x + current_plot_area.width;
  let y_min = current_plot_area.y;
  let y_max = current_plot_area.y + current_plot_area.height;
  // console.log('plot_area', current_object.plot_area)
  // console.log('x_min', x_min)
  // console.log('x_max', x_max)
  // console.log('y_min', y_min)
  // console.log('y_max', y_max)
  // console.log("point", point.x, point.y)

  if (
    point.x > x_min &&
    point.x < x_max &&
    point.y > y_min &&
    point.y < y_max
  ) {
    return true;
  }
  return false;
}

// Judge where should the point go.

function goes_to_which_area(point) {
  for (let current_canvas_object of window._chart_object) {
    if (is_point_in_current_area(point, current_canvas_object))
      return current_canvas_object;
  }
  return null;
}

function create_a_new_area(
  svg,
  chart_json,
  new_begin_point,
  resize = 1,
  coordinate_id = -1
) {
  new_chart_json = JSON.parse(JSON.stringify(chart_json));
  if (coordinate_id === -1)
    deactivate_all_object_and_control_point(new_chart_json);
  else deactivate_vo_cp_of_coordinate(new_chart_json, coordinate_id);
  console.log("new_begin_point", new_begin_point);

  let window_width = document.getElementById("canvas").clientWidth;
  let window_height = document.getElementById("canvas").clientHeight;

  // let margin_interval = 30

  new_begin_point = find_near_correct_place(
    window_width,
    window_height,
    new_chart_json.size.width * resize + 2 * chart_margin.x,
    new_chart_json.size.height * resize + 2 * chart_margin.y,
    (original_start_point = new_begin_point)
  );

  // console.log('svg string: ', svg_string)
  let copy_draw = new draw_a_canvas(
    svg,
    new_chart_json,
    new_begin_point,
    (resize = resize)
  );
  _chart_object.push(copy_draw);

  return copy_draw;
  // console.log(e)
}

function move_vis_obj_group_from_canvasA_to_canvasB(
  canvasA,
  canvasB,
  coordinate_id,
  vid_group,
  chosen_vid = null,
  point = { x: 0, y: 0 },
  direct = false
) {
  let A_to_B_distance = {
    dx: canvasB.start_point.x - canvasA.start_point.x,
    dy: canvasB.start_point.y - canvasA.start_point.y,
  };
  canvasB.dragOderStatus = canvasA.dragOderStatus;
  console.log("vid_group:", vid_group);
  console.log("coordinate id", coordinate_id);

  canvasA.deactivate_visual_object_group(vid_group, coordinate_id);
  canvasB.activate_visual_object_group(vid_group, coordinate_id);

  for (let vid of vid_group)
    move_a_single_point_canvas(
      canvasA,
      canvasB,
      coordinate_id,
      vid,
      A_to_B_distance,
      (direct = direct),
      (time = 2000)
    );

  console.log("direct", direct);
  console.log("chosen vid", chosen_vid);

  if (chosen_vid != null && !direct) {
    console.log("point_to_A: ", point);
    console.log("Point_to_B", {
      x: point.x - A_to_B_distance.dx,
      y: point.x - A_to_B_distance.dy,
    });
    canvasB.CoordSys[coordinate_id].simple_change_order(
      { x: point.x - A_to_B_distance.dx, y: point.y - A_to_B_distance.dy },
      chosen_vid
    );
  }

  canvasA.CoordSys[coordinate_id].restart_all_simulations();
  if (direct) {
    setTimeout(function (d) {
      canvasB.CoordSys[coordinate_id].restart_all_simulations();
    }, time + 100);
  } else {
    canvasB.CoordSys[coordinate_id].restart_all_simulations();
  }
}

function move_a_single_point_canvas(
  canvasA,
  canvasB,
  coordinate_id,
  vid,
  A_to_B_distance,
  direct = false,
  time = 1000
) {
  // console.log("canvasA:", canvasA)
  console.log("Vid:", vid)

  let canvas_A_control_point = canvasA.CoordSys[coordinate_id].control_point;
  let canvas_A_visual_object = canvasA.CoordSys[coordinate_id].visual_object;

  let canvas_B_control_point = canvasB.CoordSys[coordinate_id].control_point;
  let canvas_B_visual_object = canvasB.CoordSys[coordinate_id].visual_object;

  let control_point_A = canvas_A_visual_object[vid].control_point.map(
    (pid) => canvas_A_control_point[pid]
  );
  let control_point_B = canvas_B_visual_object[vid].control_point.map(
    (pid) => canvas_B_control_point[pid]
  );

  let point_num = control_point_B.length;
  console.log("point_num", point_num)

  if (direct) {
    current_obj = canvasB.canvas_part
      .select("#visual_object_" + vid)
      .attr(
        "transform",
        "translate(" + -A_to_B_distance.dx + "," + -A_to_B_distance.dy + ")"
      );

    console.log(current_obj);

    current_obj
      .transition()
      .duration(time)
      .attr("transform", "translate(0, 0)");
  } else {
    for (let i = 0; i < point_num; i++) {
      console.log("A show x", i, control_point_A[i].show_x)
      control_point_B[i].show_x =
        control_point_A[i].show_x - A_to_B_distance.dx;
      control_point_B[i].show_y =
        control_point_A[i].show_y - A_to_B_distance.dy;
      let data_xy = screen2xy(
        control_point_B[i].show_x,
        control_point_B[i].show_y,
        canvasB.CoordSys[coordinate_id].main_transform
      );
      control_point_B[i].x = data_xy.x;
      control_point_B[i].y = data_xy.y;
    }
  }
}

function move_a_single_point(
  canvasA,
  canvasB,
  vid,
  A_to_B_distance,
  direct = false,
  time = 1000
) {
  // console.log("canvasA:", canvasA)
  // console.log("Vid:", vid)
  let control_point_A = canvasA.visual_object[vid].control_point.map(
    (pid) => canvasA.control_point[pid]
  );
  let control_point_B = canvasB.visual_object[vid].control_point.map(
    (pid) => canvasB.control_point[pid]
  );

  let point_num = control_point_B.length;

  if (direct) {
    current_obj = canvasB.canvas_part
      .select("#visual_object_" + vid)
      .attr(
        "transform",
        "translate(" + -A_to_B_distance.dx + "," + -A_to_B_distance.dy + ")"
      );

    console.log(current_obj);

    current_obj
      .transition()
      .duration(time)
      .attr("transform", "translate(0, 0)");
  } else {
    for (let i = 0; i < point_num; i++) {
      control_point_B[i].show_x =
        control_point_A[i].show_x - A_to_B_distance.dx;
      control_point_B[i].show_y =
        control_point_A[i].show_y - A_to_B_distance.dy;
      let data_xy = screen2xy(
        control_point_B[i].show_x,
        control_point_B[i].show_y,
        canvasB.main_transform
      );
      control_point_B[i].x = data_xy.x;
      control_point_B[i].y = data_xy.y;
    }
  }
}

function move_visual_object_from_canvasA_to_canvasB(
  canvasA,
  canvasB,
  coordinate_id,
  vid,
  point
) {
  move_vis_obj_group_from_canvasA_to_canvasB(
    canvasA,
    canvasB,
    coordinate_id,
    [vid],
    (chosen_vid = vid),
    (point = point)
  );
}

function get_source_point(e) {
  let current_event_source = e.sourceEvent;
  let current_event_point = current_event_source;
  window._event = e;
  // console.log("event ...", current_event_source, current_event_source.pageX, current_event_source.hasOwnProperty('pageX'))
  if ("pageX" in current_event_source) {
    return current_event_source;
  } else {
    if (
      current_event_source.hasOwnProperty("touches") &&
      current_event_source.touches.length > 0
    ) {
      current_event_point = current_event_source.touches[0];
    } else {
      console.log("current event", current_event_source);
      current_event_point = current_event_source.changedTouches[0];
    }
  }
  return current_event_point;
}

function show_tooltip(information, x, y, opacity = 0.8) {
  d3.select("#tooltip")
    .html(information)
    .style("opacity", opacity)
    .style("left", x + "px")
    .style("top", y + "px");
}

function hide_tooltip() {
  d3.select("#tooltip").style("opacity", 0);
}
