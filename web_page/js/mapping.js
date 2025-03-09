function draw_mapping(mapping) {
  console.log(mapping);
  if (!mapping){
    return
  }

  mapping.forEach(function (d) {
    if (d.name === "7-day rolling") {
      d.name = "daily new cases";
    }
  });

  var mapping_container = d3.select("#panel_mapping");
  mapping_container.selectAll("div").remove();
  mapping_container.selectAll("text").remove();

  mapping_container
    .append("text")
    .classed("sub_title", true)
    .text("Data Mapping");

  var attribute = mapping_container.selectAll("div").data(mapping).join("div");

  attribute
    .append("div")
    .attr("class", "axis-title")
    .text((d) => {
      if (d.direction === "x") return "horizontal axis";
      else if (d.direction === "y") return "vertical axis";
      else if (d.direction === "legend") return "color mapping";
    });

  var name = attribute.filter((d) => "name" in d).append("div");
  name.append("span").attr("class", "map-attr-name").text("name:");
  name
    .append("span")
    .text((d) => d.name)
    .attr("contenteditable", true)
    .attr("class", "editable name")
    .filter((d) => d.name === "")
    .style("padding-left", "1rem");

  var unit = attribute.filter((d) => "unit" in d).append("div");
  unit.append("span").attr("class", "map-attr-name").text("unit:");
  unit
    .append("span")
    .attr("contenteditable", true)
    .attr("class", "editable unit")
    .text((d) => d.unit);

  var color_legend = attribute
    .filter((d) => "map" in d)
    .append("div")
    .attr("class", "map-legend-container")
    .selectAll("div")
    .data((d) =>
      d3.map(Object.keys(d.map), (key) => {
        return { color: key, category: d.map[key] };
      })
    )
    .join("div")
    .attr("class", "map-color-container color");
  // .style("margin-bottom", (d, i, nodes) => i != nodes.length - 1 ? "1rem" : "0rem");
  color_legend
    .append("div")
    .style("width", "1.4rem")
    .style("height", "1.4rem")
    .style("display", "inner-block")
    .style("margin-bottom", "0")
    .style("background", (d) => {
      let color = d.color.replace("[", "(");
      color = color.replace("]", ")");
      return "rgb" + color;
    });
  color_legend
    .append("span")
    .attr("contenteditable", true)
    .attr("class", "editable")
    .text((d) => d.category);

  mapping_container
    .append("div")
    .attr("id", "panel_mapping_button")
    .append("input")
    .attr("type", "button")
    .attr("class", "map-button")
    .attr("id", "update_mapping_button")
    .attr("value", "Update")
    .on("click", () => {
      attribute.each(function (d, i) {
        if (d3.select(this).selectAll(".name")._groups[0].length) {
          let name = d3.select(this).select(".name").text();
          console.log(i, name);
          mapping[i].name = name;
        }
        if (d3.select(this).selectAll(".unit")._groups[0].length) {
          let unit = d3.select(this).select(".unit").text();
          mapping[i].unit = unit;
        }
        if (d3.select(this).selectAll(".color")._groups[0].length) {
          d3.select(this)
            .selectAll(".color")
            .each(function (item, j) {
              let category = d3.select(this).select("span").text();
              mapping[i].map[item.color] = category;
            });
        }
      });
      // console.log(mapping)
      update_data(mapping);
    });
}

function update_data(mapping) {
  console.log("!!!!! update mapping");
  console.log(_chart_object[0]);
  let data_list = _chart_object[0].chart_json.parsed_data.data_list;
  _chart_object[0].chart_json.parsed_data.mapping = mapping;

  for (let d of mapping) {
    let attr_type = d["type"];
    console.log("TYPE ATTR", attr_type);
    if (d["direction"] == "legend") {
      for (let item of data_list) {
        item[attr_type + " value"] = d["map"][item["color"]];
        item[attr_type] = d["name"];
      }
    } else {
      for (let item of data_list) {
        item[attr_type] = d["name"];
        if (attr_type == "Q") {
          item["unit"] = d["unit"];
        }
      }
    }
  }
}
