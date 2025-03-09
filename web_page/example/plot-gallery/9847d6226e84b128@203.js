// https://observablehq.com/@analyzer2004/plot-gallery@203
import define1 from "./0edfeb766ced5a8c@171.js";
import define2 from "./df2f4b85689c53df@914.js";
import define3 from "./a2e58f97fd5e8d7c@620.js";
import define4 from "./914e43ec3e9f41dc@893.js";
import define5 from "./6c99aa23eaa7627f@393.js";
import define6 from "./639dfe72ba9db423@932.js";
import define7 from "./a33468b95d0b15b0@703.js";
import define8 from "./f3d342db2d382751@724.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["2012sales.csv",new URL("./files/7b86174ca228dca0179445dd15d8d36d399066727c07faac13b965ddf4be79a454c9bd6dc3039a5255db5a683403487828160b6bde3417689ba7553a196d167d",import.meta.url)],["small.json",new URL("./files/4a374bd4f30c5040234517fc2c4d4338891d66b3c832b1cd3a749c89946408e34de12f55f069979cfeff1f80ee2c7aa375244ee6361493485ddef718f981d4da",import.meta.url)],["large.json",new URL("./files/2167d1ceddb312980b15e49828dedbf680732f448c86ff7d3864f2f22e668c286a8cb621cd14cee6cf2c5a743f6982494d8ed2aeb0123f132dd9934c06cc8cfb",import.meta.url)],["weatherdata.csv",new URL("./files/1cfe3e19d53cb00b79a73226ef0d9b2eadcbe1f5c43ec34d665af93566bb1f614e260070f839abf14abc32ad53b75c16f664e104151f674542f8351d3f3f0b8d",import.meta.url)],["2019la.csv",new URL("./files/3a6aea8981b44551c1707406aa610b9351c3db48cccf7facbb6fd85a131ae0eee5c7c6ecd9fb15818a0c70b30d323882989f9472a7db45a1fa67863f3fb317b9",import.meta.url)],["2019sea.csv",new URL("./files/0a24e6adff890d02678872ed40c6e4340a80f27646899c31a282ecf8f6af7a2f896c938469e455b84478473166101f77458590b087b82833acd119fa4aa8d6b8",import.meta.url)],["2019sf.csv",new URL("./files/51fae136ca137be75dcb7ff081c9052ec4754e7a7197ed4b06ee35797a50e01c896cf3aaa001cb244d60f4281d98ed8f6bf2836398aac03c65ee067f71d6c9af",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Hello, Plot!`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Circle Packing`
)});
  main.variable(observer()).define(["flare2","d3","Plot","width","title"], function(flare2,d3,Plot,width,title)
{
  const rs = flare2.map(d => d.r),
        max_x = d3.max(flare2.map(d => d.x)),
        max_y = d3.max(flare2.map(d => d.y));
  
  const labels = flare2
  .filter(d => d.height === 0)
  .flatMap(d => {
    const labels = d.data.name.split(/(?=[A-Z][a-z])|\s+/g);
    return labels.map((l, i) => ({
      data: d.data,
      x: d.x,
      y: d.y + (i - (labels.length - 1) / 2) * 10,
      // Not accurate, just make it readable
      label: l.length * 3 < d.r * 2 ? l : ""
    }))
  })
  
  return Plot.plot({
    width: width,
    height: width,
    //use scale.type=identity since everything is already in pixels
    //x: {axis: null, domain: [0, max_x], range: [0, max_x]},
    //y: {axis: null, domain: [0, max_y], range: [0, max_y]},
    //r: {domain: rs, range: rs},
    x: {axis: null, type: "identity"},
    y: {axis: null, type: "identity"},
    r: {type: "identity"},
    color: {type: "sequential", scheme: "magma", domain: [8, 0], reverse: true},
    marks: [
      Plot.dot(flare2, {
        x: "x",
        y: "y",
        r: "r",
        fill: "height",
        title: title
      }),
      Plot.text(labels, {
        x: "x",
        y: "y",
        text: d => d.label,
        title: title
      })
    ]
  })
}
);
  main.variable(observer("title")).define("title", function(){return(
d => `${d.data.name}\n${d.value ? d.value : d.data.value}`
)});
  main.variable(observer("flare2")).define("flare2", ["d3","width","flare2_src"], function(d3,width,flare2_src)
{  
  const root = d3.pack()
    .size([width, width])
    .padding(3)(
      d3.hierarchy(flare2_src)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value)
    );
  return root.descendants(); 
}
);
  const child1 = runtime.module(define1);
  main.import("data", "flare2_src", child1);
  main.variable(observer()).define(["md"], function(md){return(
md`## Grid Map`
)});
  main.variable(observer("viewof days")).define("viewof days", ["Range"], function(Range){return(
Range([1, 30], {step: 1, value: 7, label: "New cases in the last n days"})
)});
  main.variable(observer("days")).define("days", ["Generators", "viewof days"], (G, _) => G.input(_));
  main.variable(observer()).define(["Plot","cells"], function(Plot,cells){return(
Plot.plot({
  width: 800,
  height: 560,
  padding: 0,
  x: {axis: null},
  y: {axis: null},
  color: {scheme: "bupu"}, 
  marks: cells
})
)});
  main.variable(observer("cells")).define("cells", ["d3","mapData","Plot"], function(d3,mapData,Plot)
{
  const max = d3.max(mapData.map(d => d.total));
  return [
    Plot.cell(mapData, {
      x: "col",
      y: "row",
      rx: 6, ry: 6,
      fill: "total",
      inset: 1,
      title: title
    }),
    plotText("0em", "code"),
    plotText("1em", d => d.total.toLocaleString("en"))
  ]
  
  function plotText(dy, text) {
    return Plot.text(mapData, {
      x: "col",
      y: "row",
      dy: dy,    
      fontWeight: "bold",
      fill: d => max - d.total,
      text: text,      
      title: title
    })
  }
  
  function title(d) {
    return `${d.state}\n${d.total}`
  }
}
);
  main.variable(observer("mapData")).define("mapData", ["getStatesLastNDays","days","GridMap","map"], function(getStatesLastNDays,days,GridMap,map)
{
  const src = getStatesLastNDays("newcases", days, false, true); 
  return new GridMap()
    .field({name: "state", code: "code", values: src.columns.slice(2)})
    .mapGrid(map)
    .data(src)
    .process();
}
);
  const child2 = runtime.module(define2);
  main.import("getStatesLastNDays", child2);
  const child3 = runtime.module(define3);
  main.import("Range", child3);
  const child4 = runtime.module(define4);
  main.import("GridMap", child4);
  main.import("map", child4);
  main.variable(observer()).define(["md"], function(md){return(
md`## Electricity Usage, 2019`
)});
  main.variable(observer()).define(["Plot","width","pge_src","formatDate","formatUsage"], function(Plot,width,pge_src,formatDate,formatUsage){return(
Plot.plot({
  width: width,    
  y: {grid: true, label: "Usage (kW)"},
  color: {type: "diverging", scheme: "BuRd"},
  marks: [
    Plot.ruleY([0]),
    Plot.dot(
      pge_src, 
      {
        x: "date", 
        y: "usage", 
        stroke: "usage",
        title: d => `${formatDate(d.date)}\n${formatUsage(d.usage)} kW`
      }
    )    
  ]
})
)});
  main.variable(observer()).define(["Plot","width","pge_height","formatHour","formatDay","pge_src","d3","formatDate","formatUsage"], function(Plot,width,pge_height,formatHour,formatDay,pge_src,d3,formatDate,formatUsage){return(
Plot.plot({ 
  width: width,
  height: pge_height,  
  padding: 0,
  x: {axis: "top", tickFormat: formatHour, round: false},
  y: {tickFormat: formatDay, round: false},
  color: {type: "diverging", scheme: "BuRd"},
  marks: [
    Plot.cell(
      pge_src,
      {
        x: d => d.date.getHours(),
        y: d => d3.timeDay(d.date),
        fill: "usage",
        inset: 0.5,
        title: d => `${formatDate(d.date)}\n${formatUsage(d.usage)} kW`
      }
    )
  ]
})
)});
  main.variable(observer("pge_height")).define("pge_height", ["d3","dateExtent"], function(d3,dateExtent){return(
(d3.timeDay.count(...dateExtent) + 1) * 10
)});
  const child5 = runtime.module(define5);
  main.import("data", "pge_src", child5);
  main.import("formatUsage", child5);
  main.import("formatDate", child5);
  main.import("formatDay", child5);
  main.import("formatHour", child5);
  main.import("dateExtent", child5);
  main.variable(observer()).define(["md"], function(md){return(
md`## Hierarchical Heatmap`
)});
  main.variable(observer("viewof dataset")).define("viewof dataset", ["Radio"], function(Radio){return(
Radio(["Small", "Large"], {label: "Dataset", value: "Large"})
)});
  main.variable(observer("dataset")).define("dataset", ["Generators", "viewof dataset"], (G, _) => G.input(_));
  main.variable(observer()).define(["Heatmap","width","hh_height","d3","hhdata","Plot","plotNodes","plotLegend"], function(Heatmap,width,hh_height,d3,hhdata,Plot,plotNodes,plotLegend)
{  
  const map = new Heatmap()
    .size(width, hh_height)
    .padding(1)
    .mapHeight(10)
    .data(d3.hierarchy(hhdata));
    
  const nodes = map.populate(),
        legend = map.legend(9),
        nodeColors = nodes.descendants().map(d => d.color),
        legendColors = legend.cells.map(d => d.color);    
  const colors = [...new Set(nodeColors.concat(legendColors))];
    
  return Plot.plot({
    width,
    height: hh_height + 40,
    x: {axis: null},
    y: {axis: null, reverse: true},    
    color: {
      domain: colors,
      range: colors
    },
    marks: [
      plotNodes(nodes),
      plotLegend(legend)
    ]
  });
}
);
  main.variable(observer("plotNodes")).define("plotNodes", ["Plot","d3"], function(Plot,d3){return(
nodes => {
  return [
    Plot.rect(nodes, {
      x1: "x0", y1: "y0",
      x2: "x1", y2: "y1",
      rx: 3, ry: 3,
      fill: "color"
    }),
    plotLabel("-0.2em", d => d.data ? d.data.name : ""),
    plotLabel("1em", d => d.data ? d3.format("$.2s")(d.data.value) : "")
  ]
  
  function plotLabel(dy, text) {
    return Plot.text(nodes, {
      x: d => d.x0 + (d.x1 - d.x0) / 2,
      y: d => d.y0 + (d.y1 - d.y0) / 2,
      dy: dy,
      fill: "white",
      fontWeight: "bold",
      textAnchor: "middle",
      text: text
    })
  }
}
)});
  main.variable(observer("plotLegend")).define("plotLegend", ["width","Plot","hh_height"], function(width,Plot,hh_height){return(
legend => {
  const legendLeft = width - legend.width;        
  return [
    Plot.text([null], {
      x: () => legendLeft + legend.width, y: () => hh_height,
      dy: "1em",
      textAnchor: "end",
      fontWeight: "bold",
      text: () => "Sales (USD)"
    }),
    Plot.rect(legend.cells, {
      x1: d => legendLeft + d.x, x2: d => legendLeft + d.x + d.width,
      y1: () => hh_height + 15, y2: () => hh_height + 25,
      fill: "color"
    }),
    Plot.text(legend.cells, {
      x: d => legendLeft + d.x, y: () => hh_height + 40,
      dy: "-0.5em",
      textAnchor: "start",
      fontWeight: "bold",
      text: d => d.label
    })
  ]
}
)});
  main.variable(observer("hhdata")).define("hhdata", ["dataset","FileAttachment"], async function(dataset,FileAttachment){return(
dataset === "Small" ? await FileAttachment("small.json").json() : await FileAttachment("large.json").json()
)});
  main.variable(observer("hh_height")).define("hh_height", function(){return(
640
)});
  const child6 = runtime.module(define6);
  main.import("Heatmap", child6);
  const child7 = runtime.module(define3);
  main.import("Radio", child7);
  main.variable(observer()).define(["md"], function(md){return(
md`## Messing around with data`
)});
  main.variable(observer()).define(["Plot","width","data"], function(Plot,width,data){return(
Plot.plot({
  width: width,
  x: {
    label: "Month",
    tickFormat: Plot.formatMonth("en", "short")
  },
  y: {
    grid: true,
    label: "Sales Amount",
    tickFormat: "s",    
  },
  marks: [
    Plot.barY(data, Plot.groupX({y: "sum"}, {x: "OrderMonth", y: "SalesAmount", fill: "#4e79a7"}))
  ]
})
)});
  main.variable(observer()).define(["data","Plot","width","html","Swatches","d3"], function(data,Plot,width,html,Swatches,d3)
{
  const region = "SalesTerritoryRegion";
  const eu_sales = data.filter(d => d.SalesTerritoryGroup === "Europe");
  const regions = [...new Set(eu_sales.map(d => d.SalesTerritoryRegion))];

  const plot = Plot.plot({
    width: width,
    x: {      
      label: null,
      domain: regions
    },
    y: {
      grid: true, 
      label: "Sales Amount",
      tickFormat: "s"
    },
    color: {
      domain: regions, 
      color: "tableau10"
    },
    fx: {
      label: null, 
      tickFormat: d => `Q${d}`
    },
    facet: {
      data: eu_sales, 
      x: "OrderQtr"
    },
    marks: [      
      Plot.barY(
        eu_sales,
        Plot.groupX({y: "sum"}, {x: region, y: "SalesAmount", fill: region})
      )
    ]
  })
  
  return html`<div>${[
    Swatches({color: d3.scaleOrdinal(regions, d3.schemeTableau10)}),
    plot
  ]}`;
}
);
  main.variable(observer()).define(["data","Plot","width","wrap","Swatches","d3"], function(data,Plot,width,wrap,Swatches,d3)
{
  const region = "SalesTerritoryRegion";
  const us_sales = data.filter(d => d.SalesTerritoryCountry === "United States");
  const regions = [...new Set(us_sales.map(d => d.SalesTerritoryRegion))].sort();

  const plot = Plot.plot({
    width: width,
    y: {
      grid: true, 
      label: "Sales Amount",
      tickFormat: "s"
    },
    color: {
      domain: regions, 
      color: "tableau10"
    },
    fx: { 
      label: null,
      tickFormat: d => `Q${d}`
    },
    facet: {
      data: us_sales, 
      x: "OrderQtr"
    },
    marks: [
      Plot.barY(
        us_sales,
        Plot.stackY(Plot.groupZ({y: "sum"}, {y: "SalesAmount", fill: region}))
      )
    ]
  });
  
  return wrap(
    Swatches({color: d3.scaleOrdinal(regions, d3.schemeTableau10)}),
    plot
  );
}
);
  main.variable(observer()).define(["data","Plot","width","wrap","Swatches","d3"], function(data,Plot,width,wrap,Swatches,d3)
{
  const countries = [...new Set(data.map(d => d.SalesTerritoryCountry))].sort();
  const plot = Plot.plot({
    width: width,
    x: {
      percent: true,
      label: "Sales Amount(%)"
    },
    marks: [
      Plot.barX(data, Plot.stackX(Plot.groupZ({x: "proportion"}, {fill: "SalesTerritoryCountry"})))
    ]
  });
  
  return wrap(
    Swatches({color: d3.scaleOrdinal(countries, d3.schemeTableau10)}),
    plot
  );
}
);
  main.variable(observer()).define(["data","Plot","width","wrap","Swatches","d3"], function(data,Plot,width,wrap,Swatches,d3)
{
  const clothing = data.filter(d => d.Category === "Clothing");
  const subcategories = [...new Set(clothing.map(d => d.Subcategory))];
  
  const plot = Plot.plot({
    width: width,
    x: {
      label: "Month",
      tickFormat: Plot.formatMonth("en", "short")
    },
    y: {
      grid: true,
      label: "Sales Amount",
      tickFormat: "s",    
    },
    color: {
      domain: subcategories, 
      color: "tableau10"
    },
    marks: [
      Plot.areaY(
        clothing, 
        Plot.stackY(Plot.groupX({y: "sum"}, {x: "OrderMonth", y: "SalesAmount", fill: "Subcategory"})))
    ]
  });
  
  return wrap(
    Swatches({color: d3.scaleOrdinal(subcategories, d3.schemeTableau10)}),
    plot
  );
}
);
  main.variable(observer()).define(["data","Plot","width","d3","wrap","Swatches"], function(data,Plot,width,d3,wrap,Swatches)
{
  const clothing = data.filter(d => d.Category === "Clothing" && d.SalesTerritoryCountry === "United States");
  const bts = [...new Set(clothing.map(d => d.BusinessType))];
  
  const plot = Plot.plot({
    width: width,
    marginLeft: 80,
    height: 600,
    grid: true,
    x: {type: "log", nice: true, tickFormat: ","},
    y: {
      label: "subcategory",
      domain: d3.groupSort(clothing, g => -d3.sum(g, d => d.SalesAmount), d => d.Subcategory),
      inset: 5
    },
    fy: {
      label: "region",
      domain: d3.groupSort(clothing, g => -d3.sum(g, d => d.SalesAmount), d => d.SalesTerritoryRegion)
    },
    color: {
      domain: bts,
      type: "categorical"
    },
    facet: {
      data: clothing,
      y: "SalesTerritoryRegion",
      marginRight: 70
    },
    marks: [
      Plot.frame(),
      Plot.dot(clothing, Plot.groupY({x: "sum"}, {x: "SalesAmount", y: "Subcategory", stroke: "BusinessType"}))
    ]
  });
  
  return wrap(
    Swatches({color: d3.scaleOrdinal(bts, d3.schemeTableau10)}),
    plot
  );
}
);
  main.variable(observer()).define(["data","Plot","width"], function(data,Plot,width)
{
  const usclothing = data.filter(d => d.Category === "Clothing" && d.CountryRegionCode === "US")  
  const subcats = [...new Set(usclothing.map(d => d.Subcategory))];
  return Plot.plot({
    height: 480,
    width: width,
    marginLeft: 80,
    color: {scheme: "BuRd"},
    x: {
      round: false,
      label: "state"
    },
    y: {
      round: false,
      domain: subcats,
      label: "subcategory"
    },
    fy: {
      label: "quarter", 
      domain: [1,2,3,4],
      tickFormat: d => `Q${d}`
    },      
    facet: {
      data: usclothing,
      y: "OrderQtr"
    },
    marks: [
      Plot.cell(
        usclothing, 
        Plot.group(
          {fill: "sum"},
          {
            y: "Subcategory",
            x: "StateProvinceCode",
            fill: "GrossProfit"
          }))
    ]
  })
}
);
  main.variable(observer()).define(["data","Plot","width"], function(data,Plot,width)
{
  const helmets = data.filter(d => d.Subcategory === "Helmets" && d.SalesTerritoryCountry === "United States")
  return Plot.plot({
    height: 600,
    width: width,    
    inset: 10,
    facet: {
      data: helmets,
      x: "Product",
      y: "SalesTerritoryRegion",
      marginRight: 70
    },
    fy: {label: null},
    x: {tickFormat: Plot.formatMonth("en", "short")},
    y: {label: "sales", grid: true},
    marks: [      
      Plot.line(helmets.slice(), Plot.groupX({y: "mean"}, {x: "OrderMonth", y: "SalesAmount", stroke: "#bbb"})),
      Plot.line(helmets, Plot.groupX({y: "mean"}, {x: "OrderMonth", y: "SalesAmount", stroke: "#4e79a7"}))
    ]              
  })
}
);
  main.variable(observer("wrap")).define("wrap", function(){return(
(...elems) => {
  const div = document.createElement("div");
  elems.forEach(el => div.appendChild(el));
  return div;
}
)});
  main.variable(observer("data")).define("data", ["FileAttachment"], async function(FileAttachment){return(
await FileAttachment("2012sales.csv").csv({typed: true})
)});
  const child8 = runtime.module(define7);
  main.import("swatches", "Swatches", child8);
  main.variable(observer()).define(["md"], function(md){return(
md`## Weather`
)});
  main.variable(observer()).define(["Plot","width","weather_sf"], function(Plot,width,weather_sf){return(
Plot.plot({
  width: width,
  y: {grid: true, label: "°F"},
  marks: [
    Plot.areaY(weather_sf, {x: "Date time", y1: "Minimum Temperature", y2: "Maximum Temperature", fill: "#d5e1fc"}),
    //Plot.line(weather, Plot.windowY({x: "Date time", y: "Temperature", k: 7, stroke: "#06af8f"})),
    Plot.dot(weather_sf, {x: "Date time", y: "Temperature", stroke: "#06af8f"}),
    Plot.line(weather_sf, Plot.windowY({x: "Date time", y: "Maximum Temperature", k: 7, stroke: "#d97575"})),
    Plot.line(weather_sf, Plot.windowY({x: "Date time", y: "Minimum Temperature", k: 7, stroke: "#4e79d9"}))
  ]
})
)});
  main.variable(observer()).define(["Plot","width","weather_sf"], function(Plot,width,weather_sf){return(
Plot.plot({
  width: width,
  y: {grid: true, label: "°F"},
  color: {type: "sequential", scheme: "BuRd"},
  marks: [
    Plot.ruleY([55]),
    Plot.dot(weather_sf, {x: "Date time", y: "Temperature", stroke: "Temperature"})    
  ]
})
)});
  main.variable(observer()).define(["weather_sf","weather_la","weather_sea","Plot","width"], function(weather_sf,weather_la,weather_sea,Plot,width)
{
  const grouped = weather_sf.concat(weather_la).concat(weather_sea);  
  return Plot.plot({
    width: width,
    inset: 10,
    facet: {
      data: grouped,
      x: "Address"
    },    
    y: {label: "°F"},
    color: {type: "sequential", scheme: "BuRd"},
    marks: [
      Plot.ruleY([55]),
      Plot.dot(grouped.slice(), {x: "Date time", y: "Temperature", stroke: "#eee"}),    
      Plot.dot(grouped, {x: "Date time", y: "Temperature", stroke: "Temperature"}),
      Plot.line(grouped, Plot.windowY({x: "Date time", y: "Temperature", k: 7, stroke: "#86c2b6"}))
    ]
  })
}
);
  main.variable(observer()).define(["Plot","width","temperature"], function(Plot,width,temperature){return(
Plot.plot({
  width: width,  
  x: {tickFormat: d => d.toString()},
  y: {grid: true, label: "YoY (%)"},
  color: {type: "sequential", scheme: "BuRd"},
  marks: [
    Plot.ruleY([0]),
    Plot.dot(
      temperature, 
      {
        x: "year", 
        y: "yoy", 
        stroke: "yoy", 
        title: d => `${d.year} - ${Plot.formatMonth("en", "short")(d.month)}\n${d.yoy}%`
      }
    )    
  ]
})
)});
  main.variable(observer()).define(["Plot","width","combined"], function(Plot,width,combined){return(
Plot.plot({
  width: width,
  x: {axis: null, domain: combined.city},
  y: {grid: true, label: "°F"},
  color: {domain: combined.city, color: "tableau10"},
  fx: {tickFormat: Plot.formatMonth("en", "short")}, 
  facet: {data: combined, x: "month"},
  marks: [        
    Plot.barY(combined, {x: "city", y: "temp", fill: "city", title: "city"})
  ]
})
)});
  main.variable(observer()).define(["Plot","width","combined"], function(Plot,width,combined){return(
Plot.plot({
  width: width,
  x: {tickFormat: Plot.formatMonth("en", "short")}, 
  y: {grid: true, label: "°F"},
  marks: [    
    Plot.barY(combined, {x: "month", y: "temp", fill: "city", fillOpacity: 0.2})
  ]
})
)});
  main.variable(observer()).define(["Plot","width","weather_la"], function(Plot,width,weather_la){return(
Plot.plot({
  width: width,
  x: {tickFormat: Plot.formatMonth("en", "short")},
  color: {scheme: "BuYlRd"},
  marks: [
    Plot.cell(weather_la, {x: d => d["Date time"].getUTCMonth(), fillOpacity: 0.1, fill: "Temperature"})
  ]
})
)});
  main.variable(observer()).define(["Plot","width","weather_la"], function(Plot,width,weather_la){return(
Plot.plot({
  width: width,
  height: 300,
  padding: 0,
  y: {tickFormat: Plot.formatMonth("en", "short")},
  color: {scheme: "BuYlRd"}, 
  marks: [
    Plot.cell(
      weather_la, 
      Plot.group({fill: "max"}, {
        x: d => d["Date time"].getUTCDate(),
        y: d => d["Date time"].getUTCMonth(),
        fill: "Temperature",
        inset: 0.5
      })
    ),
    Plot.text(
      weather_la,
      {
        x: d => d["Date time"].getUTCDate(),
        y: d => d["Date time"].getUTCMonth(),
        fill: "#666666",
        fontWeight: "bold",
        text: d => d["Temperature"].toFixed(0)
      }
    ) 
  ]
})
)});
  main.variable(observer()).define(["Plot","width","weather_sf"], function(Plot,width,weather_sf){return(
Plot.plot({
  width: width,
  y: {grid: true, label: "°F"},
  color: {type: "sequential", scheme: "BuRd"},
  marks: [
    Plot.ruleY([55]),
    Plot.ruleX(weather_sf, {x: "Date time", y: "Temperature", stroke: "Temperature", strokeWidth:2})    
  ]
})
)});
  main.variable(observer()).define(["Plot","width","weather_la"], function(Plot,width,weather_la){return(
Plot.plot({
  width: width,
  color: {scheme: "BuYlRd"},
  marks: [
    Plot.tickX(weather_la, {x: d => d["Date time"], stroke: "Temperature", strokeWidth:2})
  ]
})
)});
  main.variable(observer("weather_sf")).define("weather_sf", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("2019sf.csv").csv({typed: true})
)});
  main.variable(observer("weather_la")).define("weather_la", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("2019la.csv").csv({typed: true})
)});
  main.variable(observer("weather_sea")).define("weather_sea", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("2019sea.csv").csv({typed: true})
)});
  main.variable(observer("combined")).define("combined", ["d3","weather_sf","weather_la"], function(d3,weather_sf,weather_la)
{
  const sf = d3.rollups(weather_sf, v => d3.mean(v, d => d["Temperature"]), d => d["Date time"].getUTCMonth());
  const la = d3.rollups(weather_la, v => d3.mean(v, d => d["Temperature"]), d => d["Date time"].getUTCMonth());
  return transform("SF", sf).concat(transform("LA", la));
  
  function transform(city, data) {
    return data.map(d => ({
      city: city,
      month: d[0],
      temp: d[1]
    }));
  }
}
);
  main.variable(observer("temperature")).define("temperature", ["FileAttachment"], async function(FileAttachment)
{
  const src = await FileAttachment("weatherdata.csv").csv();
  return src.map(d => ({
    year: +d.Month.substring(0, 4),
    month: +d.Month.substring(4, 6),
    yoy: +d.Value
  }));
}
);
  const child9 = runtime.module(define8);
  main.import("Plot", child9);
  main.import("d3", child9);
  main.variable(observer()).define(["md"], function(md){return(
md`🌐[ericlo.dev](https://ericlo.dev) 🐱[GitHub Repositories](https://github.com/analyzer2004?tab=repositories) 🐦[Twitter](https://twitter.com/analyzer2004)`
)});
  return main;
}
