function deal_width_pathpolygon() {
  // 选中所有的polyline元素
  const polylines = document.querySelectorAll("svg polyline");

  // 遍历所有的polyline元素
  polylines.forEach((polyline) => {
    // 创建一个新的path元素
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // 获取polyline的points属性值，并将其拆分为坐标数组
    const points = polyline.getAttribute("points").split(" ");

    // 将坐标数组转换为d属性值所需的格式
    let d = "M " + points.shift() + " L ";
    points.forEach((point) => {
      d += point + " ";
    });

    // 将path的d属性设置为新的值
    path.setAttribute("d", d);

    // 复制原始元素的属性和样式信息到新的path元素
    var attributes = polyline.attributes;
    for (var i = 0; i < attributes.length; i++) {
      var name = attributes[i].name;
      var value = attributes[i].value;
      path.setAttribute(name, value);
    }

    // 将path元素插入到polyline之前
    polyline.parentNode.insertBefore(path, polyline);

    // 删除原来的polyline元素
    polyline.remove();
  });
}

function purify_svg(current_svg) {
  let size = current_svg.node().getBoundingClientRect();
  // console.log('the size of the svg', size)
  svg_width = size.width;
  svg_height = size.height;

  if (
    current_svg.attr("width") === null &&
    current_svg.attr("height") === null &&
    current_svg.attr("viewBox") !== null
  ) {
    // console.log("?????????")
    viewBox = current_svg.attr("viewBox");
    view_box_list = viewBox.split(",");

    if (view_box_list.length === 4) {
      current_svg.attr("width", view_box_list[2]);
      current_svg.attr("height", view_box_list[3]);
    } else if (view_box_list.length === 1) {
      view_box_list = viewBox.split(" ").filter((d) => d !== "");
      current_svg.attr("width", view_box_list[2]);
      current_svg.attr("height", view_box_list[3]);
    }
  }

  // current_svg
  // 	.attr('width', svg_width)
  // 	.attr('height', svg_height)

  if (current_svg.attr("xmlns") === null) {
    current_svg.attr("xmlns", "http://www.w3.org/2000/svg");
  }

  if (
    current_svg.attr("width") !== null &&
    current_svg.attr("height") !== null &&
    current_svg.attr("viewBox") === null
  ) {
    current_svg.attr("viewBox", "0 0 " + svg_width + " " + svg_height);
  }

  deal_width_pathpolygon();

  // pathpolygon, convert to svg

  let deal_type = ["rect", "path", "line", "circle", "svg", "text"];

  // console.log(current_svg.selectAll("rect"))

  current_svg.attr("transform_matrix", function (d) {
    let matrix = d3.select(this).node().getScreenCTM();
    let matrix_new = {
      a: matrix.a,
      b: matrix.b,
      c: matrix.c,
      d: matrix.d,
      e: matrix.e,
      f: matrix.f,
    };

    // console.log(d_type, JSON.stringify(matrix_new))
    return JSON.stringify(matrix_new);
  });

  current_svg.selectAll("rect").attr("bbox_new", function (d) {
    let r = d3.select(this).node().getBoundingClientRect();
    d3.select(this)
      .attr("real_x", r.x)
      .attr("real_y", r.y)
      .attr("real_width", r.width)
      .attr("real_height", r.height);
    console.log(
      "svg_height",
      "svg_width",
      svg_width,
      svg_height,
      r.width,
      r.height
    );
    if (r.width > svg_width * 0.6 && r.height > svg_height * 0.6) {
      // console.log('remove ')
      d3.select(this).remove();
    }
  });

  deal_type.forEach(function (d_type) {
    // console.log(d_type)
    current_svg.selectAll(d_type).attr("transform_matrix", function (d) {
      let matrix = d3.select(this).node().getScreenCTM();
      let matrix_new = {
        a: matrix.a,
        b: matrix.b,
        c: matrix.c,
        d: matrix.d,
        e: matrix.e,
        f: matrix.f,
      };

      // console.log(d_type, JSON.stringify(matrix_new))
      return JSON.stringify(matrix_new);
    });
  });

  current_svg.selectAll("rect").each(function (d) {
    let computedStyle = getComputedStyle(d3.select(this).node());
    if (
      computedStyle["opacity"] < 0.05 ||
      computedStyle["display"] === "none"
    ) {
      d3.select(this).remove();
    }
    if (
      computedStyle["fill"] == "rgb(255, 255, 255)" &&
      computedStyle["stroke"] == "rgb(255, 255, 255)"
    ) {
      d3.select(this).remove();
    } else {
      d3.select(this)
        .attr("fill", computedStyle["fill"])
        .attr("opacity", computedStyle["opacity"])
        .attr("stroke", computedStyle["stroke"])
        .attr("stroke-width", computedStyle["stroke-width"])
        .attr("stroke-opacity", computedStyle["stroke-opacity"])
        .attr("vivisfy_selected", "yes");
    }
  });

  current_svg.selectAll("circle").each(function (d) {
    let computedStyle = getComputedStyle(d3.select(this).node());
    if (
      computedStyle["opacity"] < 0.05 ||
      computedStyle["display"] === "none"
    ) {
      d3.select(this).remove();
    } else {
      d3.select(this)
        .attr("fill", computedStyle["fill"])
        .attr("opacity", computedStyle["opacity"])
        .attr("stroke", computedStyle["stroke"])
        .attr("stroke-width", computedStyle["stroke-width"])
        .attr("stroke-opacity", computedStyle["stroke-opacity"])
        .attr("vivisfy_selected", "yes");
    }
  });

  current_svg
    .selectAll("text")
    .attr("text_bbox", function (d) {
      let bbox = d3.select(this).node().getBoundingClientRect();
      let bbox_new = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
      return JSON.stringify(bbox_new);
    })
    .each(function (d) {
      let computedStyle = getComputedStyle(d3.select(this).node());

      // console.log('opacity', computedStyle['opacity'])
      // console.log("visible", computedStyle['visible'])
      // console.log("fill", computedStyle['fill'])

      // console.log('path compuated style', computedStyle)

      if (
        computedStyle["opacity"] === 0 ||
        computedStyle["display"] === "none"
      ) {
        d3.select(this).remove();
      } else {
        d3.select(this)
          .style("font-family", computedStyle["font-family"])
          .attr("my_fill", computedStyle["fill"])
          .attr("my_fill_opacity", computedStyle["fill-opacity"])
          .attr("my_font_size", computedStyle["font-size"])
          .attr("opacity", computedStyle["opacity"])
          .attr("fill", computedStyle["fill"])
          .attr("clip-path", null)
          .attr("content", function () {
            var textContent = "";
            // 如果text元素没有任何tspan元素，则直接返回文本内容
            if (d3.select(this).selectAll("tspan").size() === 0) {
              textContent = d3.select(this).text().trim();
            }
            // 否则，遍历tspan元素并将其内容合并为单个字符串
            else {
              d3.select(this)
                .selectAll("tspan")
                .each(function () {
                  textContent += d3.select(this).text().trim() + " ";
                });
            }

            return textContent;
          })
          .style("font-size", computedStyle["font-size"])
          .attr("vivisfy_selected", "yes");
      }
    });

  current_svg.selectAll("line").each(function (d) {
    let computedStyle = getComputedStyle(d3.select(this).node());
    if (
      computedStyle["opacity"] < 0.05 ||
      computedStyle["stroke-opacity"] < 0.05 ||
      computedStyle["display"] === "none"
    ) {
      d3.select(this).remove();
    } else {
      d3.select(this)
        .style("stroke", computedStyle["stroke"])
        .style("strokeDasharray", computedStyle["strokeDasharray"])
        .style("strokeWidth", computedStyle["strokeWidth"])
        .style("opacity", computedStyle["opacity"])
        .attr("vivisfy_selected", "yes");

      d3.select(this).attr("line_bbox", function (d) {
        let bbox = d3.select(this).node().getBoundingClientRect();
        let bbox_new = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
        return JSON.stringify(bbox_new);
      });
    }
  });

  current_svg.selectAll("path").each(function (d) {
    let computedStyle = getComputedStyle(d3.select(this).node());

    if (
      computedStyle["opacity"] < 0.05 ||
      (computedStyle["fill-opacity"] < 0.05 &&
        computedStyle["stroke-opacity"] < 0.05) ||
      computedStyle["display"] === "none" ||
      (["fill-opacity"] < 0.05 && computedStyle["stroke"] === "none")
    ) {
      d3.select(this).remove();
    } else {
      const fillAttr = this.getAttribute("fill");
      const fillStyle = this.style.fill;
      let fill_value = computedStyle["fill"];
      if (!(fillAttr || fillStyle)) {
        fill_value = null;
      }

      // console.log('path opacity', computedStyle['opacity'])
      // console.log("path visible", computedStyle['visible'])
      // console.log("path fill", computedStyle['fill'])
      // console.log('path compuated style', computedStyle)
      d3.select(this)
        .attr("font-family", computedStyle["font-family"])
        .attr("stroke", computedStyle["stroke"])
        .attr("stroke-opacity", computedStyle["stroke-opacity"])
        .attr("stroke-width", computedStyle["stroke-width"])
        .attr("fill", fill_value)
        .attr("fill-opacity", computedStyle["fill-opacity"])
        .style("font-family", computedStyle["font-family"])
        .style("stroke", computedStyle["stroke"])
        .style("stroke-opacity", computedStyle["stroke-opacity"])
        .style("stroke-width", computedStyle["stroke-width"])
        .style("fill", fill_value)
        .style("fill-opacity", computedStyle["fill-opacity"])
        .attr("my_stoke", computedStyle["stroke"])
        .attr("my_stoke_width", computedStyle["stroke-width"])
        .attr("my_stoke_opacity", computedStyle["stroke-opacity"])
        .attr("my_fill", fill_value)
        .attr("my_fill_opacity", computedStyle["fill-opacity"])
        .attr("my_font_size", computedStyle["font-size"])
        .attr("opacity", computedStyle["opacity"])
        .attr("fill", fill_value)
        .attr("vivisfy_selected", "yes");
    }
  });

  current_svg.selectAll("clipPath").remove();

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  var hour = String(today.getHours());
  var min = String(today.getMinutes());

  let current_time = yyyy + "_" + mm + "_" + dd + "_" + hour + "_" + min;

  send_data = {
    svg_string: current_svg.node().outerHTML,
    name: current_time + "_submit.svg",
  };
  // console.log(send_data.data)
  return send_data;
}

function get_text_bounding_box(container_id, current_svg) {
  var container = document.getElementById(container_id);
  var container_bbox = container.getBoundingClientRect();

  // console.log("左上角坐标：(" + bbox.left + ", " + bbox.top + ")");

  let text_list = [];

  current_svg.selectAll("text").each(function (d) {
    let current_text = d3.select(this).node().getBoundingClientRect();
    text_list.push({
      left: current_text.left - container_bbox.left,
      top: current_text.top - container_bbox.top,
      width: current_text.width,
      height: current_text.height,
    });
  });

  return text_list;
}
