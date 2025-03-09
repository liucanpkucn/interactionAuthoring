let draw_axis = function (canvas, axis, current_canvas_object) {
  if (axis === null) return;
  this.axis = axis;
  this.current_canvas = current_canvas_object;
  let fixed_point_value = 0;
  let axis_canvas = canvas.append("g").attr("id", `axis${axis.type}`);
  let edge = 10;
  let axis_back = axis_canvas
    .append("rect")
    .attr("x", axis.area.x - edge / 2)
    .attr("y", axis.area.y - edge / 2)
    .attr("width", axis.area.width + edge)
    .attr("height", axis.area.height + edge)
    .attr("class", "axis_back");

  let axis_handle = axis_canvas
    .selectAll(".axis_handle")
    .data(axis.pixel_domain)
    .enter()
    .append("g")
    .attr("idx", (_d, i) => i)
    .attr("display", "none");

  axis_handle.append("rect").each(function (d) {
    let this_rect = d3.select(this);
    if (axis.type === "x") {
      this_rect
        .attr("y", axis.area.y - edge / 2)
        .attr("height", axis.area.height + edge)
        .attr("width", edge)
        .attr("fill", "red")
        .attr("x", d - edge / 2);
    } else {
      this_rect
        .attr("x", axis.area.x - edge / 2)
        .attr("width", axis.area.width + edge)
        .attr("height", edge)
        .attr("fill", "red")
        .attr("y", d - edge / 2);
    }
  });

  let axis_handle_drag = d3
    .drag()
    .on("start", drag_axis_handle_start)
    .on("drag", drag_axis_handle);

  let begin_drag_idx = 0;
  let begin_drag_value = 0;

  function drag_axis_handle_start(e) {
    begin_drag_idx = parseInt(d3.select(this).attr("idx"));
    if (axis.type === "x") {
      begin_drag_value = e.x;
    } else begin_drag_value = e.y;
  }

  function drag_axis_handle(e, _d) {
    if (axis.type == "x") {
      current_drag_value = e.x;
      let position = axis.pixel_domain[begin_drag_idx];
      d3.select(this).select("rect").attr("x", position);
    }
  }
  axis_handle_drag(axis_handle);
  if (axis.scale_type === "linear") {
    this.scale = d3
      .scaleLinear()
      .domain(axis.value_range) // The value domain
      .range(axis.pixel_domain); // the pixel range
  } else if (axis.scale_type === "quantize") {
    // Mention that the quantize scale if reversed
    this.scale = d3
      .scaleQuantize()
      .range(axis.value_range)
      .domain(axis.pixel_domain);
  } else if (axis.scale_type === "time") {
    window._time_axis = this;
    this.scale = d3
      .scaleTime()
      .domain(axis.value_range.map((d) => new Date(d)))
      .range(axis.pixel_domain);
  }

  let current_axis_object = this;
  let current_scale = this.scale;
  let original_tick_num;
  let last_k = 1;
  let tick;
  let tick_text;
  let drag_tick = d3
    .drag()
    .on("start", drag_tick_start)
    .on("drag", drag_tick_move)
    .on("end", drag_tick_end);

  let zoom_point = 0;
  let zoom_point_value = 0;

  let timerAxisXY = null;
  axis_canvas
    .on("mouseenter", function (e) {
      console.log("highlight");
      addHintForXY(current_canvas_object, e, axis.type);
      timerAxisXY = removeHintLater(current_canvas_object, 1000);
      axis_back.classed("highlight", true);
    })
    .on("mousemove", function (e) {
      let cid = "cid" + _chart_object.indexOf(current_canvas_object);
      if (
        d3.select(`.dragHint.${cid}`).node() &&
        d3.select(`.dragHint.${cid}`).style("display") != "none"
      ) {
        moveHint(current_canvas_object, e);
      }
    })
    .on("mouseleave", function () {
      clearTimeout(timerAxisXY);
      removeHint(current_canvas_object);
      axis_back.classed("highlight", false);
    })
    .on("contextmenu", sorted_axis)
    .call(
      d3
        .zoom()
        .on("start", zoom_axis_start)
        .on("zoom", zoom_axis_ing)
        .on("end", function (e, d) {
          zoom_axis_ing(e, d);
          let current_action = { type: "change_scale" };
          current_action.scale_type = axis.scale_type;
          current_action.start_point = { x: e.x, y: e.y };
          current_action.end_point = { x: e.x, y: e.y };
          current_action.axis_direction = axis.type;
          current_action.canvas_id = _chart_object.indexOf(
            current_canvas_object
          );
          current_action.axis_id =
            current_canvas_object[`${axis.type}_axis_object_list`].indexOf(
              current_axis_object
            );

          if (axis.scale_type === "linear") {
            let tmp_small_pixel = axis.range.begin;
            let tmp_larger_pixel = axis.range.end;
            let tmp_scale = d3
              .scaleLinear()
              .domain([
                current_scale.invert(tmp_small_pixel),
                current_scale.invert(tmp_larger_pixel),
              ]);

            current_action.range = current_scale.range();
            current_action.domain = current_scale.domain();
            action_list.push(current_action);

            new_ticks = tmp_scale.ticks(original_tick_num);
            add_new_ticks(
              current_scale,
              new_ticks,
              (scale_type = axis.scale_type)
            );
          } else if (axis.scale_type === "time") {
            let current_k = e.transform.k;
            let resize = last_k / current_k;

            let new_date_begin = new Date(
              zoom_point_value.getTime() +
                (new Date(axis.value_range[0]).getTime() -
                  zoom_point_value.getTime()) *
                  resize
            );
            let new_date_end = new Date(
              zoom_point_value.getTime() +
                (new Date(axis.value_range[1]).getTime() -
                  zoom_point_value.getTime()) *
                  resize
            );
            current_action.range = current_scale.range();
            console.log("current_action.range", current_action.range);
            current_action.domain = [
              current_scale.domain()[0].getTime(),
              current_scale.domain()[1].getTime(),
            ];
            action_list.push(current_action);
            var ticks = current_scale.ticks(original_tick_num);
            add_new_ticks(current_scale, ticks, (scale_type = axis.scale_type));
            // console.log(formattedTicks);
            window._current_scale = current_scale;
            axis.value_range[0] =
              moment(new_date_begin).format("YYYY-MM-DD h:mm:ss");
            axis.value_range[1] =
              moment(new_date_end).format("YYYY-MM-DD h:mm:ss");
          }
          current_canvas_object.restart_all_simulations();
        })
    );

  function sorted_axis(e) {
    console.log("contextmenu!!!!");
    e.preventDefault();
    if (axis.scale_type !== "quantize") {
      return;
    }
    let value_array = get_sorted_value();
    let chosen_attr = choose_max_difference(value_array);
    value_array.sort(
      (item1, item2) => -item1[chosen_attr] + item2[chosen_attr]
    );
    update_quantize_end(
      value_array.map((d) => d.value),
      (reverse = true)
    );
    console.log("value_array", value_array);
  }

  this.auto_sorted_axis = function () {
    if (axis.scale_type !== "quantize") {
      return;
    }
    let value_array = get_sorted_value();
    window._value_array = value_array;
    let chosen_attr = choose_max_difference(value_array);
    value_array.sort((item1, item2) => item1[chosen_attr] - item2[chosen_attr]);
    console.log("value_array", value_array);
    update_quantize_end(
      value_array.map((d) => d.value),
      (reverse = false)
    );
  };

  this.begin_change_axis = function () {
    current_canvas_object.stop_all_simulation();
    current_axis_object.control_coordinate.forEach((d) =>
      d.update_data_value_hard((direction = axis.type))
    );
  };
  this.end_change_axis = function () {};

  function choose_max_difference(value_array) {
    let max_list = value_array
      .filter((d) => d.max_value > -999)
      .map((d) => d.max_value);
    let min_list = value_array
      .filter((d) => d.min_value < 99999)
      .map((d) => d.min_value);
    let lum_list = value_array
      .filter((d) => d.color > -0.5)
      .map((d) => d.color);
    let diff_list = value_array.filter((d) => d.diff > -999).map((d) => d.diff);

    let diff_max = Math.max(...max_list) - Math.min(...max_list);
    let diff_min = Math.max(...min_list) - Math.min(...min_list);
    let diff_lum = Math.max(...lum_list) - Math.min(...lum_list);
    let diff_diff = Math.max(...diff_list) - Math.min(...diff_list);

    if (diff_max > 5 && diff_min > 5) {
      if (diff_diff > 5) return "diff";
      else return "max_value";
    } else if (diff_max > 5) return "max_value";
    else if (diff_min > 5) return "min_value";
    else return "color";
  }

  function get_sorted_value() {
    let should_value = `should_${axis.type}_value`;
    let value_array = axis.value_range.map(function (d) {
      let current_item = new Array();
      current_item["value"] = d;
      return current_item;
    });
    console.log("value_array", value_array);
    current_axis_object.control_coordinate.forEach(function (d) {
      let control_point = d.control_point;
      let visual_object = d.visual_object;
      visual_object.forEach(function (vo) {
        if (!vo.activate) return;
        if (!vo.selected) return;
        if (vo.type === "line") return;
        console.log(vo);
        let first_point = control_point[vo.control_point[0]];
        if (!(should_value in first_point)) return;
        let current_value = first_point[should_value];
        let value_index = axis.value_range.indexOf(current_value);

        if (!("visual_object" in value_array[value_index]))
          value_array[value_index]["visual_object"] = [];
        if (!("control_point" in value_array[value_index]))
          value_array[value_index]["control_point"] = [];

        value_array[value_index]["visual_object"].push(vo);
        for (let pid of vo.control_point) {
          let cp = control_point[pid];
          value_array[value_index]["control_point"].push(cp);
        }
      });
      console.log("value array ", value_array);
    });
    let per_direct = axis.type == "y" ? "x" : "y";
    window._value_array = value_array;
    value_array = value_array.filter((d) => d.control_point.length > 0);
    value_array.forEach(function (d) {
      if ("control_point" in d) {
        d.max_value = Math.max(
          ...d.control_point.map((p) => p[`show_${per_direct}`])
        );
        d.min_value = Math.min(
          ...d.control_point.map((p) => p[`show_${per_direct}`])
        );
        d.color = Math.min(
          ...d.visual_object.map(function (vo) {
            if (typeof vo["fill"] === "string" || vo["fill"] === undefined)
              return -1;
            else {
              console.log(vo["fill"]);
              return rgbToHsl(...vo["fill"])[2];
            }
          })
        );
      } else {
        d.max_value = -10000;
        d.min_value = 10000000;
        d.color = 1000;
      }
      d.diff = d.max_value - d.min_value;
    });
    return value_array;
  }

  function zoom_axis_start(e, _d) {
    current_axis_object.begin_change_axis();
    last_k = e.transform.k;
    ori_k = e.transform.k;
    let current_point = get_source_point(e);
    if (axis.type === "x")
      zoom_point =
        current_point.clientX -
        current_canvas_object.plot_area.x -
        main_canvas_trans.x -
        chart_margin.x;
    else
      zoom_point =
        current_point.clientY -
        current_canvas_object.plot_area.y -
        main_canvas_trans.y -
        chart_margin.y;

    zoom_point = zoom_point / current_canvas_object.global_resize;
    if (axis.scale_type === "linear" || axis.scale_type === "time") {
      zoom_point_value = current_scale.invert(zoom_point);
    } else {
      current_canvas_object.restart_all_simulations();
    }
  }

  function zoom_axis_ing(e, _d) {
    let current_k = e.transform.k;
    let resize;

    if (axis.scale_type === "linear") {
      resize = last_k / current_k;
      last_k = current_k;

      console.log("zoom point value", zoom_point_value);

      axis.value_range[0] =
        zoom_point_value + (axis.value_range[0] - zoom_point_value) * resize;
      axis.value_range[1] =
        zoom_point_value + (axis.value_range[1] - zoom_point_value) * resize;

      current_scale
        .domain([axis.value_range[0], axis.value_range[1]]) // The value domain
        .range(axis.pixel_domain);
    } else if (axis.scale_type === "time") {
      // let current_k = e.transform.k
      resize = last_k / current_k;

      let new_date_begin = new Date(
        zoom_point_value.getTime() +
          (new Date(axis.value_range[0]).getTime() -
            zoom_point_value.getTime()) *
            resize
      );
      let new_date_end = new Date(
        zoom_point_value.getTime() +
          (new Date(axis.value_range[1]).getTime() -
            zoom_point_value.getTime()) *
            resize
      );
      // console.log("date???", new_date_begin, new_date_end);

      current_scale
        .domain([new_date_begin, new_date_end]) // The value domain
        .range(axis.pixel_domain);
    } else {
      resize = last_k / current_k;
      last_k = current_k;
    }
    current_axis_object.control_coordinate.forEach(function (coordinate) {
      coordinate.update_simulation_tick();
    });
    update_info(current_scale, resize);
  }

  function quantize_resize(resize = 1) {
    current_axis_object.control_coordinate.forEach(function (coordinate) {
      coordinate.update_fixed_size(resize, (direction = axis.type));
    });
  }

  this.quantize_resize = quantize_resize;

  function update_info(new_scale, resize = 1) {
    if (axis.scale_type === "linear") {
      update_tick_position(new_scale, tick);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale_light(new_scale, (direction = axis.type));
      });
    } else if (axis.scale_type === "time") {
      update_tick_position(new_scale, tick);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale_light(new_scale, (direction = axis.type));
      });
    } else {
      quantize_resize(resize);
    }
  }

  if (axis.scale_type === "linear" || axis.scale_type === "time") {
    tick_text = axis.tick.filter((d) => d.origin !== undefined);
    original_tick_num = tick_text.length;
    if (original_tick_num < 5) {
      original_tick_num += 1;
    }

    tick = axis_canvas
      .selectAll(".tick")
      .data(tick_text)
      .enter()
      .append("g")
      .attr("id", (_d, i) => `tick_${i}`)
      .classed("tick", true)
      .attr("transform", (d) => `translate(${d.position.x},${d.position.y})`)
      .each((d) => (d.value = current_scale.invert(d.position[axis.type])));

    tick.html((d) => d.origin);
    drag_tick(tick);
  } else if (axis.scale_type === "quantize") {
    tick_text = axis.tick.filter((d) => d.origin !== undefined);
    tick = axis_canvas
      .selectAll(".tick")
      .data(tick_text)
      .enter()
      .append("g")
      .attr("id", (_d, i) => `tick_${i}`)
      .classed("tick", true)
      .attr("transform", (d) => `translate(${d.position.x},${d.position.y})`)
      .each((d) => (d.value = current_scale(d.position[axis.type])))
      .each(function (d) {
        d3.select(this).classed(d.value, true);
      });
    tick.html((d) => d.origin);
    drag_tick(tick);
  }

  let start_position;
  let start_tick_position;

  function drag_tick_start(e, d) {
    start_position = { x: e.x, y: e.y };
    start_tick_position = { x: d.position.x, y: d.position.y };
    current_axis_object.control_coordinate.forEach((d) =>
      d.update_data_value_hard((direction = axis.type))
    );
    current_canvas_object.stop_all_simulation();
    if (axis.scale_type === "linear") {
      let end1 = axis.value_range[0];
      let end2 = axis.value_range[1];
      let inter = end2 - end1;
      end1 = end1 - inter / 2;
      end2 = end2 + inter / 2;
      console.log("end1, end2", end1, end2);

      fixed_point_value = 0;

      let min_value = Math.abs(
        current_scale(fixed_point_value) - current_scale(d.value)
      );
      console.log("min value", min_value);

      if (end1 * end2 > 0) {
        // choose the farther one
        fixed_point_value = axis.value_range[0];
        if (
          Math.abs(d.value - axis.value_range[1]) >
          Math.abs(d.value - axis.value_range[0])
        )
          fixed_point_value = axis.value_range[1];
      }
      if (
        Math.abs(current_scale(fixed_point_value) - current_scale(d.value)) < 5
      ) {
        fixed_point_value = axis.value_range[0];
        if (
          Math.abs(d.value - axis.value_range[1]) >
          Math.abs(d.value - axis.value_range[0])
        )
          fixed_point_value = axis.value_range[1];
      }

      // current_axis_object.control_coordinate.forEach(d=>d.update_data_value(direction = axis.type))
    } else if (axis.scale_type === "time") {
      let end1_time = new Date(axis.value_range[0]);
      let end2_time = new Date(axis.value_range[1]);
      fixed_point_value = end1_time;

      if (Math.abs(d.value - end2_time) > Math.abs(d.value - end1_time))
        fixed_point_value = end2_time;

      console.log("fixed point", fixed_point_value);
    }
  }

  function drag_tick_move(e, d) {
    change_distance = e[axis.type] - start_position[axis.type];
    if (axis.scale_type === "linear" || axis.scale_type === "time") {
      let fixed_point_pixel = current_scale(fixed_point_value);
      let current_pixel = d.position[axis.type] + change_distance;

      let new_scale = d3
        .scaleLinear()
        .domain([fixed_point_value, d.value])
        .range([fixed_point_pixel, current_pixel]);

      update_tick_position(new_scale, tick);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale_light(new_scale, (direction = axis.type));
        coordinate.update_simulation_tick();
      });
    } else {
      d3.select(this).attr("transform", function (_d) {
        if (axis.type === "x") {
          return `translate(${start_tick_position.x + change_distance},${
            start_tick_position.y
          })`;
        } else {
          return `translate(${start_tick_position.x}, ${
            start_tick_position.y + change_distance
          })`;
        }
      });
      d.position[axis.type] = start_tick_position[axis.type] + change_distance;
    }
  }

  this.update_axis_by_new_scale = function (new_scale) {
    let interspace = { x: "width", y: "height" };
    axis.pixel_domain[0] = axis.area[axis.type];
    axis.pixel_domain[1] =
      axis.area[axis.type] + axis.area[interspace[axis.type]];
    axis.value_range[0] = new_scale.invert(axis.pixel_domain[0]);
    axis.value_range[1] = new_scale.invert(axis.pixel_domain[1]);
    current_scale.domain(axis.value_range).range(axis.pixel_domain);
    new_ticks = current_scale.ticks(original_tick_num);
    add_new_ticks(current_scale, new_ticks, axis.scale_type);
    current_axis_object.control_coordinate.forEach(function (coordinate) {
      coordinate.update_simulation_tick();
    });
    update_info(new_scale, 1);
  };

  this.update_time_axis = function (time_range, total_time = 1000, step = 50) {
    console.log(current_scale.domain());
    let original_range = current_scale.domain().map((d) => Date.parse(d));
    time_range = time_range.map((d) => Date.parse(d));
    let scale_list = new Array();
    for (let i = 0; i < step; i++) {
      scale_list.push([
        original_range[0] +
          ((time_range[0] - original_range[0]) / step) * (i + 1),
        original_range[1] +
          ((time_range[1] - original_range[1]) / step) * (i + 1),
      ]);
    }

    scale_list.forEach(function (d, i) {
      setTimeout(function () {
        axis.value_range[0] = new Date(d[0]);
        axis.value_range[1] = new Date(d[1]);
        console.log("time_range", i, axis.value_range);
        current_scale.domain(axis.value_range).range(axis.pixel_domain);
        new_ticks = current_scale.ticks(original_tick_num);
        add_new_ticks(current_scale, new_ticks, axis.scale_type);
        current_axis_object.control_coordinate.forEach(function (coordinate) {
          coordinate.update_simulation_tick();
        });
        update_info(current_scale, 1);
      }, (i * total_time) / step);
    });
  };

  this.remove_quantize_range = function (value_list) {
    console.log(`remove ${value_list}`);
    if (axis.scale_type != "quantize") return;
    this.begin_change_axis();
    let new_range = axis.value_range.filter((x) => !value_list.includes(x));
    console.log(`new range: ${new_range}`);
    update_quantize_end(new_range, (reverse = false));
  };

  function drag_tick_end(e, d) {
    change_distance = e[axis.type] - start_position[axis.type];

    let current_action = { type: "change_scale" };
    current_action.scale_type = axis.scale_type;
    current_action.start_point = start_position;
    current_action.end_point = { x: e.x, y: e.y };
    current_action.axis_direction = axis.type;
    current_action.canvas_id = _chart_object.indexOf(current_canvas_object);
    current_action.axis_id =
      current_canvas_object[`${axis.type}_axis_object_list`].indexOf(
        current_axis_object
      );

    if (axis.scale_type === "linear") {
      let fixed_point_pixel = current_scale(fixed_point_value);
      let current_pixel = d.position[axis.type] + change_distance;
      let new_scale = d3
        .scaleLinear()
        .domain([fixed_point_value, d.value])
        .range([fixed_point_pixel, current_pixel]);

      current_action.domain = [fixed_point_value, d.value];
      current_action.range = [fixed_point_pixel, current_pixel];

      let interspace = { x: "width", y: "height" };
      axis.pixel_domain[0] = axis.area[axis.type];
      axis.pixel_domain[1] =
        axis.area[axis.type] + axis.area[interspace[axis.type]];

      axis.value_range[0] = new_scale.invert(axis.pixel_domain[0]);
      axis.value_range[1] = new_scale.invert(axis.pixel_domain[1]);

      current_scale.domain(axis.value_range).range(axis.pixel_domain);

      new_ticks = current_scale.ticks(original_tick_num);
      add_new_ticks(current_scale, new_ticks);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale(current_scale, (direction = axis.type));
        coordinate.update_simulation_tick();
      });
      current_canvas_object.restart_all_simulations();
    } else if (axis.scale_type === "time") {
      let current_value = d.value;
      console.log("fixed point value", fixed_point_value);
      console.log("current_value", current_value);

      let fixed_point_pixel = current_scale(fixed_point_value);
      let current_pixel = d.position[axis.type] + change_distance;

      console.log("fixed point pixel", fixed_point_pixel);
      console.log("current_value pixel", current_pixel);
      let new_scale = d3
        .scaleTime()
        .domain([fixed_point_value, d.value])
        .range([fixed_point_pixel, current_pixel]);

      current_action.domain = [fixed_point_value.getTime(), d.value.getTime()];
      current_action.range = [fixed_point_pixel, current_pixel];

      let end0_time = new Date(axis.value_range[0]);
      let end1_time = new Date(axis.value_range[1]);

      axis.pixel_domain[0] = new_scale(end0_time);
      axis.pixel_domain[1] = new_scale(end1_time);

      console.log("left pixel", axis.pixel_domain[0]);
      console.log("right pixel", axis.pixel_domain[1]);

      console.log("value ", axis.value_range);
      current_scale.domain([end0_time, end1_time]).range(axis.pixel_domain);
      update_tick_position(current_scale, tick);
      update_tick_data(current_scale, tick);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale_light(new_scale, (direction = axis.type));
        coordinate.update_simulation_tick();
      });
      current_canvas_object.restart_all_simulations();
    } else if (axis.scale_type === "quantize") {
      window._tick_text = tick_text;

      let axis_tick = tick_text
        .filter((d) => axis.value_range.includes(d.value))
        .map(function (d) {
          let current_obj = new Array();
          current_obj["value"] = d.value;
          current_obj["attr_position"] = d.position[axis.type];
          return current_obj;
        });
      console.log("axis_tick", axis_tick);
      axis_tick.sort((a, b) => a.attr_position - b.attr_position);
      new_range = axis_tick.map((d) => d.value);

      window._axis_tick = axis_tick;
      new_scale = update_quantize_end(new_range, (reverse = false));
      current_action.domain = new_scale.domain();
      current_action.range = new_scale.range();
      setTimeout(function () {
        current_canvas_object.restart_all_simulations();
      }, 500);
    }
    action_list.push(current_action);
  }

  this.simulate_update_scale = function (current_action) {
    current_canvas_object.stop_all_simulation();
    if (axis.scale_type === "linear") {
      let new_scale = d3
        .scaleLinear()
        .domain(current_action.domain)
        .range(current_action.range);
      axis.value_range[0] = new_scale.invert(axis.pixel_domain[0]);
      axis.value_range[1] = new_scale.invert(axis.pixel_domain[1]);
      current_scale.domain(axis.value_range).range(axis.pixel_domain);
      new_ticks = current_scale.ticks(original_tick_num);
      add_new_ticks(current_scale, new_ticks);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale(current_scale, (direction = axis.type));
        coordinate.update_simulation_tick_move();
      });
    } else if (axis.scale_type === "time") {
      let new_scale = d3
        .scaleTime()
        .domain([
          new Date(current_action.domain[0]),
          new Date(current_action.domain[1]),
        ])
        .range(current_action.range);
      let end0_time = new Date(axis.value_range[0]);
      let end1_time = new Date(axis.value_range[1]);
      axis.pixel_domain[0] = new_scale(end0_time);
      axis.pixel_domain[1] = new_scale(end1_time);
      current_scale.domain([end0_time, end1_time]).range(axis.pixel_domain);
      update_tick_position(current_scale, tick);
      update_tick_data(current_scale, tick);
      current_axis_object.control_coordinate.forEach(function (coordinate) {
        coordinate.update_new_scale_light(new_scale, (direction = axis.type));
        coordinate.update_simulation_tick_move();
      });
    } else if (axis.scale_type === "quantize") {
      new_range = current_action.range;
      update_quantize_end(new_range, (reverse = false));
    }
    setTimeout(function () {
      current_canvas_object.restart_all_simulations();
      action_list.push(current_action);
    }, 500);
  };

  function update_quantize_end(new_range, reverse = false) {
    function check_two_range(a_range, b_range) {
      if (a_range.length !== b_range.length) return false;
      let num = a_range.length;
      for (let i = 0; i < num; i++) {
        if (a_range[i] !== b_range[i]) return false;
      }
      return true;
    }
    if (reverse) {
      if (check_two_range(axis.value_range, new_range)) new_range.reverse();
    }
    // new_range.reverse()
    axis.value_range = new_range;
    current_scale
      .range(axis.value_range) // The value domain
      .domain(axis.pixel_domain);

    tick_text.forEach(function (d) {
      if (axis.value_range.includes(d.value)) {
        let extent = current_scale.invertExtent(d.value);
        d.position[axis.type] = (extent[0] + extent[1]) / 2;
      } else {
        d.position[axis.type] = 0;
      }
    });

    tick.attr("opacity", (d) => (new_range.includes(d.value) ? 1 : 0));

    tick
      .transition()
      .duration(100)
      .attr("transform", (d) => `translate(${d.position.x},${d.position.y})`);
    current_axis_object.control_coordinate.forEach(function (coordinate) {
      coordinate.update_new_scale(current_scale, (direction = axis.type));
    });
    return current_scale;
  }

  function update_tick_data(current_scale, tick) {
    tick.attr("transform", function (d) {
      d.position[axis.type] = current_scale(d.value);
      return `translate(${d.position.x},${d.position.y})`;
    });
  }

  function update_tick_position(new_scale, tick) {
    // Update tick position according to new scale
    tick.attr("transform", function (d) {
      if (axis.type === "y") {
        return `translate(${d.position.x},${new_scale(d.value)})`;
      } else {
        return `translate(${new_scale(d.value)},${d.position.y})`;
      }
    });
  }

  function add_new_ticks(current_scale, new_ticks, scale_type = "linear") {
    let text_template = tick_text[0].origin;
    let another_attr = "y";
    if (axis.type === "y") another_attr = "x";

    let another_position = tick_text[0].position[another_attr];

    let ticks = new_ticks.map(function (d) {
      let current_tick = {};
      current_tick["position"] = {};
      current_tick["position"][another_attr] = another_position;
      current_tick["position"][axis.type] = current_scale(d);
      current_tick["value"] = d;
      current_tick["text"] = d;
      if (scale_type == "time") {
        const formatTime = d3.timeFormat("%Y-%m-%d");
        current_tick["text"] = formatTime(d);
      }
      return current_tick;
    });

    axis_canvas.selectAll(".tick").remove();

    tick = axis_canvas
      .selectAll(".tick")
      .data(ticks)
      .enter()
      .append("g")
      .attr("id", (_d, i) => "tick_" + i)
      .classed("tick", true)
      .attr("transform", (d) => `translate(${d.position.x},${d.position.y})`);
    tick.html((_d) => text_template);
    tick.select("text").text((d) => axis.prefix + d.text + axis.suffix);
    tick.each(function (d) {
      d.origin = this.innerHTML;
    });
    axis.tick = ticks;
    drag_tick(tick);
  }
};

function getformatString(dates) {
  const formats = ["%Y", "%Y-%m", "%Y-%m-%d"];
  const zeroTime = "T00:00:00Z";
  const datesLen = dates.length;
  let formatIndex = 0;

  for (let i = 0; i < datesLen; i++) {
    const date = new Date(dates[i]);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    if (hour === 0 && minute === 0) {
      formatIndex = 2;
    } else if (date.getUTCDate() === 1) {
      formatIndex = 1;
    } else {
      formatIndex = 0;
    }
    if (i === 0) {
      var dateFormatter = d3.timeFormat(formats[formatIndex]);
      var result = dateFormatter(date);
    } else {
      var dateFormatter = d3.timeFormat(formats[formatIndex]);
      var result = result + "," + dateFormatter(date);
    }
  }
  return result;
}
