function filter(chart_object, value) {
  console.log(Value);
  let parsed_data = chart_object.chart_json.parsed_data;
  let chosen_mapping_list = parsed_data.mapping.filter(
    (d) => d.value_range.indexOf(value) > -1
  );
  if (chosen_mapping_list.length === 0) {
    return;
  }
  let chosen_mapping = chosen_mapping_list[0];
  let chosen_key = `${chosen_mapping.type} value`;
  let data_list = parsed_data.data_list;
  let chosen_direction = chosen_mapping.direction;
  let visual_object_id_list = data_list
    .filter((d) => d[chosen_key] === value)
    .map((d) => d.related_vo);

  highlight_visual_object(chart_object, visual_object_id_list);
}

function filter_value_list(chart_object, value_list) {
  let parsed_data = chart_object.chart_json.parsed_data;
  let chosen_mapping_list = parsed_data.mapping.filter(
    (d) => d.value_range.indexOf(value_list[0]) > -1
  );
  let chosen_mapping = chosen_mapping_list[0];
  let chosen_key = `${chosen_mapping.type} value`;
  console.log("chosen_key", chosen_key);
  let data_list = parsed_data.data_list;
  let visual_object_id_list = data_list
    .filter((d) => value_list.includes(d[chosen_key]))
    .map((d) => d.related_vo);
  highlight_visual_object(chart_object, visual_object_id_list);

  let other_visual_object_id_list = data_list
    .filter((d) => !value_list.includes(d[chosen_key]))
    .map((d) => d.related_vo);
  let chosen_direction = chosen_mapping.direction;
  setTimeout(function () {
    delete_visual_object(
      chart_object,
      chosen_direction,
      other_visual_object_id_list
    );
  }, 1000);

  setTimeout(function () {
    auto_change_quantitative_scale(chart_object, "y");
  }, 2000);
}

function compare_visual_objects(
  chart_object,
  compare_filter_value_list,
  other_filters = []
) {
  let parsed_data = chart_object.chart_json.parsed_data;
  console.log("Compare compare", compare_filter_value_list);

  let chosen_mapping_list = parsed_data.mapping.filter(
    (d) => d.value_range.indexOf(compare_filter_value_list[0]) > -1
  );
  let chosen_mapping = chosen_mapping_list[0];
  let chosen_key = `${chosen_mapping.type} value`;
  console.log("chosen_key", chosen_key);
  let data_list = parsed_data.data_list;
  let visual_object_id_list = data_list
    .filter((d) => compare_filter_value_list.includes(d[chosen_key]))
    .map((d) => d.related_vo);

  highlight_visual_object(chart_object, visual_object_id_list);

  let other_visual_object_id_list = data_list
    .filter((d) => !compare_filter_value_list.includes(d[chosen_key]))
    .map((d) => d.related_vo);

  let chosen_direction = chosen_mapping.direction;
  setTimeout(function () {
    delete_visual_object(
      chart_object,
      chosen_direction,
      other_visual_object_id_list
    );
  }, 1000);

  setTimeout(function () {
    chart_object.x_axis_object_list[0].quantize_resize((resize = 0.7));
    chart_object.CoordSys[0].change_stack_order("x");
  }, 2000);

  setTimeout(function () {
    auto_change_quantitative_scale(chart_object, "y");
  }, 3000);
}

function delete_visual_object(
  chart_object,
  chosen_direction,
  visual_object_id
) {
  if (chosen_direction === "legend") {
    chart_object.CoordSys[0].delete_visual_objects(visual_object_id);
  } else {
    chart_object.CoordSys[0].deactivate_visual_objects(visual_object_id);
    let chosen_axis = chart_object[`${chosen_direction}_axis_object_list`][0];
    chosen_axis.remove_quantize_range([value]);
  }
}

function highlight_visual_object(chart_object, visual_object_id) {
  chart_object.brush_selected = true;
  console.log("visual_object_id", visual_object_id);
  chart_object.CoordSys[0].visual_object.forEach(function (d) {
    let selected = visual_object_id.includes(d.id);
    d.selected = selected;
    d.control_point.forEach(
      (p) => (chart_object.CoordSys[0].control_point[p].selected = selected)
    );
  });
  chart_object.update_highlight();
}

function auto_sort_axis(chart_object, direction = "y") {
  let chosen_axis_list = chart_object[`${direction}_axis_object_list`];
  if (chosen_axis_list.length === 0) {
    return;
  }
  let chosen_axis = chosen_axis_list[0];
  chosen_axis.begin_change_axis();
  console.log("Chosen_axis", chosen_axis);
  chosen_axis.auto_sorted_axis();
}

function auto_change_quantitative_scale(chart_object, direction = "y") {
  chart_object.chart_json.parsed_data;
  let position_list = chart_object.CoordSys[0].control_point
    .filter((d) => d.activate)
    .map((d) => d[direction]);
  let min_position = Math.min(...position_list);
  let max_position = Math.max(...position_list);
  let chosen_axis_list = chart_object[`${direction}_axis_object_list`];
  if (chosen_axis_list.length === 0) {
    return;
  }
  window._chosen_axis = chosen_axis_list[0]
  let chosen_axis = chosen_axis_list[0];
  let interspace = { x: "width", y: "height" };
  let min_axis_position = chosen_axis.axis.area[direction];
  let max_axis_position = chosen_axis.axis.area[interspace[direction]];

  let stable_point = min_position;
  let changed_point = max_position;
  let changed_after_point = max_axis_position;
  if (
    Math.abs(max_position - max_axis_position) <
    Math.abs(min_position - min_axis_position)
  ) {
    stable_point = max_position;
    changed_point = min_position;
    changed_after_point = min_axis_position;
  }

  let stable_value = chosen_axis.scale.invert(stable_point);
  let changed_value = chosen_axis.scale.invert(changed_point);

  console.log("begin", stable_value, changed_value);
  if (stable_value * changed_value < 0 || stable_value / changed_value < 0.3) {
    changed_value =
      Math.max(changed_value) > Math.max(stable_value)
        ? changed_value
        : stable_value;
    stable_value = 0;
    stable_point = chosen_axis.scale(stable_value);
    changed_point = chosen_axis.scale(changed_value);
    changed_after_point =
      changed_point > stable_point ? max_axis_position : min_axis_position;
  } else if (changed_value / stable_point < 0.3) {
    changed_value =
      Math.max(changed_value) > Math.max(stable_value)
        ? changed_value
        : stable_value;
    stable_value = 0;
    stable_point = chosen_axis.scale(stable_value);
    changed_point = chosen_axis.scale(changed_value);
    changed_after_point =
      changed_point > stable_point ? max_axis_position : min_axis_position;
  }

  console.log("stable changed", stable_value, changed_value);

  chart_object.CoordSys[0].update_data_value((direction = "y"));
  chart_object.CoordSys[0].update_data_value((direction = "x"));

  if (chosen_axis.axis.scale_type === "linear") {
    chosen_axis.begin_change_axis();
    let interpolate_num = 100;
    let new_scale_list = d3.range(1, interpolate_num + 1).map(function (d) {
      return d3
        .scaleLinear()
        .domain([stable_value, changed_value])
        .range([
          stable_point,
          changed_point +
            ((changed_after_point - changed_point) / interpolate_num) * d,
        ]);
    });
    console.log(new_scale_list.map(d => d.range()));

    new_scale_list.forEach(function (new_scale, i) {
      setTimeout(function () {
        chosen_axis.update_axis_by_new_scale(new_scale);
      }, i * 10);
    });
    setTimeout(function () {
      chart_object.restart_all_simulations();
    }, interpolate_num * 10);
  }
}

// auto_time_resize(_chart_object[0], time_range = [new Date(String(time_range[0])), new Date(String(time_range[1]))];)

function auto_time_resize(
  chart_object,
  time_range_list,
  direction = "x",
  total_time = 1000
) {
  let chosen_axis_list = chart_object[`${direction}_axis_object_list`];
  if (chosen_axis_list.length === 0) {
    return;
  }

  let time_range = [
    new Date(String(time_range_list[0])),
    new Date(String(time_range_list[1])),
  ];
  console.log(time_range);
  // time_range = [
  //   new Date(String(time_range[0])),
  //   new Date(String(time_range[1])),
  // ];
  let chosen_axis = chosen_axis_list[0];
  chosen_axis.update_time_axis(
    time_range,
    (total_time = total_time),
    (step = 10)
  );
}
