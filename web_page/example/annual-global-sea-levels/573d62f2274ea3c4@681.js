// https://observablehq.com/@terezaif/annual-global-sea-levels@681
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["30daychartGSL@2.csv",new URL("./files/793f9edb2a3bdf05a7ad477eb71dfabaf424c37a550c9cfd739fb18b4241b18939dfcc7b8dff9f63ac76c26d0b658db67ee953bb348b1c08cabf0b4bac4ce5c2",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Annual Global Sea Levels

Sea levels (in millimeters) started to rise end of 18 century<sup>[[1](#footnote1)]</sup> and the list of costal cites most risk from sea level rising[[2](#footnote2)].

Day 19 of [30DayChartChallenge](https://twitter.com/30DayChartChall) - *global change* time series`
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","y","margin","data","x","color","y_min","x_bandwidth","cities","xAxis","yAxis"], function(d3,width,height,y,margin,data,x,color,y_min,x_bandwidth,cities,xAxis,yAxis)
{
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("font-family",'IBM Plex Mono');

  //title
  svg.append("text")
      .attr('x', 40)
      .attr('y', 30)
      .attr("dy", "1em")
      .attr("text-anchor", "start")
      .style("fill", "#E1AF00")//"#F21A00")
      .style("font-size", width/40)
      .style("font-weight", 700)
      .html("GLOBAL SEA LEVELS");

  // comparison
   svg.append("text")
      .attr('x', width-2*width/30)
      .attr('y', 30)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .style("fill", "#3B9AB2")//"#F21A00")
      .style("font-size", width/50)
      .style("font-weight", 700)
      .html("1 mm sea level ~ 361.8GT iceberg");
  svg.append("text")
      .attr('x', width-2*width/30)
      .attr('y', 50)
      .attr("dy", "1em")
      .attr("text-anchor", "end")
      .style("fill", "#3B9AB2")//"#F21A00")
      .style("font-size", width/50)
      .style("font-weight", 700)
      .html("6M Empire State Buildings...");
  
   svg.append("rect")
    .attr("class", "bars")
    .attr("x", 0)
    .attr("y", y(260))
    .attr("fill", "#EBCC2A")
    .style("opacity", 0.2)
    .attr("height", height+margin.top - y(0)+10)
    .attr("width", width);

   svg.append("rect")
    .attr("class", "bars")
    .attr("x", 0)
    .attr("y", y(0))
    .attr("fill", "#78B7C5")
    .style("opacity", 0.2)
    .attr("height", height+margin.top - y(0))
    .attr("width",  width);

  //bars
  svg.append("g")
      .attr("class", "bars")
    .selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", d => x(d.name))
      .attr("y", d => y(d.value))
      .attr("fill", d => color(d.value))
      .attr("height", d => y(y_min) - y(d.value)+10)
      .attr("width", x_bandwidth);


  const yearLine = svg.append('line')
    .attr('x1', x(new Date('1860')))
    .attr('x2', x(new Date('1860')))
    .attr('y1', y(0))
    .attr('y2', height)
    .attr('stroke', '#446455');

  svg.append('text')
    .attr('x', x(new Date('1860'))+2)
    .attr('y', y(-190))
    .attr('font-size', width/60)
    .attr('fill',"#446455")
    .style("font-weight", 700)
    .text( "→ Sea level starting rising" );

        // Add median speed
  const medmedLine = svg.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(0))
    .attr('y2', y(0))
    .attr('stroke', '#F21A00');
  
  // Add median text

  for (let i=0;i <3; i++){
    svg.append('text')
    .attr('x', margin.left )
    .attr('y', y(0)-15 *i-10)
    .attr('font-size', width/80)
    .attr('fill',"#446455")
    .style("font-weight", 700)
    .text( cities[i] );
    
  };
  

  svg.append("g")
      .attr("class", "x-axis")
      .call(xAxis)
      .selectAll("text")  
         .style("text-anchor", "end");

  svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md `## Data sources:
`
)});
  main.variable(observer("footnote1")).define("footnote1", ["footnote"], function(footnote){return(
footnote("World Meteorological Organisation", 1, "World Meteorological Organisation")
)});
  main.variable(observer()).define(["md"], function(md){return(
md `[World Meteorological Organisation](https://climexp.knmi.nl/getindices.cgi?WMO=PSMSLData/gsl_ann&STATION=global_sea_level&TYPE=i&id=someone@somewhere&NPERYEAR=1)`
)});
  main.variable(observer("footnote2")).define("footnote2", ["footnote"], function(footnote){return(
footnote("Costal cities", 2, "Coastal cities and sea level rise")
)});
  main.variable(observer()).define(["md"], function(md){return(
md `[Coastal cities and sea level rise](http://www.coastalwiki.org/wiki/Coastal_cities_and_sea_level_rise)`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`[Estimating glacier contribution to sea level rise](http://www.antarcticglaciers.org/glaciers-and-climate/estimating-glacier-contribution-to-sea-level-rise/)`
)});
  main.variable(observer("color")).define("color", ["d3","data"], function(d3,data){return(
d3.scaleSequential()
  .domain([d3.min(data, d => d.value), d3.max(data, d => d.value)])
.interpolator(d3.piecewise(d3.interpolateRgb.gamma(0.5), ["#3B9AB2","#78B7C5", "#EBCC2A",  "#F21A00"]))
)});
  main.variable(observer("padding")).define("padding", function(){return(
0.2
)});
  main.variable(observer("x_bandwidth")).define("x_bandwidth", ["width","margin","max_year","min_year","padding"], function(width,margin,max_year,min_year,padding){return(
(width - margin.right - margin.left) / (max_year.getFullYear() - min_year.getFullYear()) - padding
)});
  main.variable(observer("min_year")).define("min_year", ["d3","data"], function(d3,data){return(
d3.min(data, d => d.name)
)});
  main.variable(observer("max_year")).define("max_year", ["d3","data"], function(d3,data){return(
d3.max(data, d => d.name)
)});
  main.variable(observer("x")).define("x", ["d3","data","margin","width"], function(d3,data,margin,width){return(
d3
    .scaleTime()
    .domain([d3.min(data, d => d.name), d3.max(data, d => d.name) ])
    .range([margin.left, width])
    .nice()
)});
  main.variable(observer("y_min")).define("y_min", ["d3","data"], function(d3,data){return(
d3.min(data, d => d.value)
)});
  main.variable(observer("y")).define("y", ["d3","data","height","margin"], function(d3,data,height,margin){return(
d3.scaleLinear()
    .domain([d3.min(data, d => d.value), d3.max(data, d => d.value)]).nice()
    .range([height - margin.bottom, margin.top])
)});
  main.variable(observer("xAxis")).define("xAxis", ["height","margin","d3","x"], function(height,margin,d3,x){return(
g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
          .tickSizeOuter(0))
)});
  main.variable(observer("yAxis")).define("yAxis", ["margin","d3","y"], function(margin,d3,y){return(
g => g
    .attr("transform", `translate(${margin.left -10},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("↑ mm "))
)});
  main.variable(observer("height")).define("height", function(){return(
500
)});
  main.variable(observer("margin")).define("margin", function(){return(
{top: 20, right: 10, bottom: 30, left: 50}
)});
  main.variable(observer()).define(["md"], function(md){return(
md `## Data`
)});
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("30daychartGSL@2.csv").text(), ({year, global_sea_level_mm}) => ({name: new Date(year), value: +global_sea_level_mm})).sort((a, b) => b.year - a.year)
)});
  main.variable(observer("cities")).define("cities", function(){return(
["Abidjan, Accra, Alexandria, Bangkok, Dakka, Fuzhou, Guangzhou,Hai Phong"," Hong Kong, Jakarta, Karachi,Kalkota, Lagos, Lomé, London, Manila","Miami, NYC, Ningbo, Rangoon, Shanghai, Singapore, Zhanjiang"]
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  main.variable(observer()).define(["html"], function(html){return(
html`<link href="https://fonts.googleapis.com/css?family=IBM+Plex+Mono&display=swap" rel="stylesheet">`
)});
  main.variable(observer("footnote")).define("footnote", ["html"], function(html){return(
(referencingCellName, number, text) => {
  return html`<ol start=\"${number}"><li><a href="#${referencingCellName}">^</a> ${text}</li></ol>`;
}
)});
  return main;
}
