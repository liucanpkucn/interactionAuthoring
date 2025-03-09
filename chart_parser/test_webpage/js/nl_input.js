// const { expandGlob } = require("jslint/lib/main");

function relativeTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else {
    return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }
}

function init_question_box() {
  // let question_container = d3
  //   .select("body")
  //   .append("div")
  //   .attr("class", "question_container");
  // let question_box = question_container
  //   .append("input")
  //   .attr("class", "question_box")
  //   .attr("placeholder", "Input your natural langauge question here")
  //   .on("keypress", function (e, d) {
  //     if (e.key != "Enter") return;
  //     console.log(this.value);
  //     ask_a_question(this.value);
  //     $(this).val("");
  //   });
}

function ask_nl_mani_question(question) {
  let attributes = [];
  let mapping = _chart_object[0].chart_json.parsed_data.mapping;
  let type_dict = {
    K: "categorical",
    C: "categorical",
    O: "temporal",
    Q: "quantitative",
  };
  let name_dict = { K: "choice", C: "choice", O: "span", Q: "range" };
  for (let map of mapping) {
    for (let i in map["value_range"]) {
      map["value_range"][i] = String(map["value_range"][i]);
    }
    let attribute = { type: type_dict[map["type"]], name: map["name"] };
    attribute[name_dict[map["type"]]] = map["value_range"];
    attributes.push(attribute);
  }
  let send_data = {
    sentence: question,
    attributes: attributes,
  };
  console.log(JSON.stringify(send_data));
  get_question_result(send_data);
}

function get_question_result(send_data) {
  $.ajax({
    type: "POST",
    // url: "http://115.27.161.150/nl_mani/parse_question?=",
    // url: "http://localhost:12467/parse_question?=",
    url: "http://localhost:23578/parse_question?=",
    crossDomain: true,
    data: { data: JSON.stringify(send_data) },

    success: function (response_data) {
      // console.log(response_data);
      // console.log(response_data.output[0]);
      // example = {
      //   type: "compare",
      //   result: { attr: "Nevada | Florida" },
      //   "compare filters": [
      //     { op: "=", attr: "Products", values: ["Nevada", "Florida"] },
      //   ],
      // };

      // let parsed_result = query_string_parse(response_data.output[0]);

      // console.log(parsed_result);
      console.log(response_data);
      parse_json_input(response_data);

      // if (parsed_result.hasOwnProperty("shared filters")) {
      //   filter_value_list(
      //     _chart_object[0],
      //     parsed_result["shared filters"][0].values
      //   );
      // }

      // if (parsed_result.hasOwnProperty("compare filters")) {
      //   console.log("Compare filters");
      //   compare_visual_objects(
      //     _chart_object[0],
      //     parsed_result["compare filters"][0].values
      //   );
      // } else if (response_data.filters[0].filter_value.length === 1) {
      //   filter_value_list(
      //     _chart_object[0],
      //     response_data.filters[0].filter_value
      //   );
      // } else {
      //   compare_visual_objects(
      //     _chart_object[0],
      //     response_data.filters[0].filter_value
      //   );
      // }
    },
    error: function (jqXHR) {
      // $('.loading').hide()
      alert("There is something wrong with our server.");
    },
  });
}

// input_data = {
//   "identify": "Product",
//   "filter": [
//     {
//       "attr": "revenue",
//       "op": "=",
//       "value":{
//         "operation": "max",
//         "attribute": "Revenue"
//       }
//     }
//   ]
// }
// input_data = {
//   "trend": "value",
//   "filter": [
//     {
//       "attr": "time",
//       "op": "in",
//       "value": [
//         1970,
//         2050
//       ]
//     },
//     {
//       "attr": "K",
//       "op": "=",
//       "value": {
//         "operation" : 'max',
//         "attribute" : 'value'
//       }
//     }
//   ]
// }
// input_data = {
//   "identify": "value",
//   "filter": [
//     {
//       "attr": "C",
//       "op": "in",
//       "value": [
//         "Arizona",
//         "Nevada",
//         "Texas"
//       ]
//     }
//   ]
// }
// input_data = {
//   "identify": "value",
//   "filter": [
//     {
//       "attr": "Products",
//       "op": "in",
//       "value": [
//         "Foundation",
//         "Eyeliner",
//         "Powder"
//       ]
//     }
//   ]
// }

function test_parse_json(idx = 1) {
  // let input_data = {
  //   "identify": "value",
  //   "filter": [
  //       {
  //           "attr": "K",
  //           "op": "=",
  //           "value": "Category_2"
  //       }
  //   ]
  // }
  // let input_data = {
  //     "compare": "value",
  //     "list": [
  //         {
  //             "identify": "value",
  //             "filter": [
  //                 {
  //                     "attr": "K",
  //                     "op": "=",
  //                     "value": "Civil conflicts with foreign state intervention "
  //                 }
  //             ]
  //         },
  //         {
  //             "identify": "value",
  //             "filter": [
  //                 {
  //                     "attr": "K",
  //                     "op": "=",
  //                     "value": "Civil conflicts without foreign state intervention "
  //                 }
  //             ]
  //         }
  //     ]
  // }
  // input_data = {
  //   "trend": "value",
  //   "filter": [
  //     {
  //       "attr": "time",
  //       "op": "in",
  //       "value": [
  //         1970,
  //         2050
  //       ]
  //     },
  //     {
  //       "attr": "K",
  //       "op": "=",
  //       "value": "Category_4"
  //     }
  //   ]
  // }
  // let input_data = {
  //   "identify": "category",
  //   "filter": [
  //     {
  //       "attr": "time",
  //       "op": "in",
  //       "value": [2021, 2022]
  //     },
  //     {
  //       "attr": "category",
  //       "op": "in",
  //       "value": ["Canada", "India", "Italy"]
  //     }
  //   ]
  // };

  let Q2_input_data = {
    identify: "category",
    filter: [
      {
        attr: "time",
        op: "=",
        value: "2022-01-06",
      },
      {
        attr: {
          operation: "rank",
          attribute: "7-day rolling",
        },
        op: "in",
        value: [0, 2],
      },
    ],
  };
  // Q1
  let Q1_input_data = {
    identify: "category",
    filter: [
      {
        attr: "category",
        op: "in",
        value: ["Canada", "Germany", "India"],
      },
      {
        attr: "time",
        op: "in",
        value: ["2021-11", "2022-05"],
      },
      {
        attr: "category",
        op: "=",
        value: {
          operation: "max",
          attribute: "7-day rolling",
        },
      },
    ],
  };
  let Q3_input_data_0 = {
    compare: "7-day rolling",
    list: [
      {
        identify: "7-day rolling",
        filter: [
          {
            attr: "category",
            op: "=",
            value: "United States",
          },
        ],
      },
      {
        identify: "7-day rolling",
        filter: [
          {
            attr: "category",
            op: "=",
            value: "Canada",
          },
        ],
      },
    ],
  };
  let Q3_input_data_1 = {
    identify: "7-day rolling",
    filter: [
      {
        attr: "time",
        op: "in",
        value: ["2021-08", "2022-07"],
      },
    ],
  };
  let Q3_input_data_2 = {
    sum: "7-day rolling",
    list: [
      {
        identify: "7-day rolling",
        filter: [
          {
            attr: "category",
            op: "=",
            value: "United States",
          },
        ],
      },
      {
        identify: "7-day rolling",
        filter: [
          {
            attr: "category",
            op: "=",
            value: "Canada",
          },
        ],
      },
    ],
  };
  let Q3_input_data_3 = {
    identify: {
      operation: ["avg"],
    },
    filter: [
      {
        op: "in",
        attr: "time",
        value: ["Jan 01 2021", "Feb 2021"],
      },
    ],
  };
  let Q4 = {
    identify: {
      operation: ["max"],
    },
  };
  let input_data = [
    null,
    Q1_input_data,
    Q2_input_data,
    Q3_input_data_1,
    Q3_input_data_2,
    Q3_input_data_3,
    Q4,
  ];
  parse_json_input(input_data[idx]);
}

function small_vis() {
  console.log(
    window._need_identify,
    window._identified,
    window._need_sum,
    window._sumed
  );
  if (
    window._need_identify == window._identified &&
    window._need_sum == window._sumed
  ) {
    console.log("update_small_vis");
    update_small_vis();
  }
}

function parse_json_input(input_data) {
  console.log(input_data);
  window._time_step = 0;
  d3.select("#annotation_line").remove();
  d3.select("#annotation_text").remove();
  cal_selected()

  window._need_identify = 0;
  window._identified = 0;
  window._need_sum = 0;
  window._sumed = 0;
  console.log("input_data", input_data);
  if (
    input_data.hasOwnProperty("identify") ||
    input_data.hasOwnProperty("trend")
  ) {
    // let chart_object = _chart_object[0];
    // chart_object.CoordSys[0].visual_object.forEach(function (d) {
    //   d.selected = false;
    //   d.control_point.forEach(
    //     (p) => (chart_object.CoordSys[0].control_point[p].selected = false)
    //   );
    // });
    window._need_identify += 1;
    identify(input_data);
  }
  if (input_data.hasOwnProperty("compare")) {
    let chart_object = _chart_object[0];
    // chart_object.CoordSys[0].visual_object.forEach(function (d) {
    //   d.selected = false;
    //   d.control_point.forEach(
    //     (p) => (chart_object.CoordSys[0].control_point[p].selected = false)
    //   );
    // });
    input_data.list.forEach(function (d) {
      window._need_identify += 1;
      identify(d);
    });
    chart_object.CoordSys[0].change_stack_order("x");
    chart_object.CoordSys[0].half_opacity();
  }
  if (input_data.hasOwnProperty("sum")) {
    let chart_object = _chart_object[0];
    // input_data.list.forEach(function (d) {
    //   window._need_identify += 1;
    //   identify(d);
    // });
    chart_object.CoordSys[0].change_stack_order("x");
    chart_object.CoordSys[0].half_opacity();
    window._need_sum += 1;
    sum(input_data);
  }
  if (input_data.hasOwnProperty("operation")) {
    aggregate(input_data);
  }
}

function sum(input_data) {
  let chart_object = _chart_object[0];
  let mappings = _chart_object[0].chart_json.parsed_data.mapping;
  let visual_object =
    _chart_object[0].CoordSys[0].coordinate_data.visual_object;
  let control_point =
    _chart_object[0].CoordSys[0].coordinate_data.control_point;
  let mapping_dict = {};
  let x_key;
  let new_color = [0, 0, 0];
  let new_key = "Sumed Category";
  let should_y =
    _chart_object[0].y_axis_object_list[
      _chart_object[0].CoordSys[0].coordinate_data.y_axis
    ].scale(0);
  for (mapping of mappings) {
    mapping_dict[mapping["name"]] = mapping;
    if (mapping["direction"] == "x") {
      x_key = mapping["type"] + " value";
    }
  }
  let data_list = _chart_object[0].chart_json.parsed_data.data_list;
  let value = input_data.list[0].filter[0].attr;
  let type = mapping_dict[value]["type"];
  let key = type + " value";
  let sum_key = mapping_dict[input_data["sum"]]["type"] + " value";
  
  console.log(type, type_filter)
  if (!type_filter.hasOwnProperty(type)) {
    type_filter[type] = 1;
    let t_selected = type + "_selected";
    data_list.forEach(function (d) {
      d[t_selected] = false;
    });
    chart_object.CoordSys[0].visual_object.forEach(function (d) {
      d[t_selected] = false;
      d.control_point.forEach(function (p) {
        chart_object.CoordSys[0].control_point[p][t_selected] = false;
      });
    });
  }

  let category_list = [];
  for (let item of input_data.list) {
    category_list.push(item.filter[0].value);
  }
  console.log(category_list);
  category_color = {};
  category_list.forEach(function (c) {
    data_list.forEach(function (d) {
      if (d[key] == c) {
        category_color[c] = JSON.parse(d.color);
      }
    });
    new_color = new_color.map(function (d, i) {
      return d + category_color[c][i];
    });
  });
  new_color = new_color.map((d) => d / category_list.length);
  console.log(new_color);
  let new_vo = deep_copy(visual_object[0]);
  new_vo.id = visual_object.length;
  new_vo.control_point = [];
  new_vo.stroke = new_color;
  visual_object.push(new_vo);
  let new_data_list = [];
  let new_data_dict = [];
  category_list.forEach(function (c, i) {
    console.log(data_list);
    data_list.forEach(function (d) {
      // console.log(d[key])
      if (d[key] != c) return;
      if (i == 0) {
        let new_data_item = deep_copy(d);
        let new_control_point = deep_copy(control_point[d.related_point[0]]);
        new_control_point.obj_id = new_vo.id;
        new_control_point.id = control_point.length;
        new_vo.control_point.push(new_control_point.id);
        let t_selected = type + "_selected";
        new_vo[t_selected] = true;
        control_point.push(new_control_point);
        new_data_item.color = new_color;
        new_data_item[key] = new_key;
        new_data_item.related_vo = new_vo.id;
        new_data_item.related_point = [new_control_point.id];
        new_data_item[t_selected] = true;
        console.log(type, t_selected)
        new_data_dict[d[x_key]] = new_data_list.length;
        new_data_list.push(new_data_item);
      } else {
        // console.log(new_data_dict, new_data_dict[d[x_key]])
        let new_data_item = new_data_list[new_data_dict[d[x_key]]];
        let new_control_point = control_point[new_data_item.related_point[0]];
        new_data_item[sum_key] += d[sum_key];
        new_control_point.should_y +=
          control_point[d.related_point[0]].should_y - should_y;
      }
      for (let type in type_filter) {
        // console.log(type, type_filter)
        let t_selected = type + "_selected";
        d[t_selected] = false;
      }
    });
  });
  console.log(new_data_dict);
  data_list.push(...new_data_list);
  cal_selected();
  _chart_object[0].draw_new_coordsys(
    _chart_object[0].CoordSys[0].coordinate_data
  );
  chart_object.update_highlight();
  chart_object.restart_all_simulations();
  window._time_step += 1;
  setTimeout(function () {
    auto_change_quantitative_scale(chart_object, "y");
    console.log("auto_change_quantitative_scale");
    window._sumed += 1;
    small_vis();
  }, 1000 * window._time_step);
}

function aggregate(input_data) {
  let mappings = _chart_object[0].chart_json.parsed_data.mapping;
  let data_list = _chart_object[0].chart_json.parsed_data.data_list;
  let x_key;
  let mapping_dict = {};
  for (mapping of mappings) {
    mapping_dict[mapping["name"]] = mapping;
    if (mapping["direction"] == "x") {
      x_key = mapping["type"] + " pixel";
    }
  }

  let aggregate_type = input_data["operation"];
  let value = input_data["attribute"];
  let type = mapping_dict[value]["type"];
  let key = type + " value";

  if (aggregate_type == "max") {
    let max_p = -Infinity;
    let max_x;
    data_list.forEach(function (d) {
      if (d[key] > max_p) {
        max_p = d[key];
        max_x = d[x_key];
      }
    });
    let y =
      _chart_object[0].y_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.y_axis
      ].scale(max_p);
    let x1 =
      _chart_object[0].x_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.x_axis
      ].axis.area["x"];
    let x2 = max_x;
    let axis_canvas = _chart_object[0].axis_canvas;
    axis_canvas
      .append("line")
      .attr("stroke-dasharray", "4 4")
      .attr("stroke-width", 2)
      .attr("stroke", "grey")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", y)
      .attr("y2", y);
    axis_canvas
      .append("text")
      .text("Max " + max_p)
      .attr("x", x2)
      .attr("y", y - 5)
      .attr("fill", "grey")
      .attr("font-size", 20)
      .attr("text-anchor", "end");
    console.log(x1, x2, max_x, max_p);
  }
  if (aggregate_type == "min") {
    let min_p = Infinity;
    let min_x;
    data_list.forEach(function (d) {
      if (d[key] < min_p) {
        min_p = d[key];
        min_x = d[x_key];
      }
    });
    let y =
      _chart_object[0].y_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.y_axis
      ].scale(min_p);
    let x1 =
      _chart_object[0].x_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.x_axis
      ].axis.area["x"];
    let x2 = min_x;
    let axis_canvas = _chart_object[0].axis_canvas;
    axis_canvas
      .append("line")
      .attr("stroke-dasharray", "4 4")
      .attr("stroke-width", 2)
      .attr("stroke", "grey")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", y)
      .attr("y2", y);
    axis_canvas
      .append("text")
      .text("Min " + min_p)
      .attr("x", x2)
      .attr("y", y - 5)
      .attr("fill", "grey")
      .attr("font-size", 20)
      .attr("text-anchor", "end");
  }
  if (aggregate_type == "avg") {
    let total = 0;
    let cnt = 0;
    data_list.forEach(function (d) {
      cnt += 1;
      total += d[key];
    });
    let avg_p = total / cnt;
    let y =
      _chart_object[0].y_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.y_axis
      ].scale(avg_p);
    let x =
      _chart_object[0].x_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.x_axis
      ].axis.area["x"];
    let width =
      _chart_object[0].x_axis_object_list[
        _chart_object[0].CoordSys[0].coordinate_data.x_axis
      ].axis.area["width"];
    let axis_canvas = _chart_object[0].axis_canvas;
    axis_canvas
      .append("line")
      .attr("stroke-dasharray", "4 4")
      .attr("stroke-width", 2)
      .attr("stroke", "grey")
      .attr("x1", x)
      .attr("x2", x + width)
      .attr("y1", y)
      .attr("y2", y);
    axis_canvas
      .append("text")
      .text("Average " + avg_p.toFixed(2))
      .attr("x", x)
      .attr("y", y - 5)
      .attr("fill", "grey")
      .attr("font-size", 20);
  }
}

function annotation(x_pos, pos_value, text) {
  let axis_canvas = _chart_object[0].axis_canvas;
  y =
    _chart_object[0].y_axis_object_list[
      _chart_object[0].CoordSys[0].coordinate_data.y_axis
    ].scale(pos_value);
  x1 =
    _chart_object[0].x_axis_object_list[
      _chart_object[0].CoordSys[0].coordinate_data.x_axis
    ].axis.area["x"];
  x2 = _chart_object[0].x_axis_object_list[
    _chart_object[0].CoordSys[0].coordinate_data.x_axis
  ].scale(new Date(x_pos));
  axis_canvas
    .append("line")
    .attr("id", "annotation_line")
    .attr("stroke-dasharray", "8 8")
    .attr("stroke-width", 4)
    // .attr("stroke", "grey")
    .attr("x1", x1)
    .attr("x2", x2)
    .attr("y1", y)
    .attr("y2", y);
  axis_canvas
    .append("text")
    .attr("id", "annotation_text")
    .text(text)
    .attr("x", x2)
    .attr("y", y - 5)
    .attr("fill", "grey")
    .attr("font-size", 20)
    .attr("text-anchor", "end");
  console.log(x1, x2, pos_value, y, text);
}

function identify(input_data) {
  let chart_object = _chart_object[0];
  let mappings = _chart_object[0].chart_json.parsed_data.mapping;
  let control_point =
    _chart_object[0].CoordSys[0].coordinate_data.control_point;
  let data_list = _chart_object[0].chart_json.parsed_data.data_list;
  let x_key;
  let mapping_dict = {};
  let bar_width;
  let margin_diff;
  for (mapping of mappings) {
    mapping_dict[mapping["name"]] = mapping;
    if (mapping["direction"] == "x") {
      x_key = mapping["type"] + " value";
    }
  }
  console.log(mapping_dict);
  let filters = input_data["filter"];
  // let type_filter = {};
  let time_range = [
    new Date(
      Math.min(...data_list.map((d) => Date.parse(new Date(d["O value"]))))
    ),
    new Date(
      Math.max(...data_list.map((d) => Date.parse(new Date(d["O value"]))))
    ),
  ];
  let i = 0;
  filters = filters.sort(function (a, b) {
    if (a.value.hasOwnProperty("operation")) {
      return 1;
    } else return -1;
  });
  filters.forEach(function (d) {
    if (d.value.hasOwnProperty("operation")) {
      d["attr"] = input_data["identify"];
    }
  });
  console.log("filters", filters);
  const nextFilter = () => {
    let filter = filters[i];
    let attr = filter["attr"];
    console.log(i, filter);
    if (attr.hasOwnProperty("operation")) {
      let operation = attr["operation"];
      console.log(operation);
      if (operation == "rank" || operation.indexOf("rank") != -1) {
        let mapping = { name: "rank", type: "R", value_range: [0, 0] };
        let value = filter.value;
        console.log(value)
        filter.value = value.map((d) => (parseInt(d) - 1));
        console.log(value)
        mappings.push(mapping);
        mapping_dict[mapping.name] = mapping;
        let rank_attr;
        let rank_type;
        let rank_key;
        if (attr.hasOwnProperty("attribute")) {
          rank_attr = attr["attribute"];
          rank_type = mapping_dict[rank_attr]["type"];
          rank_key = rank_type + " value";
        } else {
          rank_key = "Q value";
        }
        console.log(rank_attr, rank_type, rank_key);
        let selected_data_list = [];
        data_list.forEach(function (d) {
          let selected = true;
          for (let type in type_filter) {
            let t_selected = type + "_selected";
            selected = selected && d[t_selected];
          }
          if (selected == false) {
            d.rank = -1;
            d["R value"] = -1;
          } else {
            selected_data_list.push(d);
          }
        });
        selected_data_list.sort(function (a, b) {
          return -a[rank_key] + b[rank_key];
        });
        selected_data_list.forEach(function (d, i) {
          d.rank = i;
          d["R value"] = i;
        });
      }
      filter["attr"] = attr["operation"];
    }
    console.log(filter["attr"], mapping_dict[filter["attr"]]);
    let type = mapping_dict[filter["attr"]]["type"];
    let need_annotation = false;
    console.log(type, type_filter)
    if (!type_filter.hasOwnProperty(type)) {
      type_filter[type] = 1;
      let t_selected = type + "_selected";
      data_list.forEach(function (d) {
        d[t_selected] = false;
      });
      chart_object.CoordSys[0].visual_object.forEach(function (d) {
        d[t_selected] = false;
        d.control_point.forEach(function (p) {
          chart_object.CoordSys[0].control_point[p][t_selected] = false;
        });
      });
    }
    console.log(type);
    let op = filter["op"];
    let value = filter["value"];
    let attr_key = type + " value";
    let x_pos, pos_value, text;
    if (value.hasOwnProperty("operation")) {
      need_annotation = true;
      let agg_value = value["attribute"];
      let agg_type = mapping_dict[agg_value]["type"];
      let agg_key = agg_type + " value";
      if (value.operation == "max") {
        pos_value = -Infinity;
        let max_attr;
        data_list.forEach(function (d) {
          if (d.selected == false) return;
          // console.log(d[agg_key], max_p, d[attr_key])
          if (d[agg_key] > pos_value) {
            pos_value = d[agg_key];
            max_attr = d[attr_key];
            x_pos = d[x_key];
          }
        });
        text = "Max " + pos_value;
        value = max_attr;
      }
      if (value.operation == "min") {
        pos_value = Infinity;
        let min_attr;
        data_list.forEach(function (d) {
          if (d.selected == false) return;
          if (d[agg_key] < pos_value) {
            pos_value = d[agg_key];
            max_attr = d[attr_key];
            x_pos = d[x_key];
          }
        });
        text = "Min " + pos_value;
        value = min_attr;
      }
      console.log(value);
    }
    if (op == "in") {
      if (type == "C" || type == "K") {
        let key = type + " value";
        let t_select = type + "_selected";
        chart_object.brush_selected = true;
        data_list.forEach(function (d) {
          let selected = false;
          if (value.indexOf(d[key]) > -1) {
            selected = true;
          }
          d[t_select] = d[t_select] ? d[t_select] : selected;
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
            chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              : selected;
          chart_object.CoordSys[0].visual_object[
            d.related_vo
          ].control_point.forEach(
            (p) =>
              (chart_object.CoordSys[0].control_point[p][t_select] =
                chart_object.CoordSys[0].control_point[p][t_select]
                  ? chart_object.CoordSys[0].control_point[p][t_select]
                  : selected)
          );
        });
      }
      if (type == "O") {
        time_range = value;
        let key = type + " value";
        let t_select = type + "_selected";
        chart_object.brush_selected = true;
        data_list.forEach(function (d) {
          let activate = false;
          let selected = false;
          if (
            d[key] >= Date.parse(value[0]) &&
            d[key] <= Date.parse(value[1])
          ) {
            activate = true;
            selected = true;
          }
          d[t_select] = selected;
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
            chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              : selected;
          for (let pid of d.related_point) {
            chart_object.CoordSys[0].control_point[pid].activate = activate;
            chart_object.CoordSys[0].control_point[pid][t_select] = chart_object
              .CoordSys[0].control_point[pid][t_select]
              ? chart_object.CoordSys[0].control_point[pid][t_select]
              : selected;
          }
        });
      }
      if (type == "Q" || type == "R") {
        let key = type + " value";
        let t_select = type + "_selected";
        chart_object.brush_selected = true;
        data_list.forEach(function (d) {
          let activate = false;
          let selected = false;
          if (d[key] >= value[0] && d[key] <= value[1]) {
            activate = true;
            selected = true;
          }
          d[t_select] = selected;
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
            chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
              : selected;
          // for (let pid of d.related_point) {
          //   chart_object.CoordSys[0].control_point[pid].activate = activate;
          //   chart_object.CoordSys[0].control_point[pid][t_select] =
          //     chart_object.CoordSys[0].control_point[pid][t_select]
          //       ? chart_object.CoordSys[0].control_point[pid][t_select]
          //       : selected;
          // }
        });
      }
    }
    if (op == "=") {
      console.log("=");
      if (type == "C" || type == "K") {
        let key = type + " value";
        let t_select = type + "_selected";
        console.log(key, value);
        chart_object.brush_selected = true;
        data_list.forEach(function (d) {
          let selected = false;
          if (d[key] == value) {
            selected = true;
          }
          // console.log(d[t_select], selected);
          // d[t_select] = d[t_select] ? d[t_select]: selected;
          // for (let pid of d.related_point) {
          //   chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
          //     chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
          //       ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
          //       : selected;
          //   chart_object.CoordSys[0].control_point[pid][t_select] = chart_object
          //     .CoordSys[0].control_point[pid][t_select]
          //     ? chart_object.CoordSys[0].control_point[pid][t_select]
          //     : selected;
          // }
          // if (d[t_select] == true) return;
          d[t_select] = d[t_select] || selected;
          // console.log(d[t_select], selected);
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
            chart_object.CoordSys[0].visual_object[d.related_vo][t_select] ||
            selected;
          chart_object.CoordSys[0].visual_object[
            d.related_vo
          ].control_point.forEach(
            (p) =>
              (chart_object.CoordSys[0].control_point[p][t_select] =
                chart_object.CoordSys[0].control_point[p][t_select] || selected)
          );
        });
      }
      if (type == "O") {
        let key = type + " value";
        let t_select = type + "_selected";
        let pixel_domain =
          _chart_object[0].x_axis_object_list[
            _chart_object[0].CoordSys[0].coordinate_data.x_axis
          ].axis.pixel_domain;
        let x_width = pixel_domain[1] - pixel_domain[0];
        let bar_cnt = 7;
        data_list.forEach(function (d) {
          // console.log(d[key], Date.parse(value))
          d.diff = Math.abs(d[key] - Date.parse(value));
        });
        let diff_list = [...new Set(data_list.map((d) => d.diff))];
        diff_list.sort(function (x, y) {
          return x - y;
        });

        console.log("diff list", diff_list);
        min_diff = diff_list[0];
        margin_diff = diff_list[bar_cnt - 1];
        value_diff = diff_list[bar_cnt + 1];
        console.log("margin_diff", margin_diff);
        console.log("value_diff", value_diff);
        console.log(diff_list);
        time_range = [Infinity, -Infinity];
        let valid_data_list = data_list.filter((d) => d.diff < margin_diff);
        bar_width = (x_width / valid_data_list.length) * 0.6;
        data_list.forEach(function (d) {
          let activate = false;
          let selected = false;
          if (d.diff <= margin_diff + 0.1) {
            if (d[key] < time_range[0]) {
              time_range[0] = d[key];
            }
            if (d[key] > time_range[1]) {
              time_range[1] = d[key];
            }
          }
          if (d.diff <= value_diff) {
            // console.log(d[key], time_range)
            activate = true;
            // selected = true;
          }
          if (d.diff <= min_diff) {
            selected = true;
          }
          // d[t_select] = selected;
          // chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
          //   chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
          //     ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
          //     : selected;
          // for (let pid of d.related_point) {
          //   chart_object.CoordSys[0].control_point[pid].activate = activate;
          //   chart_object.CoordSys[0].control_point[pid][t_select] =
          //     chart_object.CoordSys[0].control_point[pid][t_select]
          //       ? chart_object.CoordSys[0].control_point[pid][t_select]
          //       : selected;
          // }
        });
        time_range = [new Date(time_range[0]), new Date(time_range[1])];
      }
    }
    if (op == "<=") {
      time_range[1] = value;
      let key = type + " value";
      let t_select = type + "_selected";
      chart_object.brush_selected = true;
      data_list.forEach(function (d) {
        let activate = false;
        let selected = false;
        if (d[key] <= Date.parse(value)) {
          activate = true;
          selected = true;
        }
        d[t_select] = selected;
        chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
            ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
            : selected;
        for (let pid of d.related_point) {
          chart_object.CoordSys[0].control_point[pid].activate = activate;
          chart_object.CoordSys[0].control_point[pid][t_select] = chart_object
            .CoordSys[0].control_point[pid][t_select]
            ? chart_object.CoordSys[0].control_point[pid][t_select]
            : selected;
        }
      });
    }
    if (op == ">=") {
      time_range[0] = value;
      let key = type + " value";
      let t_select = type + "_selected";
      chart_object.brush_selected = true;
      data_list.forEach(function (d) {
        let activate = false;
        let selected = false;
        if (d[key] >= Date.parse(value)) {
          activate = true;
          selected = true;
        }
        d[t_select] = selected;
        chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
          chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
            ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
            : selected;
        for (let pid of d.related_point) {
          chart_object.CoordSys[0].control_point[pid].activate = activate;
          chart_object.CoordSys[0].control_point[pid][t_select] = chart_object
            .CoordSys[0].control_point[pid][t_select]
            ? chart_object.CoordSys[0].control_point[pid][t_select]
            : selected;
        }
      });
    }
    data_list.forEach(function (d) {
      let selected = true;
      for (let type in type_filter) {
        let t_selected = type + "_selected";
        selected = selected && d[t_selected];
      }
      d.selected = selected;
    });
    chart_object.CoordSys[0].visual_object.forEach(function (d) {
      let selected = true;
      for (let type in type_filter) {
        let t_selected = type + "_selected";
        selected = selected && d[t_selected];
      }
      d.selected = selected;
      d.control_point.forEach(function (p) {
        let selected = true;
        for (let type in type_filter) {
          let t_selected = type + "_selected";
          selected =
            selected && chart_object.CoordSys[0].control_point[p][t_selected];
        }
        chart_object.CoordSys[0].control_point[p].selected = selected;
      });
    });
    window._time_step = 0;
    if (type == "Q" || type == "O") {
      window._time_step += 1;
      setTimeout(function () {
        auto_change_quantitative_scale(chart_object, "y");
        console.log("auto_change_quantitative_scale");
      }, 1000 * window._time_step);
      window._time_step += 1;
      setTimeout(function () {
        console.log(time_range);
        auto_time_resize(chart_object, time_range);
        console.log("auto_time_resize");
      }, 1000 * window._time_step);
      if (op == "=" && type == "O") {
        window._time_step += 2;
        setTimeout(function () {
          let key = type + " value";
          let t_select = type + "_selected";
          let pixel_domain =
            _chart_object[0].x_axis_object_list[
              _chart_object[0].CoordSys[0].coordinate_data.x_axis
            ].axis.pixel_domain;
          let x_width = pixel_domain[1] - pixel_domain[0];
          let bar_cnt = 7;
          data_list.forEach(function (d) {
            // console.log(d[key], Date.parse(value))
            d.diff = Math.abs(d[key] - Date.parse(value));
          });
          let diff_list = [...new Set(data_list.map((d) => d.diff))];
          diff_list.sort(function (x, y) {
            return x - y;
          });
          console.log(diff_list);

          let min_diff = diff_list[0];
          margin_diff = diff_list[bar_cnt];
          value_diff = diff_list[bar_cnt + 2];
          console.log("margin_diff", margin_diff);
          console.log("value_diff", value_diff);
          time_range = [Infinity, -Infinity];
          let valid_data_list = data_list.filter((d) => d.diff < value_diff);
          valid_data_list.forEach(function (d) {
            d.related_point.forEach((p) => (control_point[p].stay = true));
          });
          data_list.forEach(function (d) {
            let activate = false;
            let selected = false;
            if (d.diff <= value_diff) {
              // console.log(d[key], time_range)
              activate = true;
              // selected = true;
            }
            // console.log(d.diff, value_diff)
            if (d.diff <= min_diff) {
              selected = true;
            }
            d[t_select] = selected;
            chart_object.CoordSys[0].visual_object[d.related_vo][t_select] =
              chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
                ? chart_object.CoordSys[0].visual_object[d.related_vo][t_select]
                : selected;
            for (let pid of d.related_point) {
              chart_object.CoordSys[0].control_point[pid].activate = activate;
              chart_object.CoordSys[0].control_point[pid][t_select] =
                chart_object.CoordSys[0].control_point[pid][t_select]
                  ? chart_object.CoordSys[0].control_point[pid][t_select]
                  : selected;
            }
          });

          let new_control_point = control_point.filter((d) => d.stay);
          console.log(new_control_point);
          control_point_dict = new Array();
          new_control_point.forEach(function (d, i) {
            control_point_dict[d.id] = i;
          });
          new_control_point.forEach(function (d, i) {
            d.id = i;
          });
          chart_object.CoordSys[0].visual_object.forEach(function (d) {
            d.control_point = d.control_point
              .filter((d) => d in control_point_dict)
              .map((d) => control_point_dict[d]);
          });
          control_point = new_control_point;
          data_list = valid_data_list;
          data_list.forEach(function (d) {
            d.related_point = d.related_point
              .filter((d) => d in control_point_dict)
              .map((d) => control_point_dict[d]);
          });
          _chart_object[0].chart_json.parsed_data.data_list = data_list;
          _chart_object[0].CoordSys[0].coordinate_data.control_point =
            control_point;
          console.log(valid_data_list, data_list);
          re_encode_line2area(_chart_object[0]);
          _chart_object[0].CoordSys[0].half_opacity();
        }, 1000 * window._time_step);
      }

      window._time_step += 1;
      setTimeout(function () {
        auto_change_quantitative_scale(chart_object, "y");
        console.log("auto_change_quantitative_scale");
      }, 1000 * window._time_step);

      if (op == "=" && type == "O") {
        window._time_step += 3;
        setTimeout(function () {
          console.log("change to bar");
          update_small_vis();
          re_encode_area2bar(_chart_object[0], bar_width);
          cal_selected();
        }, 1000 * window._time_step);
      }
    }
    window._time_step += 1;
    setTimeout(function () {
      chart_object.update_highlight();
      chart_object.restart_all_simulations();
    }, 1000 * window._time_step);
    window._time_step += 1;
    setTimeout(function () {
      i += 1;
      if (need_annotation) {
        annotation(x_pos, pos_value, text);
        need_annotation = false;
      }
      // console.log(get_chart_data().parsed_data.data_list.filter(d => d['K_selected']))
      if (i < filters.length) {
        nextFilter();
      } else {
        if (
          input_data.hasOwnProperty("identify") &&
          input_data["identify"].hasOwnProperty("operation")
        ) {
          let operation = input_data["identify"]["operation"];
          need_annotation = true;
          cal_selected();
          if (operation == "avg" || operation.indexOf("avg") != -1) {
            console.log(operation);
            let key = "Q value";
            let total = 0;
            let cnt = 0;
            data_list.forEach(function (d) {
              if (!d.selected) return;
              cnt += 1;
              total += d[key];
              // console.log(d[key])
            });
            pos_value = total / cnt;
            text = "Average " + pos_value.toFixed(2);
            x_pos =
              _chart_object[0].x_axis_object_list[
                _chart_object[0].CoordSys[0].coordinate_data.x_axis
              ].axis.value_range[1];
          }
        }
        if (need_annotation) {
          annotation(x_pos, pos_value, text);
          need_annotation = false;
        }
        window._identified += 1;
        small_vis();
      }
    }, 1000 * window._time_step);
  };
  if (filters.length > 0) {
    nextFilter();
  }
  else {
    if (
      input_data.hasOwnProperty("identify") &&
      input_data["identify"].hasOwnProperty("operation")
    ) {
      let operation = input_data["identify"]["operation"];
      need_annotation = true;
      cal_selected();
      if (operation == "avg" || operation.indexOf("avg") != -1) {
        console.log(operation);
        let key = "Q value";
        let total = 0;
        let cnt = 0;
        data_list.forEach(function (d) {
          console.log(d.selected, d[key])
          if (!d.selected) return;
          cnt += 1;
          total += d[key];
        });
        pos_value = total / cnt;
        text = "Average " + pos_value.toFixed(2);
        x_pos =
          _chart_object[0].x_axis_object_list[
            _chart_object[0].CoordSys[0].coordinate_data.x_axis
          ].axis.value_range[1];
      }
    }
    if (need_annotation) {
      annotation(x_pos, pos_value, text);
      need_annotation = false;
    }
    window._identified += 1;
    small_vis();
  }
  chart_object.restart_all_simulations();
  console.log(type);
  // update_small_vis();
}

function cal_selected() {
  let chart_object = _chart_object[0];
  chart_object.chart_json.parsed_data.data_list.forEach(function (d) {
    let selected = true;
    for (let type in type_filter) {
      let t_selected = type + "_selected";
      selected = selected && d[t_selected];
    }
    d.selected = selected;
    chart_object.CoordSys[0].visual_object[d.related_vo].selected = selected;
    chart_object.CoordSys[0].visual_object[
      d.related_vo
    ].control_point.forEach(
      (p) =>
        (chart_object.CoordSys[0].control_point[p].selected = selected)
    );
  })
  // chart_object.CoordSys[0].visual_object.forEach(function (d) {
  //   let selected = true;
  //   for (let type in type_filter) {
  //     let t_selected = type + "_selected";
  //     selected = selected && d[t_selected];
  //   }
  //   d.selected = selected;
  //   d.control_point.forEach(function (p) {
  //     let selected = true;
  //     for (let type in type_filter) {
  //       let t_selected = type + "_selected";
  //       selected =
  //         selected && chart_object.CoordSys[0].control_point[p][t_selected];
  //     }
  //     chart_object.CoordSys[0].control_point[p].selected = selected;
  //   });
  // });
}
