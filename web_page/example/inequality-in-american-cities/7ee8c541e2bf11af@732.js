// https://observablehq.com/@mbostock/inequality-in-american-cities@732
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["metros.csv",new URL("./files/39837ec5121fcc163131dbc2fe8c1a2e0b3423a5d1e96b5ce371e2ac2e20a290d78b71a4fb08b9fa6a0107776e17fb78af313b8ea70f4cc6648fad68ddf06f7a",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Inequality in American Cities

Based on a graphic by [Emily Badger and Kevin Quealy](https://www.nytimes.com/2019/12/02/upshot/wealth-poverty-divide-american-cities.html), this chart shows the change from 1980 to 2015 of the ratio of 90th-percentile wages to 10th-percentile wages, along with population, in 195 metro areas. I prefer the static display to [animation](/@mbostock/inequality-in-american-cities/2).`
)});
  main.variable(observer("legend")).define("legend", ["DOM","svg","endColor","startColor","arc"], function(DOM,svg,endColor,startColor,arc)
{
  const arrowId = DOM.uid("arrow");
  const gradientId = DOM.uid("gradient");
  return svg`<svg width="180" height="33" style="display: block; font: 10px sans-serif;">
  <defs>
    <marker id="${arrowId.id}" markerHeight="10" markerWidth="10" refX="5" refY="2.5" orient="auto">
      <path fill="${endColor}" d="M0,0v5l7,-2.5Z"></path>
    </marker>
    <linearGradient id="${gradientId.id}" gradientUnits="userSpaceOnUse" x1="33" x2="149">
      <stop stop-color="${startColor}" stop-opacity="0.5"></stop>
      <stop stop-color="${endColor}" offset="100%"></stop>
    </linearGradient>
  </defs>
  <path fill="none" stroke="${gradientId}" marker-end="${arrowId}" d="${arc(33, 16.5, 149, 16.5)}"></path>
  <circle cx="33" cy="16.5" r="2.5"></circle>
  <text x="4" y="16.5" dy="0.36em" text-anchor="start">1980</text>
  <text x="176" y="16.5" dy="0.36em" text-anchor="end">2015</text>
</svg>`;
}
);
  main.variable(observer("chart")).define("chart", ["d3","width","height","DOM","data","endColor","x","y","startColor","grid","xAxis","yAxis","arc"], function(d3,width,height,DOM,data,endColor,x,y,startColor,grid,xAxis,yAxis,arc)
{
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const arrowId = DOM.uid("arrow");
  const gradientIds = data.map(() => DOM.uid("gradient"));

  svg.append("defs")
    .append("marker")
      .attr("id", arrowId.id)
      .attr("markerHeight", 10)
      .attr("markerWidth", 10)
      .attr("refX", 5)
      .attr("refY", 2.5)
      .attr("orient", "auto")
    .append("path")
      .attr("fill", endColor)
      .attr("d", "M0,0v5l7,-2.5Z");

  svg.append("defs")
    .selectAll("linearGradient")
    .data(data)
    .join("linearGradient")
      .attr("id", (d, i) => gradientIds[i].id)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => x(d.POP_1980))
      .attr("x2", d => x(d.POP_2015))
      .attr("y1", d => y(d.R90_10_1980))
      .attr("y2", d => y(d.R90_10_2015))
      .call(g => g.append("stop").attr("stop-color", startColor).attr("stop-opacity", 0.5))
      .call(g => g.append("stop").attr("offset", "100%").attr("stop-color", endColor));

  svg.append("g")
      .call(grid);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);

  svg.append("g")
      .attr("fill", "none")
    .selectAll("path")
    .data(data)
    .join("path")
      .attr("stroke", (d, i) => gradientIds[i])
      .attr("marker-end", arrowId)
      .attr("d", d => arc(x(d.POP_1980), y(d.R90_10_1980), x(d.POP_2015), y(d.R90_10_2015)));

  svg.append("g")
      .attr("fill", "currentColor")
    .selectAll("circle")
    .data(data)
    .join("circle")
      .attr("r", 1.75)
      .attr("cx", d => x(d.POP_1980))
      .attr("cy", d => y(d.R90_10_1980));

  svg.append("g")
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 4)
    .selectAll("text")
    .data(data.filter(d => d.highlight))
    .join("text")
      .attr("dy", d => d.R90_10_1980 > d.R90_10_2015 ? "1.2em" : "-0.5em")
      .attr("x", d => x(d.POP_2015))
      .attr("y", d => y(d.R90_10_2015))
      .text(d => d.nyt_display)
      .call(text => text.clone(true))
      .attr("fill", "none")
      .attr("stroke", "white");

  return svg.node();
}
);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
Object.assign(d3.csvParse(await FileAttachment("metros.csv").text(), d3.autoType), {
  x: "Population →",
  y: "↑ Inequality"
})
)});
  main.variable(observer("x")).define("x", ["d3","padLog","data","margin","width"], function(d3,padLog,data,margin,width){return(
d3.scaleLog()
    .domain(padLog(d3.extent(data.flatMap(d => [d.POP_1980, d.POP_2015])), 0.1))
    .rangeRound([margin.left, width - margin.right])
)});
  main.variable(observer("y")).define("y", ["d3","padLinear","data","height","margin"], function(d3,padLinear,data,height,margin){return(
d3.scaleLinear()
    .domain(padLinear(d3.extent(data.flatMap(d => [d.R90_10_1980, d.R90_10_2015])), 0.1))
    .rangeRound([height - margin.bottom, margin.top])
)});
  main.variable(observer("padLinear")).define("padLinear", function(){return(
function padLinear([x0, x1], k) {
  const dx = (x1 - x0) * k / 2;
  return [x0 - dx, x1 + dx];
}
)});
  main.variable(observer("padLog")).define("padLog", ["padLinear"], function(padLinear){return(
function padLog(x, k) {
  return padLinear(x.map(Math.log), k).map(Math.exp);
}
)});
  main.variable(observer("endColor")).define("endColor", ["d3"], function(d3){return(
d3.schemeCategory10[3]
)});
  main.variable(observer("startColor")).define("startColor", ["d3"], function(d3){return(
d3.schemeCategory10[1]
)});
  main.variable(observer("arc")).define("arc", function(){return(
function arc(x1, y1, x2, y2) {
  const r = Math.hypot(x1 - x2, y1 - y2) * 2;
  return `
    M${x1},${y1}
    A${r},${r} 0,0,1 ${x2},${y2}
  `;
}
)});
  main.variable(observer("grid")).define("grid", ["x","margin","height","y","width"], function(x,margin,height,y,width){return(
g => g
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.1)
    .call(g => g.append("g")
      .selectAll("line")
      .data(x.ticks())
      .join("line")
        .attr("x1", d => 0.5 + x(d))
        .attr("x2", d => 0.5 + x(d))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom))
    .call(g => g.append("g")
      .selectAll("line")
      .data(y.ticks())
      .join("line")
        .attr("y1", d => 0.5 + y(d))
        .attr("y2", d => 0.5 + y(d))
        .attr("x1", margin.left)
        .attr("x2", width - margin.right))
)});
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x","width","data"], function(height,margin,d3,x,width,data){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80, ".1s"))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", width)
        .attr("y", margin.bottom - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(data.x))
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y","data"], function(margin,d3,y,data){return(
g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(data.y))
)});
  main.variable(observer("height")).define("height", function(){return(
640
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 24, right: 10, bottom: 34, left: 40}
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  return main;
}
