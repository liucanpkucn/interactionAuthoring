// https://observablehq.com/@mbostock/most-popular-operating-systems-2003-2020@223
import define1 from "./a33468b95d0b15b0@704.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["os (1).csv",new URL("./files/d2ce506eb8ecb4ef33327e4077ce78492ec6b0e5afb7822adb342bf850f2efdb5d7d3566083c672a86fe7c97f8d9b94c64ebcf5ae864c8f57a77e6985a5b8308",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Most Popular Operating Systems, 2003–2020

Data: [W3Schools](/d/677c8e1a58a45314)`
)});
  main.variable(observer()).define(["swatches","color"], function(swatches,color){return(
swatches({color})
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","series","color","area","x","y","xAxis","yAxis"], function(d3,width,height,series,color,area,x,y,xAxis,yAxis)
{  
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
    .selectAll("path")
    .data(series)
    .join("path")
      .attr("fill", ({key}) => color(key))
      .attr("d", area)
    .append("title")
      .text(({key}) => key);

  svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "white")
    .selectAll("path")
    .data(series)
    .join("path")
      .attr("d", area.lineY1());

  svg.append("g")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(series)
    .join("text")
      .attr("dy", "0.35em")
      .text(d => d.key)
      .datum(d => d3.greatest(d, ([a, b]) => b - a))
      .attr("text-anchor", d => x(d.data[0]) < 100 ? "start" : x(d.data[0]) > width - 100 ? "end" : null)
      .attr("dx", d => x(d.data[0]) < 100 ? "1em" : x(d.data[0]) > width - 100 ? "-1em" : null)
      .attr("transform", d => `translate(${x(d.data[0])},${y((d[0] + d[1]) / 2)})`);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  return svg.node();
}
);
  main.variable(observer("data")).define("data", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("os (1).csv").csv({typed: true})
)});
  main.variable(observer("series")).define("series", ["d3","data"], function(d3,data){return(
d3.stack()
    .keys(d3.group(data, d => d.name).keys())
    .value(([, values], name) => values.get(name) || 0)
  (d3.rollup(data, ([d]) => d.value, d => +d.date, d => d.name))
)});
  main.variable(observer("area")).define("area", ["d3","x","y"], function(d3,x,y){return(
d3.area()
    .x(d => x(d.data[0]))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .rangeRound([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","height","margin"], function(d3,height,margin){return(
d3.scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top])
)});
  main.variable(observer("color")).define("color", ["d3","data"], function(d3,data){return(
d3.scaleOrdinal()
    .domain(d3.groups(data, d => d.name)
      .sort(([, a], [, b]) => d3.descending(d3.sum(a, d => d.value), d3.sum(b, d => d.value)))
      .slice(0, 9) // only color the top nine
      .sort(([ak, [a]], [bk, [b]]) => d3.ascending(a.date, b.date) || d3.ascending(ak, bk))
      .map(([name]) => name))
    .range(d3.schemeTableau10)
    .unknown(d3.schemeTableau10[9])
)});
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x","width"], function(height,margin,d3,x,width){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y"], function(margin,d3,y){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
)});
  main.variable(observer("formatDate")).define("formatDate", ["d3"], function(d3){return(
d3.utcFormat("%b %Y")
)});
  main.variable(observer("formatValue")).define("formatValue", function(){return(
d => `${d.toFixed(1)}%`
)});
  main.variable(observer("height")).define("height", function(){return(
600
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 20, right: 30, bottom: 30, left: 30}
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  const child1 = runtime.module(define1);
  main.import("swatches", child1);
  return main;
}
