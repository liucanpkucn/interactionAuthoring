// https://observablehq.com/@analyzer2004/gridcartogram@893
import define1 from "./363f88951485f09d@1787.js";
import define2 from "./df2f4b85689c53df@914.js";
import define3 from "./450051d7f1174df8@252.js";
import define4 from "./8d271c22db968ab0@158.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Grid Cartogram component with live COVID demos (plus a MapEditor)

Grid Cartogram is a prevalent type of map for showing statistical data based on geographic location. It is a distorted form that each cell of the grid represents one subdivision. The cleanness and simplicity help users understand the information quickly without getting distracted by other elements on a normal map.

Below is a US COVID map that visualizes the live data from NYT's repository (transformed into the last N days format). The map demonstrates the main features of the **GridMap** as well as an application of a real use case. When you hover the mouse over a state, a mini chart (pie for circle/treemap for square) will pop up showing the daily numbers.

For reusability, the **GridMap** is encapsulated as a component that can be used anywhere you need a grid cartogram. **See below or [GitHub](https://github.com/analyzer2004/gridmap) for tutorial, API reference, and source code**.`
)});
  main.variable(observer("viewof options")).define("viewof options", ["form","html"], function(form,html){return(
form(html`<form style="font-size: 12pt">
New COVID<label for="cases"><input name="field" id="cases" type="radio" value="newcases" group="f" checked>cases</label>
<label for="deaths"><input name="field" id="deaths" type="radio" value="newdeaths" group="f">deaths</label>&nbsp;
in the last <input name="days" type="range" min="3" max="14" value="7" style="width: 100px"><span id="ndays"></span> days<br>
Shape: <label for="circle"><input name="shape" id="circle" type="radio" value="circle" group="s" checked>Circle</label>
<label for="square"><input name="shape" id="square" type="radio" value="square" group="s">Square</label>
<input type="checkbox" name="sizeByValue" checked>Size By Value</input>
<input type="checkbox" name="overlay" checked>Overlay</input>
<input type="checkbox" name="overlayLegend" checked>Overlay Legend</input>
<input type="checkbox" name="transition">Transition</input><br>
Color Scheme:
<select name="scheme">
<option value="RdPu">RdPu</option>
<option value="YlGnBu">YlGnBu</option>
<option value="YlOrRd">YlOrRd</option>
</select>
&nbsp;Overlay Scheme:
<select name="overlayScheme">
<option value="Category10">Category10</option>
<option value="Paired">Paired</option>
<option value="Set3" selected>Set3</option>
<option value="Tableau10">Tableau10</option>
</select>
</form>`)
)});
  main.variable(observer("options")).define("options", ["Generators", "viewof options"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["d3","options","GridMap","covid","map"], function(d3,options,GridMap,covid,map)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("viewBox", "0 0 1024 700");
  
  const p = options.scheme === "YlOrRd" ? 
        d3.interpolateYlOrRd : 
        options.scheme === "YlGnBu" ? d3.interpolateYlGnBu : d3.interpolateRdPu;
  
  const op = options.overlayScheme === "Category10" ? d3.schemeCategory10 :
        options.overlayScheme === "Paired" ? d3.schemePaired :
        options.overlayScheme === "Set3" ? d3.schemeSet3 : d3.schemeTableau10;
  
  const gmap = new GridMap(svg)
    .size([1024, 640])                
    .style({
      transition: options.transition,
      shape: options.shape,
      sizeByValue: options.sizeByValue,
      showOverlay: options.overlay,
      showOverlayLegend: options.overlayLegend,
      legendTitle: options.field === "newcases" ? "New Cases" : "New Deaths",
    })
    .cellPalette(p)
    .overlayPalette(op)
    .field({ 
      name: "state",
      code: "code",
      values: covid.columns.slice(2)
    })
    .mapGrid(map)
    .data(covid)
    .render();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`Below is another perfect use of the **GridMap**. Click the play button to see the daily growth and decline of each state's cases/deaths numbers from day one till now. **It gives you two very different visual impacts by turning on/off the 'Size By Value' option**.`
)});
  main.variable(observer("viewof dn")).define("viewof dn", ["Scrubber","d3","days"], function(Scrubber,d3,days){return(
Scrubber(d3.ticks(0, days - 1, days), {
  format: x => `Day ${x + 1}`,
  autoplay: false,
  alternate: false
})
)});
  main.variable(observer("dn")).define("dn", ["Generators", "viewof dn"], (G, _) => G.input(_));
  main.variable(observer("viewof options2")).define("viewof options2", ["form","html"], function(form,html){return(
form(html`<form style="font-size: 12pt">
COVID <label for="cases2"><input name="field" id="cases2" type="radio" value="cases" group="f" checked>cases</label>
<label for="deaths2"><input name="field" id="deaths2" type="radio" value="deaths" group="f">deaths</label>
<input type="checkbox" name="sizeByValue" checked>Size By Value</input>
&nbsp;Shape: 
<select name="shape">
<option value="circle">Circle</option>
<option value="square">Square</option>
</select>
&nbsp;Color Scheme:
<select name="scheme">
<option value="OrRd">OrRd</option>
<option value="YlGnBu">YlGnBu</option>
<option value="RdPu">RdPu</option>
</select></form>`)
)});
  main.variable(observer("options2")).define("options2", ["Generators", "viewof options2"], (G, _) => G.input(_));
  main.variable(observer("chart2")).define("chart2", ["d3","firstDay","dn","getStatesNumber","options2","GridMap","map"], function(d3,firstDay,dn,getStatesNumber,options2,GridMap,map)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("viewBox", "0 0 1024 700");  
  
  const fd = new Date(firstDay);  
  fd.setDate(fd.getDate() + dn);
  svg.append("text")
    .attr("dy", "1em")
    .style("font-size", "16pt").style("font-weight", "bold")
    .text(`${fd.getFullYear()}/${fd.getMonth() + 1}/${fd.getDate()}`);
  
  const data = getStatesNumber(options2.field, dn);
  const p = options2.scheme === "OrRd" ? 
        d3.interpolateOrRd : 
        options2.scheme === "YlGnBu" ? d3.interpolateYlGnBu : d3.interpolateRdPu;
  
  const gmap = new GridMap(svg)
    .size([1024, 680])                
    .style({
      shape: options2.shape,
      sizeByValue: options2.sizeByValue,
      showOverlay: false,
      showMapLegend: false
    })
    .cellPalette(p)
    .field({
      name: "state",
      code: "code",
      total: "number"
    })
    .mapGrid(map)
    .data(data)
    .render();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`## Tutorial`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`The **GridMap** is very straightforward to use. Let's start with rendering a basic map without binding numbers to it.`
)});
  main.variable(observer("chart3")).define("chart3", ["d3","GridMap","socal"], function(d3,GridMap,socal)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("width", 400)
    .attr("height", 300);    
  
  const gmap = new GridMap(svg)
    .size([400, 300])                
    .mapGrid(socal)    
    .render();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`Now, we can add some numbers by binding a dataset to the map.`
)});
  main.variable(observer("chart4")).define("chart4", ["d3","width","GridMap","socal","sales"], function(d3,width,GridMap,socal,sales)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("width", width)
    .attr("height", 430);    
  
  const g = svg.append("g").attr("transform", "translate(25,0)");  
  const gmap = new GridMap(g)
    .size([400, 400])
    .style({sizeByValue: false, legendTitle: "Sales(USD)"})
    .field({ code: "code", name: "name", total: "value" })
    .mapGrid(socal)
    .data(sales)
    .render();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`The mini pie chart and treemap are built-in functions for displaying additional details. These two charts below exemplify how to enable the overlay representing the quarterly numbers.`
)});
  main.variable(observer("chart5")).define("chart5", ["d3","width","GridMap","socal","qtrsales"], function(d3,width,GridMap,socal,qtrsales)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("width", width)
    .attr("height", 430);    
  
  const left = svg.append("g").attr("transform", "translate(25,0)");  
  const leftMap = new GridMap(left)
  .size([400, 400])
  .style({ shape: "circle", legendTitle: "Sales(USD)" })
  .field({ code: "code", name: "name", values: ["Q1", "Q2", "Q3", "Q4"] })
  .mapGrid(socal)
  .data(qtrsales)
  .render();
  
  const right = svg.append("g").attr("transform", "translate(450,0)");  
  const rightmap = new GridMap(right)
  .size([400, 400])
  .style({ shape: "square" })
  .cellPalette(d3.interpolateBrBG)
  .field({ code: "code", name: "name", values: ["Q1", "Q2", "Q3", "Q4"] })
  .mapGrid(socal)
  .data(qtrsales)
  .render();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`The overlay is customizable by implementing *customSquareOverly* and *customCircleOverlay*. This example demonstrates **how to replace the built-in treemap with column charts**.`
)});
  main.variable(observer("chart6")).define("chart6", ["d3","width","GridMap","socal","qtrsales","seq"], function(d3,width,GridMap,socal,qtrsales,seq)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("width", width)
    .attr("height", 430);    
  
  const g = svg.append("g").attr("transform", "translate(25,0)");
  
  const gmap = new GridMap(g)
  .size([400, 400])
  .style({
    shape: "square",
    sizeByValue: false
  })
  .field({ code: "code", name: "name", values: ["Q1", "Q2", "Q3", "Q4"] })
  .mapGrid(socal)
  .data(qtrsales)
  .processMap();

  const unit = gmap.unitSize;
  const x = d3.scaleBand().domain(seq(gmap.field().values.length)).range([0, unit]),
        half = x.bandwidth() / 2, qtr = half / 2;        

  gmap.customSquareOverlay(columnChart)
    .render();

  function columnChart(g, getSize, color) {            
    g.call(g => g.append("rect")
        .attr("width", unit)
        .attr("height", unit)
        .attr("opacity", 0.5)
        .attr("fill", "white"))
      .selectAll(".bar")
      .data(d => {
        const y = d3.scaleLinear().domain(d3.extent(d.values)).nice().range([unit, 0]);
        return d.values.map(v => ({ y, v }));
      })
      .join("rect")
      .attr("class", "bar")
      .attr("fill", (d, i) => color(i))
      .attr("x", (d, i) => x(i) + qtr)
      .attr("y", d => d.y(d.v))
      .attr("width", half)
      .attr("height", d => unit - d.y(d.v));
  }
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`The implementation is a bit different if the **sizeByValue** is turned on. The actual size of each cell won't be able to obtain until the runtime. Let's use the first demo as an example. If you want to **draw bubbles in each circle** instead of the built-in pie chart, in this scenario, since each circle has a different radius, you can get each circle's actual radius by accessing **d.r**. (use the delegate **getSize()** instead for square cell)

***Also, in this example, you will see an overlay-only map with a clean background by turning both options on.***

### New cases in the last 30 days`
)});
  main.variable(observer("viewof options3")).define("viewof options3", ["form","html"], function(form,html){return(
form(html`<form>
<input type="checkbox" name="always" checked><span>Always Show Overlay</span>
<input type="checkbox" name="hideCell" checked><span>Hide Cell</span>
</form>`)
)});
  main.variable(observer("options3")).define("options3", ["Generators", "viewof options3"], (G, _) => G.input(_));
  main.variable(observer("chart7")).define("chart7", ["d3","getStatesLastNDays","GridMap","options3","map"], function(d3,getStatesLastNDays,GridMap,options3,map)
{
  const svg = d3.create("svg")
    .attr("font-size", "9pt")
    .attr("viewBox", "0 0 1024 700");  
  
  const data = getStatesLastNDays("newcases", 30, false, true);
  const dates = data.columns.slice(2);
  const gmap = new GridMap(svg)
    .size([1024, 650])                
    .style({      
      shape: "circle",
      sizeByValue: true,
      showMapLegend: false,
      alwaysShowOverlay: options3.always,
      hideCell: options3.hideCell
    })
    .cellPalette(d3.interpolatePuBuGn)
    .field({ 
      name: "state",
      code: "code",
      values: dates
    })
    .mapGrid(map)
    .data(data)
    .customCircleOverlay(drawBubbles)
    .render();
  
  function drawBubbles(g, getSize, color) {
    g.call(g => g.append("circle")
            .attr("r", d => d.r)
            .attr("fill", "white")
            .attr("opacity", options3.hideCell ? 0 : 0.5))
      .selectAll(".bubble")
      .data(d => { 
        const colors = d3.scaleSequential(d3.interpolateBlues).domain(d3.extent(d.values));
        const bubbles = d3.pack().size([d.r * 2, d.r * 2])(
            d3.hierarchy({children: d.values.map((v, i) => ({date: dates[i], value: v}))})
            .sum(d => d.value)
          )
        .leaves();
        
        bubbles.forEach(b => {
          b.r0 = d.r;
          b.c = colors;
        });
        return bubbles;
      })
      .join("circle")
      .attr("class", "bubble")
      .attr("cx", d => d.x - d.r0).attr("cy", d => d.y - d.r0)
      .attr("r", d => d.r)
      .attr("fill", (d, i) => d.c(d.value))
      .append("title")
      .text(d => `${d.data.date} - ${d.data.value}`);
  }
  
  return svg.node();
}
);
  main.variable(observer("socal")).define("socal", function(){return(
[[0,0,"SLO"],[1,0,""],[2,0,""],[3,0,""],
    [0,1,"SB"],[1,1,"KER"],[2,1,""],[3,1,""],
    [0,2,""],[1,2,"VEN"],[2,2,"LA"],[3,2,"SBD"],
    [0,3,""],[1,3,""],[2,3,"OC"],[3,3,"RIV"],
    [0,4,""],[1,4,""],[2,4,"SD"],[3,4,"IMP"]].map(d => ({col: d[0], row: d[1], code: d[2]}))
)});
  main.variable(observer("sales")).define("sales", function(){return(
[
  { code: "SLO", name: "San Luis Obispo", value: 138800 }, 
  { code: "SB", name: "Santa Barbara", value: 1724650 }, 
  { code: "KER", name: "Kern", value: 28500 },
  { code: "VEN", name: "Ventura", value: 985460 }, 
  { code: "LA", name: "Los Angeles", value: 4763850 }, 
  { code: "SBD", name: "Sab Bernadino", value: 1332765 },
  { code: "OC", name: "Orange", value: 2863752 }, 
  { code: "RIV", name: "Riverside", value: 2246830 }, 
  { code: "SD", name: "San Diego", value: 2921634 }
]
)});
  main.variable(observer("qtrsales")).define("qtrsales", function(){return(
[
  { code: "SLO", name: "San Luis Obispo", Q1: 13824, Q2: 3773, Q3: 46398, Q4: 17255 },
  { code: "SB", name: "Santa Barbara", Q1: 86738, Q2: 15731, Q3: 38241, Q4: 7659 },
  { code: "KER", name: "Kern", Q1: 9798, Q2: 1325, Q3: 17244, Q4: 28101},
  { code: "VEN", name: "Ventura", Q1: 32115, Q2: 10110, Q3: 23221, Q4: 9695 },
  { code: "LA", name: "Los Angeles", Q1: 167625, Q2: 21125, Q3: 20328, Q4: 43326 },
  { code: "SBD", name: "Sab Bernadino", Q1: 27263, Q2: 9287, Q3: 32019, Q4: 24425},
  { code: "OC", name: "Orange", Q1: 76132, Q2: 27269, Q3: 43257, Q4: 63368 },
  { code: "RIV", name: "Riverside", Q1: 36582, Q2: 13364, Q3: 12598, Q4: 21224 },
  { code: "SD", name: "San Diego", Q1: 42768, Q2: 22123, Q3: 34532, Q4: 18674 },
]
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## API Reference
* **GridMap(container)** - Constructs a new instance of GridMap with default settings. The container can be an svg or any g elements.
* **size([width, height])** - Sets this map's dimensions to specified width and height and returns this map.
* **style(style)** - Overrides the default styles and return this map.
  * style.**transition**: a boolean value that turns on/off the transition effect
  * style.**shape**: the shape of map cells - square or circle
  * style.**sizeByValue**: all the cells have the same size by default. The map will calculate cell size based on its value if you enable this option.
  * style.**cr**: the attribute defines a radius on both x and y axes of rectangular map cells. The default is 4.
  * style.**defaultCellColor**: the default color of map cells
  * style.**defaultTextColor**: the default color of map cell labels
  * style.**shortFormat**: the default short format of the number displays inside the cell
  * style.**longFormat**: the default long format of the number displays below the cell when the user hovers mouse over
  * style.**legendFormat**: the number format of map legend
  * style.**legendTitle**: the title of the map legend
  * style.**showOverlay**: a boolean value that turns on/off the overlay (mini charts)
  * style.**showOverlayLegend**: a boolean value that determines whether the overlay legend is enabled
  * style.**overlayLegendThreshold**: the threshold of the overlay legend
  * style.**showMapLegend**: a boolean value that determines whether the map legend is enabled
  * style.**alwaysShowOverlay**: a boolean value that determines whether the overlay is always displayed or not
  * style.**hideCell**: a boolean value that determines whether the cell itself is visible or not. It's a combination option and should be used with the **alwaysShowOverlay** for displaying overlay with a clean background.
* **cellPalette(palette)** - Sets the color palette of cells to a specified continuous interpolator and returns this map. Default is d3.interpolateYlGnBu.
* **overPalette(palette)** - Sets the color palette of the overlay to a specified categorical scheme and returns this map. Default is d3.schemeTableau10.
* **mapGrid(map)** - Sets the map grid data and returns this map. The grid data can be easily generated by using the **MapEditor** below.
* **data(data)** - Sets the data and returns this map.
* **field(field)** - Sets the field names of map subdivision code, name, and values.
  * field.**code**: the field name of subdivision code
  * field.**name**: the field name of subdivision name
  * field.**values**: an array of field names specifying from which fields the map can gather data when rendering mini charts
  * field.**total**: the field name of subdivision value. It is optional if you have specified the field.values unless you need to show a different number other than the total.
* **customSquareOverlay(f)** - Sets the custom function for overriding the square overlay renderer. There are three arguments for the custom function:
  * **g** - the g element contains the mini chart
  * **getSize** - the function to get the size of the mini chart. It is only needed when you customize the overlay with  *style.sizeByValue* turned **on**.
  * **color** - the color scale of the values
* **customCircleOverlay(f)** - Sets the custom function for overriding the circle overlay renderer.
* **processMap()** - This is only needed when you customize the overlay with *style.sizeByValue* turned **off**. For details, please see the tutorial above.
* **render()** - Renders the map and returns this instance.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Source Code`
)});
  main.variable(observer("GridMap")).define("GridMap", ["d3"], function(d3){return(
class GridMap {
    constructor(container) {
        this._container = container;
        this._g = null;

        this._width = 800;
        this._height = 600;
        this._style = {
            transition: false,
            shape: "square",
            sizeByValue: false,
            cr: 4,
            defaultCellColor: "#999",
            defaultTextColor: "white",
            shortFormat: ".2s",
            longFormat: ",.0d",
            legendFormat: ",.0d",
            legendTitle: "",
            showOverlay: true,
            showOverlayLegend: true,
            alwaysShowOverlay: false,
            showCellText: true,
            hideCell: false,
            overlayLegendThreshold: 14,
            showMapLegend: true
        };
        this._cellPalette = d3.interpolateYlGnBu;
        this._textPalette = d3.interpolateCubehelixDefault;
        this._overlayPalette = d3.schemeTableau10;

        this._gridData = null;
        this._cols = 0;
        this._rows = 0;
        this._x = null;
        this._y = null;
        this._bandwidth = { x: 0, y: 0, hx: 0, hy: 0 };

        this._data = null;
        this._chartData = null;
        this._field = {
            code: "code",
            name: "state",
            values: [],
            total: ""
        };

        this._contains = { data: true, values: true };        

        this._c = null; // cell color scale
        this._t = null; // text color scale
        this._ov = null; // overlay mini chart color scale
        this._fullOpacity = 1;
        this._showLabel = true;

        this._initDuration = 500;
        this._miniLegend = null;
        this._mapLegend = null;        

        this._customSquareOverlay = null;
        this._customCircleOverlay = null;

        this._onMouseEnter = null;
        this._onMouseLeave = null;
        this._onClick = null;

        this._uniqueId = new String(Date.now() * Math.random()).replace(".", "");
    }

    size(_) {
        return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
    }

    style(_) {
        return arguments.length ? (this._style = Object.assign(this._style, _), this) : this._style;
    }

    cellPalette(_) {
        return arguments.length ? (this._cellPalette = _, this) : this._cellPalette;
    }

    overlayPalette(_) {
        return arguments.length ? (this._overlayPalette = _, this) : this._overlayPalette;
    }

    mapGrid(_) {
        return arguments.length ? (this._gridData = _, this) : this._gridData;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._data;
    }

    field(_) {
        return arguments.length ? (this._field = Object.assign(this._field, _), this) : this._field;
    }

    customSquareOverlay(_) {
        return arguments.length ? (this._customSquareOverlay = _, this) : this._customSquareOverlay;
    }

    customCircleOverlay(_) {
        return arguments.length ? (this._customCircleOverlay = _, this) : this._customCircleOverlay;
    }

    onMouseEnter(_) {
        return arguments.length ? (this._onMouseEnter = _, this) : this._onMouseEnter;
    }

    onMouseLeave(_) {
        return arguments.length ? (this._onMouseLeave = _, this) : this._onMouseLeave;
    }

    onClick(_) {
        return arguments.length ? (this._onClick = _, this) : this._onClick;
    }

    get unitSize() {
        const style = this._style, bandwidth = this._bandwidth;
        const unit = Math.min(bandwidth.x, bandwidth.y);
        return style.sizeByValue ? unit / 2 : unit / (style.shape === "circle" ? 2 : 1);
    }

    get actualSize() {
        const u = this.unitSize;
        return [this._cols * u, this._rows * u];
    }

    render() {
        this._init();
        this._process();
        this._initColors();

        this._g = this._container.append("g");
        this._renderMap();        

        return this;
    }
  
    process() {
      this._init();
      this._process();
      return this._chartData;
    }

    processMap() {
        this._gridData = this._gridData.filter(d => d.code !== "");

        this._cols = d3.max(this._gridData.map(d => d.col)) + 1;
        this._rows = d3.max(this._gridData.map(d => d.row)) + 1;

        this._x = d3.scaleBand()
            .domain(this._seq(this._cols))
            .padding(0.05);

        this._y = d3.scaleBand()
            .domain(this._seq(this._rows))
            .padding(0.05);

        const top = this._style.showMapLegend ? 50 : 0;
        if (this._width / this._cols < this._height / this._rows) {
            this._x.range([0, this._width - top]);
            this._y.range([top, this._width / this._cols * this._rows]);
        }
        else {
            this._x.range([0, this._height / this._rows * this._cols - top]);
            this._y.range([top, this._height]);
        }

        this._bandwidth = {
            x: this._x.bandwidth(),
            y: this._y.bandwidth(),
            hx: this._x.bandwidth() / 2,
            hy: this._y.bandwidth() / 2
        };

        return this;
    }

    _init() {        
        this._contains.data = this._data && this._data.length > 0;
        this._contains.values = this._field.values && this._field.values.length > 0;

        if (!this._contains.data) {
            this._style.showMapLegend = false;
            this._style.sizeByValue = false;
            this._style.showOverlay = false;
            this._style.showOverlayLegend = false;
        }
        else if (!this._contains.values) {
            this._style.showOverlay = false;
            this._style.showOverlayLegend = false;
        }
    }

    _process() {
        this.processMap();
        if (this._data && this._data.length > 0) this._processData();
    }

    _processData() {
        const field = this._field;

        this._showLabel = false;
        this._chartData = this._gridData.map(d => {            
            const datum = this._data.find(_ => _[field.code] === d.code);
            const values = datum && this._contains.values ? field.values.map(vname => datum[vname]) : [];
            const r = {
                col: d.col,
                row: d.row,
                code: d.code,
                state: datum ? datum[field.name] : null,
                values: values,
                total: 0
            };

            if (r.state && r.state !== "") this._showLabel = true;

            if (datum) {
                if (field.total !== "")
                    r.total = datum[field.total];
                else if (values)
                    r.total = values.reduce((a, b) => a + b);
            }

            return r;
        })
    }

    _initColors() {
        if (this._chartData) {
            const ext = d3.extent(this._chartData.map(d => d.total));
            this._c = d3.scaleSequential(this._cellPalette).domain(ext);
            this._t = d3.scaleSequential(this._textPalette).domain(ext);
            if (this._contains.values) this._ov = d3.scaleOrdinal(this._overlayPalette).domain(this._seq(this._field.values.length));
        }
    }

    _renderMap() {
        const style = this._style;

        d3.select("body")
            .append("style")
            .html(`
                ._overlay_${this._uniqueId} { opacity: 0 }
                .overlay_${this._uniqueId} {opacity:${style.alwaysShowOverlay ? 1 : 0}} 
                .overlay_${this._uniqueId}:hover {opacity:1}`
            );

        this._fullOpacity = style.sizeByValue ? 0.9 : 1;

        const cells = this._renderBase().call(g => this._renderShape(g));
        
        if (style.transition) {
            const b = this._initDuration / this._cols;
            cells.transition().duration(d => d.col * b)
                .ease(d3.easeBounce)
                .attr("opacity", this._fullOpacity)
                .attr("transform", d => `translate(${this._x(d.col)},${this._y(d.row)})`)
                // avoid interfering with the initial transition by delaying to attach mouse events                
                .transition().delay(this._initDuration)
                .on("end", () => { this._attachEvents(cells); });
        }
        else 
            this._attachEvents(cells);

        this._miniLegend = this._container
            .append("g")
            .style("font-weight", "bold")
            .style("visibliity", "hidden");

        if (style.showMapLegend && this._chartData) this._addMapLegend(cells);
    }

    _renderBase() {
        var data;
        if (this._chartData)            
            data = this._style.sizeByValue ? this._pack() : this._chartData;
        else
            data = this._gridData;

        const cells = this._g.selectAll("g")
            .data(data)
            .join("g")
            .attr("text-anchor", "middle")
            .attr("opacity", this._style.transition ? 0 : this._fullOpacity)
            .attr("fill", d => d.total ? this._c(d.total) : d.code ? this._style.defaultCellColor : "none");

        if (this._style.transition)
            cells.attr("transform", d => `translate(${-this._bandwidth.x},${this._y(d.row)})`);
        else
            cells.attr("transform", d => `translate(${this._x(d.col)},${this._y(d.row)})`);

        return cells;
    }

    _renderShape(g) {
        const defaultSize = this.unitSize;
        if (this._style.shape === "square")
            this._renderSquares(g, defaultSize)
        else
            this._renderCircles(g, defaultSize);
    }

    _renderSquares(g, size) {
        const style = this._style, bandwidth = this._bandwidth;

        const drawRect = g => {
            const rect = g.append("rect")
                .attr("rx", style.cr).attr("ry", style.cr);

            if (style.sizeByValue) {
                rect.attr("x", d => -d.r + size)
                    .attr("y", d => -d.r + size)
                    .attr("width", d => d.r * 2)
                    .attr("height", d => d.r * 2);
            }
            else {
                rect.attr("width", size)
                    .attr("height", size);
            }

            return rect;
        }

        if (!style.hideCell) {
            drawRect(g);
            this._addCellText(g, true, "ctext");
        }

        const og = g.filter(d => d.total)
            .append("g")
            .attr("class", `_overlay_${this._uniqueId}`)
            .attr("transform", d => style.sizeByValue ? `translate(${-(d.r - size)},${-(d.r - size)})` : "")
            .call(g => drawRect(g).attr("opacity", 0)) // hidden layer for hovering
            .call(g => g.append("g")
                .attr("font-weight", "bold")
                .attr("transform", d => style.sizeByValue ?
                    `translate(${d.r - size},${d.r * 2 - size + 15})` :
                    `translate(0,${bandwidth.hx + 15})`)
                .call(g => {
                    if (style.alwaysShowOverlay)
                        this._addCellText(g, false, "ltext", 0);
                    else
                        this._addCellText(g);
                }));

        if (style.showOverlay) {
            if (this._customSquareOverlay) {
                og.call(g => {
                    const getSize = style.sizeByValue ? d => d.r * 2 : d => size;
                    this._customSquareOverlay(g, getSize, this._ov);
                });
            }
            else {
                og.append("g")
                    .selectAll("rect")
                    .data(d => this._treemap(d))
                    .join("rect")                    
                    .attr("x", d => d.x0).attr("y", d => d.y0)
                    .attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0)
                    //.attr("fill", (d, i) => this._ov(this._field.values[i]))
                    .attr("fill", (d, i) => this._ov(i))
                    .call(g => g.append("title")
                        .text((d, i) => {
                            const val = d.parent ? d.parent.data.children[i] : 0,
                                p = d.parent ? (val / d.parent.value * 100).toFixed(1) : 0;
                            return `${this._field.values[i]}\n${d3.format(this._style.legendFormat)(val)} (${p}%)`;
                        }));
            }
        }
    }

    _renderCircles(g, size) {
        const style = this._style, bandwidth = this._bandwidth;

        const drawCircle = (g, shift) => {
            const circle = g.append("circle")
                .attr("cx", size - shift ? 0 : bandwidth.hx).attr("cy", size - shift ? 0 : bandwidth.hy);

            if (style.sizeByValue)
                circle.attr("r", d => d.r);
            else
                circle.attr("r", d => size);

            return circle;
        }

        if (!style.hideCell) {
            drawCircle(g);
            this._addCellText(g, true, "ctext");
        }

        const og = g.filter(d => d.total)
            .append("g")
            .attr("class", `_overlay_${this._uniqueId}`)
            .attr("transform", `translate(${bandwidth.hx},${bandwidth.hy})`)
            .call(g => drawCircle(g, true).attr("opacity", 0)) // hidden layer for hovering
            .call(g => g.append("g")
                .attr("font-weight", "bold")
                .attr("transform", d => style.sizeByValue ?
                    `translate(${-bandwidth.hx},${d.r - bandwidth.hy + 15})` :
                    `translate(${-bandwidth.hx},${size - bandwidth.hy + 15})`)
                .call(g => {
                    if (style.alwaysShowOverlay)
                        this._addCellText(g, false, "ltext", 0);
                    else
                        this._addCellText(g);
                }));

        if (this._style.showOverlay) {
            if (this._customCircleOverlay) {
                og.call(g => {
                    const getSize = style.sizeByValue ? d => d.r * 2 : d => size;
                    this._customCircleOverlay(g, getSize, this._ov);
                });
            }
            else {
                og.append("g")
                    .selectAll("path")
                    .data(d => d3.pie()(d.values).map(p => ({ pie: p, data: d })))
                    .join("path")
                    .attr("class", "mini")
                    //.attr("fill", (d, i) => this._ov(this._field.values[i]))
                    .attr("fill", (d, i) => this._ov(i))
                    .attr("d", d => d3.arc()
                        .innerRadius(0)
                        .outerRadius(style.sizeByValue ? d.data.r : size)
                        .startAngle(d.pie.startAngle)
                        .endAngle(d.pie.endAngle)())
                    .call(g => g.append("title")
                        .text((d, i) => {
                            const val = d.data.values[i], p = (val / d.data.total * 100).toFixed(1);
                            return `${this._field.values[i]}\n${d3.format(this._style.legendFormat)(val)} (${p}%)`;
                        }));
            }
        }
    }

    _addCellText(g, short, className, opacity) {
        if (!this._style.showCellText) return;

        const tg = g.append("g")
            .attr("class", className)
            .attr("opacity", opacity)
            .attr("fill", d => d.total ? short ? this._t(d.total) : "black" : this._style.defaultTextColor)
            .attr("transform", `translate(${this._bandwidth.hx},${this._bandwidth.hy})`);

        if (short || this._showLabel) tg.call(g => g.append("text").text(d => short ? d.code : d.state));
        tg.call(g => g.append("text")
            .attr("dy", short || this._showLabel ? "1em" : "")
            .text(d => d.total ? d3.format(short ? this._style.shortFormat : this._style.longFormat)(d.total) : "---"));
    }

    _attachEvents(cells) {
        cells
            .on("mouseenter", (e, d) => {
                e.currentTarget.parentElement.appendChild(e.currentTarget);
                cells.transition().duration(500)
                    .attr("opacity", a => a === d ? 1 : 0.4);
                //.selectAll(".ctext").attr("opacity", 0.3);                

                if (this._style.alwaysShowOverlay)
                    cells.selectAll(".ltext").attr("opacity", a => a === d ? 1 : 0);

                if (d.total && d.values) this._showLegend(d);
                if (this._onMouseEnter) this._onMouseEnter(e, d);
            })
            .on("mouseleave", (e, d) => {
                cells.transition().duration(500)
                    .attr("opacity", this._fullOpacity);
                //.selectAll(".ctext").attr("opacity", 1);                

                if (this._style.alwaysShowOverlay)
                    cells.selectAll(".ltext").attr("opacity", 0);

                this._miniLegend.style("visibility", "hidden");
                if (this._onMouseLeave) this._onMouseLeave(e, d);
            })
            .on("click", (e, d) => {
                if (this._onClick) this._onClick(e, d);
            });
        cells.selectAll(`._overlay_${this._uniqueId}`).attr("class", `overlay_${this._uniqueId}`);
    }

    _showLegend(d) {
        const style = this._style, bandwidth = this._bandwidth;

        if (!style.showOverlay || this._field.values.length > style.overlayLegendThreshold) return;

        const w = 20, h = 12;
        var r, left, top;
        if (style.sizeByValue) {
            r = d.r;
            left = this._x(d.col) + bandwidth.x + 10 + (d.r - bandwidth.hx);
            top = this._y(d.row);
        }
        else {
            r = bandwidth.hx;
            left = this._x(d.col) + bandwidth.x + 10;
            top = this._y(d.row);
        }

        const getText = (_, i) => {
            const val = d.values[i], p = (val / d.total * 100).toFixed(1);
            return `${this._field.values[i]} ${d3.format(style.legendFormat)(val)}(${p}%)`;
        };

        this._miniLegend
            .attr("transform", `translate(${left},${top})`)
            .selectAll("g")
            .data(this._field.values.slice(0, style.overlayLegendThreshold))
            .join(
                enter => {                    
                    return enter.append("g")
                        .attr("transform", (_, i) => `translate(0,${(h + 5) * i})`)
                        .call(g => g.append("rect")
                            .attr("rx", 4).attr("ry", 4)
                            .attr("width", w).attr("height", h)
                            //.attr("fill", (d, i) => this._ov(this._field.values[i])))
                            .attr("fill", (d, i) => this._ov(i)))
                        .call(g => g.append("text")
                            .attr("dy", "0.8em")
                            .attr("transform", `translate(${w + 5},0)`)
                            .text(getText))                    
                },
                update => update.select("text").text(getText),
                exit => exit.remove());

        this._miniLegend.node().parentElement.appendChild(this._miniLegend.style("visibility", "visible").node());
        const bbox = this._miniLegend.node().getBBox();
        if (left + bbox.width > this._width)
            this._miniLegend.attr(
                "transform",
                `translate(${this._x(d.col) + bandwidth.hx - bbox.width - r - 10},${top})`);
    }

    _addMapLegend(cells) {
        this._mapLegend = this._container.append("g")
            .style("visibility", this._style.transition ? "hidden" : "visible")
            .call(g => this._renderLegend(g)
                .on("mouseover", (e, d) =>
                    cells.filter(c => c.total < d.floor || c.total >= d.ceiling)
                        .transition().duration(500)
                        .attr("opacity", 0.2))
                .on("mouseout", () => cells.transition().duration(500).attr("opacity", 1)));

        // avoid interfering with the initial transition
        if (this._style.transition) {
            this._mapLegend
                .transition().delay(this._initDuration)
                .style("visibility", "visible");
        }
    }

    _renderLegend(g) {
        const w = 30;
        const s = sample(d3.extent(this._chartData.map(d => d.total).filter(d => d !== 0)), 8);

        if (s.length > 0) {
            g.attr("font-weight", "bold")
                .append("text")
                .attr("text-anchor", "end")
                .attr("alignment-baseline", "hanging")
                .attr("transform", `translate(${w * 9},0)`)
                .text(this._style.legendTitle);
        }

        return g.selectAll("g")
            .data(s)
            .join("g")
            .attr("font-size", "8pt")
            .attr("transform", (d, i) => `translate(${i * w},0)`)
            .call(g => g.append("rect")
                .attr("y", "1.2em")
                .attr("fill", d => this._c(d.floor))
                .attr("width", w).attr("height", "1.5em"))
            .call(g => g.append("text")
                .attr("dy", "3.7em")
                .text(d => d3.format(this._style.shortFormat)(d.floor)));

        function sample(ext, segs) {
            const min = ext[0], max = ext[1];
            const gap = (max - min) / segs;

            if (gap === 0) return [];

            var curr = { floor: min, ceiling: 0 };
            const s = [curr];
            for (var i = min + gap; i <= max - gap; i += gap) {
                const p = Math.pow(10, Math.round(i).toString().length - 2);
                const v = Math.floor(i / p) * p;
                curr.ceiling = v;
                curr = { floor: v, ceiling: 0 };
                s.push(curr);
            }
            curr.ceiling = max;
            s.push({ floor: max, ceiling: Number.MAX_VALUE });
            return s;
        }
    }

    _pack() {
        return d3.pack()
            .size([this._width, this._height])(
                d3.hierarchy({ children: this._chartData })
                    .sum(d => d.total))
            .leaves()
            .map(d => Object.assign(d, d.data));
    }

    _treemap(d) {
        const size = this._style.sizeByValue ? [d.r * 2, d.r * 2] : [this._bandwidth.x, this._bandwidth.y];
        return d3.treemap()
            .size(size)
            (d3.hierarchy({ children: d.values }).sum(d => d))
            .leaves();
    }

    _seq(length) {
        const a = new Array(length);
        for (let i = 0; i < length; i++) a[i] = i;
        return a;
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Map Editor

Having a hard time creating cartogram templates? Here is the solution for you!! Just type the codes into the grid and wave your magic wand - it generates the map data in three different formats - Array, CSV, and JSON. Besides, it provides a reverse function to convert map data back into the grid for editing.`
)});
  main.variable(observer("editor")).define("editor", ["extent","d3","seq"], function(extent,d3,seq)
{
  extent();
  
  const div = d3.create("div");
  const filledColor = "lightSteelBlue", emptyColor = "lightYellow";
  
  var rows = 10, cols = 10;
  const ri = div.input("Rows:", rows, v => { rows = v; updateTable(); });
  div.space();
  const ci = div.input("Cols:", cols, v => { cols = v; updateTable(); });  
  
  const table = div.append("table") 
    .attr("class", "map")
    .attr("border", 1)
    .style("width", `${width()}px`)    
  
  updateTable();
  
  div.button("Array", toArray)
    .button("CSV", toCsv)
    .button("JSON", toJson)
    .space(2)    
    .button("Copy", copy)
    .button("Clear", clear)
    .button("Reverse", reverse);
  
  const error = div.span("&nbsp;Invalid format!")
    .style("color", "red")
    .style("visibility", "hidden");    
  
  div.newLine();
  const result = div.append("textarea")
    .style("width", "100%")
    .style("height", "10em");
  
  return div.node();
  
  function updateTable() {
    table.style("width", `${width()}px`)
      .selectAll("tr")
      .remove();
    
    return table.selectAll("tr")
      .data(seq(rows))
      .join("tr")
      .selectAll("td")
      .data(seq(cols))
      .join("td")
      .attr("class", "map")
      .style("background", emptyColor)
      .append("input")    
      .style("border", "none")
      .style("width", "100%")
      .style("background", "none")
      .on("change", e => {
        const tar = e.currentTarget;
        tar.parentElement.style.backgroundColor = tar.value === "" ? emptyColor : filledColor;
      });
  }
  
  function width() { return cols <= 13 ? 500 : cols <= 20 ? 730 : 960; }  
  
  function toArray() {    
    result.node().value = "[" + 
      table.selectAll("input").nodes().map(d => {
        const cell = d.parentNode,
              row = d.parentNode.parentNode;
        return `[${cell.cellIndex},${row.rowIndex},"${d.value}"]`;
      }) + "]";
  }
  
  function toCsv() {
    result.node().value = 
      table.selectAll("input").nodes().map(d => {
        const cell = d.parentNode,
              row = d.parentNode.parentNode;
        return `${cell.cellIndex},${row.rowIndex},"${d.value}"`;
      }).join("\n");
  }
  
  function toJson() {
    result.node().value = JSON.stringify(
      table.selectAll("input").nodes().map(d => {
        const cell = d.parentNode,
              row = d.parentNode.parentNode;
        return { col: cell.cellIndex, row: row.rowIndex, code: d.value };
      }));
  }
  
  function copy() {
    result.node().select();
    document.execCommand("copy");   
  }
  
  function clear() {
    table.selectAll("input").nodes().forEach(d => {
      d.value = "";
      d.parentElement.style.backgroundColor = emptyColor;
    });
  }  
  
  function reverse() {
    error.attr("visibility", "hidden");
    try {
      var val = result.node().value;
      const c = [], r = [], arr = [];
      if (val.startsWith("[["))
        val.replace(/\[/g, "").replace(/]/g, "").replace(/"/g, "")
          .split(",").forEach(extract);
      else if (val.startsWith("0,0"))
        val.replace(/\n/g, ",").replace(/"/g, "")
          .split(",").forEach(extract);
      else
        JSON.parse(val).forEach(d => {
          c.push(d.col);
          r.push(d.row);
          arr.push(d.code);          
        });
      
      rows = d3.max(r) + 1;
      cols = d3.max(c) + 1;      
      ri.node().value = rows;
      ci.node().value = cols;
      updateTable().nodes()
        .forEach((d, i) => {
          const v = arr[i];
          console.log(v);
          d.value = v;
          d.parentElement.style.backgroundColor = v === "" ? emptyColor : filledColor;
        });
      
      function extract(d, i) {     
        const m = i % 3;
        if (m === 0) c.push(parseInt(d));
        else if (m === 1) r.push(parseInt(d));
        else if (m === 2) arr.push(d.trim());
      }
    }
    catch(e) { error.attr("visibility", "visible"); }
  }
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### Appendix`
)});
  main.variable(observer("extent")).define("extent", ["d3"], function(d3){return(
() => {
  d3.selection.prototype.button = function (value, onclick) {
    this.append("input")
      .attr("type", "button")
      .attr("value", value)
      .on("click", onclick);
    return this;
  }
  
  d3.selection.prototype.span = function (html) {
    return this.append("span").html(html);    
  }
  
  d3.selection.prototype.space = function (n) {
    const t = n ? n : 1; 
    this.span("&nbsp".repeat(t)); 
    return this;
  }  
  
  d3.selection.prototype.newLine = function() {
    this.append("br");
    return this;
  }
  
  d3.selection.prototype.input = function (caption, value, onchange) {
    this.span(`${caption}&nbsp;`);    
    const ctrl = this.append("input").attr("value", value).style("width", "50px");
    ctrl.on("change", () => onchange(ctrl.node().value));
    return ctrl;
  }
}
)});
  main.variable(observer("seq")).define("seq", function(){return(
length => Array.apply(null, {length: length}).map((d, i) => i)
)});
  main.variable(observer("map")).define("map", function(){return(
[[0, 0, ""], [1, 0, ""], [2, 0, ""], [3, 0, ""], [4, 0, ""], [5, 0, ""], [6, 0, ""], [7, 0, ""], [8, 0, ""], [9, 0, ""], [10, 0, ""], [11, 0, "ME"], [0, 1, "AK"], [1, 1, ""], [2, 1, ""], [3, 1, ""], [4, 1, ""], [5, 1, ""], [6, 1, "WI"], [7, 1, ""], [8, 1, ""], [9, 1, ""], [10, 1, "VT"], [11, 1, "NH"], [0, 2, ""], [1, 2, "WA"], [2, 2, "ID"], [3, 2, "MT"], [4, 2, "ND"], [5, 2, "MN"], [6, 2, "IL"], [7, 2, "MI"], [8, 2, ""], [9, 2, "NY"], [10, 2, "MA"], [11, 2, ""], [0, 3, ""], [1, 3, "OR"], [2, 3, "NV"], [3, 3, "WY"], [4, 3, "SD"], [5, 3, "IA"], [6, 3, "IN"], [7, 3, "OH"], [8, 3, "PA"], [9, 3, "NJ"], [10, 3, "CT"], [11, 3, "RI"], [0, 4, ""], [1, 4, "CA"], [2, 4, "UT"], [3, 4, "CO"], [4, 4, "NE"], [5, 4, "MO"], [6, 4, "KY"], [7, 4, "WV"], [8, 4, "VA"], [9, 4, "MD"], [10, 4, "DE"], [11, 4, ""], [0, 5, ""], [1, 5, ""], [2, 5, "AZ"], [3, 5, "NM"], [4, 5, "KS"], [5, 5, "AR"], [6, 5, "TN"], [7, 5, "NC"], [8, 5, "SC"], [9, 5, "DC"], [10, 5, ""], [11, 5, ""], [0, 6, "HI"], [1, 6, ""], [2, 6, ""], [3, 6, ""], [4, 6, "OK"], [5, 6, "LA"], [6, 6, "MS"], [7, 6, "AL"], [8, 6, "GA"], [9, 6, ""], [10, 6, ""], [11, 6, ""], [0, 7, ""], [1, 7, ""], [2, 7, ""], [3, 7, ""], [4, 7, "TX"], [5, 7, ""], [6, 7, ""], [7, 7, ""], [8, 7, ""], [9, 7, "FL"], [10, 7, ""], [11, 7, ""]].map(d => ({ col: d[0], row: d[1], code: d[2] }))
)});
  main.variable(observer("covid")).define("covid", ["getStatesLastNDays","options"], function(getStatesLastNDays,options){return(
getStatesLastNDays(options.field, options.days, false, true)
)});
  main.variable(observer()).define(["d3","width","SVGTable","covid"], function*(d3,width,SVGTable,covid)
{
  const svg = d3.create("svg")
    .attr("font-size", "11pt")
    .attr("viewBox", [0, 0, width, 260]);
  
  yield svg.node();
  
  new SVGTable(svg)
    .size([width, 250])
    .fixedRows(0)
    .fixedColumns(2)
    .rowsPerPage(25)    
    .defaultNumberFormat(",.0d")
    .style({ border: false })
    .data(covid)      
    .render();    
}
);
  main.variable(observer()).define(["html"], function(html){return(
html`<style>
table.map, td.map {
  border: 1px solid gray;
  border-collapse: collapse;  
}

table.map {  
  table-layout: fixed;
  max-width: 960px;
}

body, svg text {
  cursor: default;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>`
)});
  main.variable(observer()).define(["options"], function(options)
{
    const s = document.getElementById("ndays");
    if (s) s.innerText = options.days;  
}
);
  const child1 = runtime.module(define1);
  main.import("SVGTable", child1);
  const child2 = runtime.module(define2);
  main.import("getStatesLastNDays", child2);
  main.import("getStatesNumber", child2);
  main.import("days", child2);
  main.import("firstDay", child2);
  const child3 = runtime.module(define3);
  main.import("Scrubber", child3);
  const child4 = runtime.module(define4);
  main.import("form", child4);
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  main.variable(observer()).define(["md"], function(md){return(
md`🌐[ericlo.dev](https://ericlo.dev) 🐱[GitHub Repositories](https://github.com/analyzer2004?tab=repositories) 🐦[Twitter](https://twitter.com/analyzer2004)`
)});
  return main;
}
