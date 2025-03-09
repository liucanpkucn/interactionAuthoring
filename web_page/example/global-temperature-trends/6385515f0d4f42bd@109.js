// https://observablehq.com/@mbostock/global-temperature-trends@109
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["temperatures.csv",new URL("./files/a6f8018172231770fcb74b515ac8f7d1e40f466f22190c2e89f7621087b4b02a21e5e9a7f20ccb9563055aa1ed16d95b448e7e6dc6d5e7bd096a72a4de0f002d",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Global Temperature Trends

Based on [How 2016 Became Earth’s Hottest Year on Record](https://www.nytimes.com/interactive/2017/01/18/science/earth/2016-hottest-year-on-record.html).

Source: [NASA Goddard Institute for Space Studies](https://data.giss.nasa.gov/gistemp/)`
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","xAxis","yAxis","data","x","y","z"], function(d3,width,height,xAxis,yAxis,data,x,y,z)
{
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2)
    .selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.value))
      .attr("fill", d => z(d.value))
      .attr("r", 2.5);

  return svg.node();
}
);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], async function(d3,FileAttachment)
{
  const data = [];
  // https://data.giss.nasa.gov/gistemp/tabledata_v3/GLB.Ts+dSST.csv
  await d3.csvParse(await FileAttachment("temperatures.csv").text(), (d, i, columns) => {
    for (let i = 1; i < 13; ++i) {
      data.push({
        date: new Date(Date.UTC(d.Year, i - 1, 1)),
        value: +d[columns[i]]
      });
    }
  });
  return data;
}
);
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 20, right: 30, bottom: 30, left: 40}
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","data","height","margin"], function(d3,data,height,margin){return(
d3.scaleLinear()
    .domain(d3.extent(data, d => d.value)).nice()
    .range([height - margin.bottom, margin.top])
)});
  main.variable(observer("z")).define("z", ["d3","data"], function(d3,data)
{
  const max = d3.max(data, d => Math.abs(d.value));
  return d3.scaleSequential(d3.interpolateRdBu).domain([max, -max]);
}
);
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x","width"], function(height,margin,d3,x,width){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80))
    .call(g => g.select(".domain").remove())
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y","width"], function(margin,d3,y,width){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "+"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .filter(d => d === 0)
      .clone()
        .attr("x2", width - margin.right - margin.left)
        .attr("stroke", "#ccc"))
    .call(g => g.append("text")
        .attr("fill", "#000")
        .attr("x", 5)
        .attr("y", margin.top)
        .attr("dy", "0.32em")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Anomaly (°C)"))
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  return main;
}
