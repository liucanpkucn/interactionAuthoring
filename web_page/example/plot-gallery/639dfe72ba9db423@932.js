// https://observablehq.com/@analyzer2004/hierarchical-heatmap@932
import define1 from "./8d271c22db968ab0@158.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["isales@2.json",new URL("./files/4a374bd4f30c5040234517fc2c4d4338891d66b3c832b1cd3a749c89946408e34de12f55f069979cfeff1f80ee2c7aa375244ee6361493485ddef718f981d4da",import.meta.url)],["large.json",new URL("./files/2167d1ceddb312980b15e49828dedbf680732f448c86ff7d3864f2f22e668c286a8cb621cd14cee6cf2c5a743f6982494d8ed2aeb0123f132dd9934c06cc8cfb",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Hierarchical Heatmap (update - now works well with larger dataset)

This chart visualizes hierarchical data in an interesting and different aspect where leaf nodes are represented by a heatmap. Hover a cell to reveal its path, or hover the legend to highlight cells in a range. The algorithm is encapsulated in the **Heatmap** class which uses hierarchical data to compute the cell positions, colors and generates a legend with ranges. **See below or [Github](https://github.com/analyzer2004/hheatmap) for the API reference and source code**.`
)});
  main.variable(observer("viewof options")).define("viewof options", ["form","html"], function(form,html){return(
form(html`<form>
Shape: <select name="shape">
  <option value="circle">Circle</option>
  <option value="square">Square</option>  
</select><span>&nbsp;&nbsp</span>
Dataset: <select name="dataset">
  <option value="small">Small</option>
  <option value="large">Large</option>
</select></form>`)
)});
  main.variable(observer("options")).define("options", ["Generators", "viewof options"], (G, _) => G.input(_));
  main.variable(observer("chart")).define("chart", ["d3","width","height","Heatmap","data","options","drawLegend"], function(d3,width,height,Heatmap,data,options,drawLegend)
{
  const svg = d3.create("svg") 
    .attr("cursor", "default")
    .attr("font-size", "11pt")
    .attr("viewBox", [0, 0, width, height]);  
    
  const map = new Heatmap()
    .size(width, 640)
    .padding(2)
    .mapHeight(10)
    .data(d3.hierarchy(data));
  
  const cells = svg.selectAll("g")
    .data(map.populate())
    .join("g")
    .attr("opacity", 0)    
    .attr("fill", d => d.color)
    .attr("transform", d => `translate(${d.x0}, 0)`)
    .call(g => g.append("title").text(d => d.data ? `${d.data.name}\n${d3.format("$,.2f")(d.data.value)}` : ""));      

  cells.filter(d => options.shape === "square" ? true : d.height > 0)
    .append("rect")      
    .attr("rx", 6).attr("ry", 6)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  if (options.shape === "circle") {
    cells.filter(d => d.height === 0)
      .append("circle")
      .attr("cx", d => d.cx).attr("cy", d => d.cy)
      .attr("r", d => d.r);
  }  
    
  cells.append("g")
    .attr("text-anchor", "middle")
    .attr("transform", d => `translate(${(d.x1 - d.x0) / 2},${(d.y1 - d.y0) / 2})`)
    .call(g => g.append("text")
          .attr("fill", "white")
          .text(d => d.data ? 
                  (options.dataset === "large" && d.height === 0 ? d.data.name.slice(0, 3) : d.data.name) : ""))
    .call(g => g.append("text")
          .attr("dy", "1em")
          .attr("fill", "white")
          .text(d => d.data ? d3.format("$.2s")(d.data.value) : ""));
  
  cells.transition().duration(d => d.depth * 250)
    .ease(d3.easeBounce)
    .attr("opacity", 1)
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
    .transition().delay(1000)
    .on("end", () => {
      cells.on("mouseover", (e, d) => { 
        if (d.data) {      
          const a = d.ancestors();
          cells.transition().duration(500)
            .attr("opacity", c => a.includes(c) ? 1 : 0.5);
        }})
      .on("mouseout", () => cells.transition().duration(500).attr("opacity", 1));
    });
  
  svg.append("g").call(g => drawLegend(g, map.legend(9), cells));
  
  return svg.node();
}
);
  main.variable(observer("drawLegend")).define("drawLegend", ["width"], function(width){return(
(g, ld, cells) => {  
  g.attr("font-weight", "bold")    
    .attr("transform", `translate(${width - ld.width},660)`)
    .call(g => g.append("text")
          .attr("dy", "-0.3em")
          .attr("font-size", "9pt")
          .attr("text-anchor", "end")                    
          .attr("transform", `translate(${ld.width},0)`)
          .text("Sales(USD)"))
    .selectAll("g")
    .data(ld.cells)
    .join("g")
    .attr("font-size", "8pt")    
    .attr("transform", d => `translate(${d.x},0)`)
    .call(g => g.append("rect")          
          .attr("width", d => d.width).attr("height", "1.5em")
          .attr("fill", d => d.color))
    .call(g => g.append("text")
          .attr("dy", "2.7em")
          .text(d => d.label))
    .on("mouseover", (e, d) => 
        cells.filter(c => c.height === 0 && c.data && (c.data.value < d.floor || c.data.value >= d.ceiling))
        .transition().duration(500).attr("opacity", 0.2))
    .on("mouseout", () => cells.transition().duration(500).attr("opacity", 1));
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# API Reference
* **Heatmap()** - Constructs a new hierarchical heatmap generator with the default settings.
* **size(width, height)** - Sets this heatmap's dimensions to specified width and height and returns this heatmap.
* **padding(padding)** - Sets the padding to the specified number and returns this heatmap.
* **legendCellWidth(width)** - Sets the width for each cell of the legend and returns this heatmap.
* **mapHeight(height)** - Sets the number of rows for the heatmap part and returns this heatmap.
* **groupColors(color)** - Sets the color range of group cells and returns this heatmap. If a single color is specified, it sets the color range to [color, **1.5 times brighter** of the color], otherwise you can simply specify a color range [start, end] or a color interpolator.
* **cellColor(color)** - Sets the color range of map cells and returns this heatmap. If a single color is specified, it sets the color range to [color, **2 times darker** of the color], otherwise you can simply specify a color range [start, end] or an color interpolator.
* **emptyColor(color)** - Sets the color of empty cells and returns this heatmap.
* **data(data)** - Sets the hierarchical data to generate the map and returns this heatmap.
* **populate()** - Computes and assigns the following properties on root and its descendants:
  * node.**x0** - the left edge of the cell
  * node.**y0** - the top edge of the cell
  * node.**x1** - the right edge of the cell
  * node.**y1** - the bottom edge of the cell
  * node.**color** - the color of the cell
  * node.**cx** - the x of the center of the circle *(Only applys to leaves)*
  * node.**cy** - the y of the center of the circle *(Only applys to leaves)*
  * node.**r** - the radius of the circle
* **legend(segments, format)** - Computes and returns an array that represents each cell of the legend:
  * cell.**x** - the left edge of the cell
  * cell.**width** - the width of the cell
  * cell.**label** - the formated number of the cell
  * cell.**color** - the color of the cell
  * cell.**floor** - the floor of the range this cell represents
  * cell.**ceiling** - the ceiling of the range this cell represents
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Source Code`
)});
  main.variable(observer("Heatmap")).define("Heatmap", ["d3"], function(d3){return(
class Heatmap {
    constructor() {
        this._width = 0;
        this._height = 0;
        this._actualHeight = 0;
        this._padding = 0;
        this._legendCellWidth = 30;
        this._mapHeight = 5;
        this._minHeaderHeight = 45;
        this._data = null;
        this._groupColors = ["#107bab", "#3f95bb"];
        this._cellColors = ["#dee7c6", "#667848"];
        this._emptyColor = "#eee";
        this._groupScale = null;
        this._cellScale = null;
    }

    size(width, height) {
        return arguments.length ? (this._width = width, this._height = height, this) : [this._width, this._height];
    }

    padding(_) {
        return arguments.length ? (this._padding = _, this) : this._padding;
    }

    legendCellWidth(_) {
        return arguments.length ? (this._legendCellWidth = _, this) : this._legendCellWidth;
    }

    mapHeight(_) {
        return arguments.length ? (this._mapHeight = _, this) : this._mapHeight;
    }

    groupColors(color) {
        if (arguments.length) {
            if (typeof color === "string") {
                const c = d3.color(color);
                this._groupColors = [c, c.brighter(1.5)];
            }
            else {
                this._groupColors = color;
            }
            return this;
        }
        else return this._groupColors;
    }

    cellColors(color) {
        if (arguments.length) {
            if (typeof color === "string") {
                const c = d3.color(color);
                this._cellColors = [c, c.brighter(2)];
            }
            else {
                this._cellColors = color;
            }
            return this;
        }
        else return this._cellColors;
    }

    emptyColor(_) {
        return arguments.length ? (this._emptyColor = _, this) : this._emptyColor;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._data;
    }

    get actualHeight() {
        return this._actualHeight;
    }

    populate() {
        const { d, m, columns, slns } = this._align();
        // Leaf nodes are arranged vertically, all nodes at other levels are horizontally arranged
        // The height of a node at other levels is half of a leaf node        
        const unitHeight = this._height / ((d - 1) / 2 + this._mapHeight);
        const unitWidth = this._width / slns.length;

        var cellHeight, mapCellHeight;
        const mapCellWidth = unitWidth / columns;

        var uh = unitWidth < unitHeight ? unitWidth : unitHeight;
        // Header cells require a minimum height for properly displaying its content.
        // If the calculated unit height is less then the threshold, 
        // it will be limited to the requirement and the mapCellHeight will be calulated based on this limitation
        if (uh < this._minHeaderHeight * 2) {
            cellHeight = this._minHeaderHeight * 2;
            // Calculate mapCellHeight based on new available height
            const mh = (this._height - (d - 1) * cellHeight / 2) / this._mapHeight;
            mapCellHeight = mapCellWidth < mh ? mapCellWidth : mh;
        }
        else {
            // Normal situation
            cellHeight = unitWidth < unitHeight ? unitWidth : unitHeight;
            mapCellHeight = mapCellWidth < unitHeight ? mapCellWidth : unitHeight;
        }

        // Update actualHeight
        this._actualHeight = (d - 1) * cellHeight / 2 + mapCellHeight * this._mapHeight;

        // only leaf nodes use full cellHeight
        var x = 0;
        slns.forEach(p => {
            p.children.forEach((n, i) => {
                const y = (d - 1) * cellHeight / 2 + i % this._mapHeight * mapCellHeight; // d - 1 => leaf level
                const cellX = x + mapCellWidth * Math.floor(i / this._mapHeight);
                this._setPos(n, cellX, cellX + mapCellWidth, y, y + mapCellHeight);
            });
            const y = (d - 2) * cellHeight / 2; // d - 2 => the 2nd to last level
            this._setPos(p, x, x + unitWidth, y, y + cellHeight / 2);
            x += unitWidth;
        });

        // all other levels except leaf and the 2nd to last
        for (var i = d - 3; i >= 0; i--) {
            x = 0;
            this._getNodes(i).forEach(n => {
                const w = n.children.reduce((a, b) => a + (b.x1 - b.x0), 0),
                    y = i * cellHeight / 2;
                this._setPos(n, x, x + w, y, y + cellHeight / 2);
                x += w;
            });
        }

        this._updateScales();
        this._finalize(d);

        return this._data;
    }

    legend(segments, format) {
        const dataset = this._data.leaves().filter(d => d.data).map(d => d.data.value);
        const s = this._sample(d3.extent(dataset), segments)
            .filter(s => dataset.find(d => d >= s.floor && d < s.ceiling));

        format = format || ".2s";
        return {
            width: s.length * this._legendCellWidth,
            cells: s.map((d, i) => ({
                x: i * this._legendCellWidth,
                width: this._legendCellWidth,
                label: d3.format(format)(d.floor),
                color: d3.color(this._cellScale(d.floor)).formatHex(),
                floor: d.floor,
                ceiling: d.ceiling
            }))
        };
    }

    _sample(ext, segments) {
        const min = ext[0], max = ext[1],
            gap = (ext[1] - ext[0]) / segments;

        var curr = { floor: min, ceiling: 0 };
        const s = [curr];
        for (var i = min + gap; i < max - gap; i += gap) {
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

    _align() {
        const d = this._getDepth();
        // Nodes at the second to last level
        const slns = this._getNodes(d - 2);
        // Maximum number of children at the second to last level
        const m = Math.max.apply(null, slns.map(d => d.children.length));

        // the mapHeight cannot exceed m
        if (this._mapHeight > m) this._mapHeight = m;

        // Calculate maximum number of columns based on m then get a unified number of cells
        const columns = Math.ceil(m / this._mapHeight);
        const cells = columns * this._mapHeight;

        // Align based on the unified number of cells
        slns.forEach(n => {
            for (var i = n.children.length; i < cells; i++) {
                n.children.push({
                    data: null,
                    height: 0,
                    depth: n.depth + 1,
                    parent: n
                });
            }
        });

        return { d, m, columns, slns };
    }

    _setPos(node, x0, x1, y0, y1) {
        node.x0 = x0;
        node.x1 = x1;
        node.y0 = y0;
        node.y1 = y1;
    }

    _finalize(depth) {
        this._data.descendants().forEach(n => {
            this._setPos(n, n.x0 + this._padding, n.x1 - this._padding, n.y0 + this._padding, n.y1 - this._padding);
            const c = !n.data ? 
                  this._emptyColor : n.depth <= depth - 2 ?
                  this._groupScale(n.depth) : this._cellScale(n.data.value);
            n.color = d3.color(c).formatHex();
        });

        // circle
        const leaves = this._data.leaves();
        if (leaves && leaves.length > 0) {
            const sample = leaves[0];
            const x = sample.x1 - sample.x0,
                y = sample.y1 - sample.y0;
            const hx = x / 2, hy = y / 2;
            const r = hx < hy ? hx : hy;
            leaves.forEach(n => {
                n.cx = hx;
                n.cy = hy;
                n.r = r;
            });
        }
    }

    _updateScales() {
        this._groupScale = this._scale(this._groupColors)
            .domain(this._data.height === 1 ? [0, 0] : this._seq(this._data.height));
        //.range(seq(map.height).map(i => d3.interpolatePuBu((10 - i * 1) * 0.1)))

        this._cellScale = this._scale(this._cellColors)
            .domain(d3.extent(this._data.leaves().filter(d => d.data).map(d => d.data.value)))
    }

    _scale(range) {
        if (typeof range === "function")
            return d3.scaleSequential(range);
        else
            return d3.scaleSequential().range(range);
    }

    _seq(length) {
        return Array.apply(null, { length: length }).map((d, i) => i);
    }

    _walkthrough(n, f) {
        f(n);
        if (n.children) n.children.forEach(d => this._walkthrough(d, f));
    }

    _getDepth() {
        if (this._data.height)
            return this._data.height + 1;
        else {
            var depth = this._data.depth;
            this._walkthrough(this._data, n => { if (n.depth > depth) depth = n.depth; });
            return depth + 1;
        }
    }

    _getNodes(level) {
        const nodes = [];
        this._walkthrough(this._data, n => { if (n.depth === level) nodes.push(n); });
        return nodes;
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Imports and other stuff...`
)});
  main.variable(observer("data")).define("data", ["options","FileAttachment"], async function(options,FileAttachment){return(
options.dataset === "small" ? await FileAttachment("isales@2.json").json() : await FileAttachment("large.json").json()
)});
  main.variable(observer("width")).define("width", function(){return(
1024
)});
  main.variable(observer("height")).define("height", function(){return(
700
)});
  const child1 = runtime.module(define1);
  main.import("form", child1);
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  main.variable(observer()).define(["md"], function(md){return(
md`🌐[ericlo.dev](https://ericlo.dev) 🐱[GitHub Repositories](https://github.com/analyzer2004?tab=repositories) 🐦[Twitter](https://twitter.com/analyzer2004)`
)});
  return main;
}
