// https://observablehq.com/@analyzer2004/svgtable@1787
import define1 from "./8d271c22db968ab0@158.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["anatomy.png",new URL("./files/88e006c569903c680cb3b8bf4d00a750f15c5e7c5fc8b62a97b410160d58c3adc1ff4bc58bddf8ce9fb31dd92da671bbd11ac0dba48d9cf3b2b5986538e2b324",import.meta.url)],["profit@1.csv",new URL("./files/7a88681c221d6f70d624144ad2c81c5414c9b3a390f5245fd2cde6b4efef3bdfdc208619fce1ebd64fad0be71ba3acd0e54ea1440daf5a797108b52c3ae9b2e2",import.meta.url)],["statecodes@1.csv",new URL("./files/c65af6575dd3c4c20bc9e2d9af272c3fc409d4f9c8324c68395e4042d8a772a3ce6d9ddfd8a0b2dcaf1e900319cd786c5744cbb9d15d50d4e2c7acc721259e64",import.meta.url)],["sea19.csv",new URL("./files/df1cfc7ac78875e86695d62e7b1094475334eda9f204b5d22f24ec31d8af006fb6e67e5f26c4d67d53566281815cab0f401ac048396d678661c55f8c9f927919",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# SVG DataGrid with many features and a live COVID Dashboard demo

It is easy to draw a table using SVG, but how about a table with fixed columns and rows? Well, it's not as hard as you think. Firstly, think of the scrollable part of the table as a viewport, only a part of the content is visible. The visible part changes as user scrolls the table or moves its sliders, and the rest of the content moves to the outside of the viewport. The viewport is constrained by fixed rows and columns. When user vertically scrolls the table, the header rows are fixed but everything else moves accordingly; if user scrolls the table horizontally, everything moves except the header columns.

*<span style="font-size: 11pt">Below is a functional COVID-19 dashboard incorporated with a column chart, a miniature grid cartogram and the SVG table itself. The sales dataset is just another type of data for the demonstration. Before you keep reading, play with the demo to see what the table can do and how it interacts with other elements.</span>*

*<span style="font-size: 11pt">Click a cell to lock the focus, to release just click the same cell again or press Esc. It is very useful in locating a focused row after the table has been sorted, or if you need to keep the highlight while moving the mouse to another part of the dashboard.</span>*`
)});
  main.variable(observer("viewof options")).define("viewof options", ["form","html"], function(form,html){return(
form(html`<form style="font-size: 11pt">
Dataset: 
<label for="covid"><input name="dataset" id="covid" type="radio" value="covid" group="d" checked>COVID</label>
<select name="field">
<option value="newcases">newcases</option>
<option value="newdeaths">newdeaths</option>
<option value="cases">cases</option>
<option value="deaths">deaths</option>
</select>
<label for="sales"><input name="dataset" id="sales" type="radio" value="sales" group="d">Sales Data</label>
<br>
Sticky Columns: <input name="cols" type="range" min="0" max="3" value="1" style="width: 50px">
<span style="margin-left: 10px">Rows: <input name="rows" type="range" min="0" max="4" value="1" style="width: 50px"></span>
<span style="margin-left: 10px">
<input type="checkbox" name="border">Border</input>
<input type="checkbox" name="heatmap" checked>Heatmap</input>
</span><br>
Font Size: <input name="fontsize" type="range" min="8" max="14" value="11" style="width: 50px">
Highlight: 
<input name="highlight" id="none" type="radio" value="none" group="h"><label for="none">None</label>
<input name="highlight" id="cross" type="radio" value="cross" group="h" checked><label for="cross">Cross</label>
<input name="highlight" id="cell" type="radio" value="cell" group="h"><label for="cell">Cell</label>
<br>
Header: <input type="color" name="header" value="#dddddd" style="height:16px">
<span style="margin-left: 10px">Fixed Cell: <input type="color" name="fixed" value="#eeeeee" style="height:16px"></span>
<span style="margin-left: 10px">Cell: <input type="color" name="cell" value="#ffffff" style="height:16px"></span>
<span style="margin-left: 10px">Border: <input type="color" name="borderColor" value="#aaaaaa" style="height:16px"></span>
<span style="margin-left: 10px">Text: <input type="color" name="text" value="#000000" style="height:16px"></span>
<span style="margin-left: 10px">Highlight: <input type="color" name="highlightColor" value="#fff3b0" style="height:16px"></span>
</form>`)
)});
  main.variable(observer("options")).define("options", ["Generators", "viewof options"], (G, _) => G.input(_));
  main.variable(observer("dashboard")).define("dashboard", ["d3","options","SVGTable","data","resetGrid","miniChart","miniMap"], function*(d3,options,SVGTable,data,resetGrid,miniChart,miniMap)
{
  const svg = d3.create("svg")
    .attr("font-size", `${options.fontsize}pt`)
    .attr("viewBox", [0, 0, 975, 610]);    
  
  yield svg.node(); // for autoSizeCell
  
  const table = new SVGTable(svg)
    .extent([[25, 25], [900, 400]])
    .fixedRows(+options.rows)
    .fixedColumns(+options.cols)
    .rowsPerPage(100)
    .autoSizeCell(true)
    .defaultColumnWidth(options.dataset === "covid" ? 100 : 140)
    .defaultNumberFormat(options.dataset === "covid" ? ",.0d" : "$,.2f")
    .style({
      border: options.border,
      borderColor: options.borderColor,
      textColor: options.text,
      highlight: options.highlight,
      background: options.cell,
      headerBackground: options.header,
      fixedBackground: options.fixed,
      highlightBackground: options.highlightColor
    })
    .heatmap(options.heatmap)
    .heatmapPalette(d3.interpolateReds)
    .data(data)
    .onhighlight((e, c) => {
      chart(c);
      map(c);
    });  
    
    table.render();
  
  resetGrid();
  const chart = miniChart(svg, 50, 435, 600, 125);
  const map = miniMap(svg, 700, 435, 200, 125);
  return svg.node();
}
);
  main.variable(observer()).define(["md","FileAttachment","tex"], async function(md,FileAttachment,tex){return(
md`To implement this, the table has to be separated into two sections: the header and the body, and each section is also divided into fixed and movable parts. Let's take a look at the table body first. The table body contains fixed columns and other movable columns, while the visible area is limited by a clipPath. The fixed part has to be on top of the movable part. It covers the left part of the table and always stays in the same position when user horizontally scrolls the table.

The structure of the header area is pretty much the same as the body. It is divided into two, and the view of the movable section is also constrained by its own clipPath. The movement of the header is synchronzied with the body, as it moves together when user scrolls the table horizontally.

<figure>${Object.assign(await FileAttachment("anatomy.png").image(), { alt: 'body', style: 'width: 100%; max-width: 440px;' })}</figure>

Everything has to be rendered in this specific order: the movable part of the body, fixed columns, movable part of the header and then the fixed header. Now that we have created an SVG table, let's make it scrollable! To scroll the table, you need to draw scrollbars and instruct them how the content should be moved accordingly in each direction. The calculation is simple: to reposition the content vertically, set the translate of the table body to (0, **y**). That comes out to:

${tex.block`y = -y_s(\frac{h_1 - h_2}{h_2 - h_s})`}
${tex.block`\begin{aligned}
y_s &: \text{y of slider} \\
h_1 &: \text{height of entire content} \\
h_2 &: \text{height of visibile content} \\
h_s &: \text{height of slider}
\end{aligned}`}

The table now scrolls as user drags the slider up and down, and it is the same for the horizontal scrollbar as well. 

That's pretty much it. The whole implementation is packed in the SVGTable and Scrollbar class, **see below or [Github](https://github.com/analyzer2004/svgtable) for the API reference and source code.**

# API Reference
## SVGTable`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`* *** ToDo ***
  * ~~h-scroll by trackpad / mouse wheel~~
  * ~~heatmap~~
  * reorder columns by drag-n-drop
  * ~~auto columnWidht and cellHeight~~
  * ~~pagination~~
  * rows/cells - enter-update-exit pattern
  * touch`
)});
  main.variable(observer()).define(["d3","width","SVGTable","sample"], function*(d3,width,SVGTable,sample)
{
  const svg = d3.create("svg")
    .attr("font-size", "11pt")
    .attr("viewBox", [0, 0, width, 260]);
  
  yield svg.node();
  
  new SVGTable(svg)
    .size([width, 250])
    .fixedRows(0)
    .fixedColumns(1)
    .rowsPerPage(25)    
    .defaultNumberFormat(",.0d")
    .style({ border: false })
    .data(sample)  
    .onhighlight(context => { /* do something */ })
    .render();    
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`* **SVGTable(svg, [container])** - Constructs a new table with default settings. The container can be a svg or any g element, if it is not specified the container will be the svg itself.
* **defaultColumnWidth(width)** - Sets the default column width and returns this table.
* **cellHeight(height)** - Sets the cell height and returns this table.
* **cellPaddingH(padding)** - Sets the cell padding (left, right) and returns this table.
* **cellPaddingV(padding)** - Sets the cell padding (top, bottom) and returns this table.
* **autoSizeCell(auto)** - Specifies if the table should automatically calculate cell size according to its content and returns this table.
* **fixedColumns(num)** - Sets the number of fixed (sticky) columns and returns this table.
* **fixedRows(num)** - Sets the number of fixed (sticky) rows and returns this table. The number does not include the header row as it is always fixed.
* **extent(extent)** - Sets the extent of the table to the specified bounds and returns this table. The extent bounds are specified as an array *[[x0, y0], [x1, y1]]*, where *x0* is the left side of the extent, *y0* is the top, *x1* is the right and *y1* is the bottom.
* **size(size)** - Sets the table's dimensions to specified width and height and returns this table. The size is specified as an array *[width, height]*.
* **rowsPerPage(num)** - Sets the number of rows per page and returns this table. The paginator shows up if the data is longer than this number.
* **rowsPerPageSelections(selections)** - Sets the available choices of rows per page and returns this table. The selections are specified as an array, default selections are [25, 50, 75]. 
* **style(style)** - Overrides the default style and returns this table
  * style.**border** - a boolean value that determines the visibility of the border
  * style.**borderColor** - the color of border
  * style.**textColor** - the color of text
  * style.**background** - the background color of non-sticky cells
  * style.**headerBackground** - the background color of header cells
  * style.**fixedBackground** - the background color of fixed (sticky) cells
  * style.**highlight** - the style of hover effect: ***none, cell or cross***, default is cross
  * style.**highlightBackground** - the background color of highlight
* **heatmap(enabled)** - Enables of disables heatmap map and returns this table
* **heatmapPalette(palette)** - Sets the color palette of heatmap and returns this table. The palette can be an array of colors or a color interpolator.
* **columns(columns)** - Overrides the default settings of columns and returns this table. The columns are specified as an array of column object:
  * column.**name** - the name of column
  * column.**isNumber** - specify if the column is a numeric column
  * column.**format** - the number format of the column
  * column.**width** - the width of the column
* **data(data)** - Sets the data and returns this table
* **render()** - Renders the table using the data specified by data() and returns this table
* **getRowData(index)** - Returns values for all the cells in the specified row
* **getColumnData(index)** - Returns values for all the cells in the specified column
* **onhighlight(e, context)** - Occurs when the mouse pointer enters a cell. The context object contains the cell context:
  * context.**cell**: the highlighted cell object
    * cell.**rowIndex**: the row index of the cell
    * cell.**column**: the column of the cell
    * ~~cell.**columnIndex**: the column index of the cell~~ is now cell.**column.index**
    * cell.**value**: the value of the cell
  * context.**column**: the column object of the cell
  * context.**getRow()**: returns values for all the cells of the column based on highlighted cell
  * context.**getColumn()**: returns value of all the cells of the row based on highlighted cell
* **onclick(e, cell)** - Occurs when clicks a cell.
* **oncontextmenu(e, cell)** - Occurs when right clicks a cell.
* **onchangepage(begin)** Occurs when user changes the current page by clicking the paginator. The begin parameter is the index of the beginning row of current page.`
)});
  main.variable(observer("SVGTable")).define("SVGTable", ["Paginator","d3","Scrollbar"], function(Paginator,d3,Scrollbar){return(
class SVGTable {
    constructor(svg, container) {
        this._svg = svg;
        this._container = container || svg;
        this._g = null;
        this._charBox = { x: 0, y: 0, width: 0, height: 0 };

        this._autoSizeCell = true;
        this._defaultColumnWidth = 100;
        this._cellHeight = 24; // user setting
        this._cellHeightA = 24; // actual cell height = cellHeight + cellPaddingV * 2
        this._cellPaddingH = 10;
        this._cellPaddingV = 3;
        this._fixedColumns = 0;
        this._fixedRows = 0;

        this._left = 0;
        this._top = 0;
        this._width = 400;
        this._height = 300;
        this._widthA = 0;
        this._heightA = 0;
        this._sliderWidth = 13;
        this._sliderLength = 50;

        this._xf = 1; // horizontal content to scroll factor
        this._yf = 1; // vertical content to scroll factor
        this._minY = 0; // minimum y of the content can be scrolled
        this._fixedWidth = 0;
        this._fixedHeight = 0;

        this._data = null;
        this._fullData = null;
        this._dataIsArray = false;
        this._columns = null;
        this._defaultNumberFormat = "$,.2f";

        this._heatmap = false;
        this._heatmapPalette = null; // interpolator or array of colors
        this._heatmapColor = null;

        this._paginator = null;
        this._paginatorPos = "top";
        this._rowCount = 0;
        this._currPageNum = 0;
        this._rowsPerPage = 50;
        this._beginIndex = 0;
        this._endIndex = 49;
        this._rowsPerPageSelections = [25, 50, 75];

        this._scrollbar = {
            horizontal: null,
            vertical: null,
            visible: [true, true]
        };

        this._style = {
            border: true,
            borderColor: "#aaa",
            textColor: "black",
            background: "white",
            headerBackground: "#ddd",
            fixedBackground: "#eee",
            highlight: "cross", // none, cell, cross
            highlightBackground: "#fff3b0"
        };

        this._table = null;
        this._header = null;
        this._body = null;
        this._dataArea = null;
        this._dataHeader = null;

        this._focus = null;
        this._onsort = null;
        this._onchangepage = null;
        this._onhighlight = null;
        this._onclick = null;
        this._oncontextmenu = null;

        this._uniqueId = new String(Date.now() * Math.random()).replace(".", "");
    }

    defaultColumnWidth(_) {
        return arguments.length ? (this._defaultColumnWidth = +_, this) : this._defaultColumnWidth;
    }

    cellHeight(_) {
        return arguments.length ? (this._cellHeight = +_, this) : this._cellHeight;
    }

    cellPaddingH(_) {
        return arguments.length ? (this._cellPaddingH = +_, this) : this._cellPaddingH;
    }

    cellPaddingV(_) {
        return arguments.length ? (this._cellPaddingV = +_, this) : this._cellPaddingV;
    }

    autoSizeCell(_) {
        return arguments.length ? (this._autoSizeCell = _, this) : this._autoSizeCell;
    }

    fixedColumns(_) {
        return arguments.length ? (this._fixedColumns = +_, this) : this._fixedColumns;
    }

    fixedRows(_) {
        return arguments.length ? (this._fixedRows = +_, this) : this._fixedRows;
    }

    rowsPerPage(_) {
        return arguments.length ? (this._rowsPerPage = +_, this) : this._rowsPerPage;
    }

    rowsPerPageSelections(_) {
        return arguments.length ? (this._rowsPerPageSelections = _, this) : this._rowsPerPageSelections;
    }

    extent(_) {
        return arguments.length ? (
            this._left = +_[0][0], this._top = +_[0][1],
            this._width = +_[1][0], this._height = +_[1][1], this) : [[this._left, this._top], [this._width, this._height]];
    }

    size(_) {
        return arguments.length ? (this._width = +_[0], this._height = +_[1], this) : [this._width, this._height];
    }

    style(_) {
        return arguments.length ? (this._style = Object.assign(this._style, _), this) : this._style;
    }

    heatmap(_) {
        if (arguments.length) {
            this._heatmap = _;
            if (this._table) this._updateHeatmap();
            return this;
        }
        else
            return this._heatmap;
    }

    heatmapPalette(_) {
        if (arguments.length) {
            this._heatmapPalette = _;
            if (this._table) {
                this._processHeatmap();
                if (this._heatmap) this._updateHeatmap();
            }
            return this;
        }
        else
            return this._heatmapPalette;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._data;
    }

    columns(_) {
        if (arguments.length) {
            this._columns = _;
            return this;
        }
        else {
            if (!this._columns && this._data) this._processColumns();
            return this._columns;
        }
    }

    defaultNumberFormat(_) {
        return arguments.length ? (this._defaultNumberFormat = _, this) : this._defaultNumberFormat;
    }

    onsort(_) {
        return arguments.length ? (this._onsort = _, this) : this._onsort;
    }

    onchangepage(_) {
        return arguments.length ? (this._onchangepage = _, this) : this._onchangepage;
    }

    onhighlight(_) {
        return arguments.length ? (this._onhighlight = _, this) : this._onhighlight;
    }

    onclick(_) {
        return arguments.length ? (this._onclick = _, this) : this._onclick;
    }

    oncontextmenu(_) {
        return arguments.length ? (this._oncontextmenu = _, this) : this._oncontextmenu;
    }

    render() {
        if (!this._validate()) {
            // error
        }
        else {
            this._init();
            this._initPaginator();
            this._processColumns();
            this._prepare();

            this._calcConstrains();
            this._createClipPaths();

            this._processHeatmap();
            this._createTable();
            this._renderBody(this._table);
            this._renderHeader(this._table);
            this._addScrollbars();
            if (this._paginator) this._paginator.render();
        }
        return this;
    }

    getRowData(index) {
        return this._data[index];
    }

    getColumnData(index) {
        const c = this._columns[index];
        return this._data.map(_ => _[c.name]);
    }

    get g() { return this._g; }

    get svg() { return this._svg; }

    _init() {
        this._g = this._container.append("g");
        this._cellHeightA = this._cellHeight + this._cellPaddingV * 2;
        this._charBox = this._getBBox("Z");

        this._widthA = this._width;
        this._heightA = this._height;
    }

    _initPaginator() {
        if (this._data.length > this._rowsPerPage) {
            this._fullData = this._data;
            this._rowCount = this._fullData.length;
            this._data = this._fullData.slice(0, this._rowsPerPage);
            this._calcPageRange(1, 0);

            const pr = new Paginator(this);
            const ptop = this._top, ph = this._charBox.height + pr.buttonPadding() / 2 + 3; //3: margin
            this._top += ph;
            this._height -= ph;
            // bottom
            // this._height -= ph - 5;
            // ptop = this._height + this._top + 5;

            pr.init(this._rowsPerPage, this._rowCount)
                .options({
                    position: "top",
                    selector: "right",
                    buttonColor: this._style.headerBackground
                })
                .position([this._left, ptop])
                .recordsPerPageSelections(this._rowsPerPageSelections)
                .onPageNumberChange((pnum, begin, end) => {
                    this._currPageNum = pnum;
                    this._calcPageRange(pnum, begin);
                    this._pageData();
                    this._rerender();
                    if (this._onchangepage) this._onchangepage(this._beginIndex);
                })
                .onRecordsPerPageChange((rpp, pnum, begin, end) => {
                    this._rowsPerPage = rpp;
                    this._currPageNum = pnum;
                    this._calcPageRange(pnum, begin);
                    this._pageData();
                    this._rerender();
                    if (this._onchangepage) this._onchangepage(this._beginIndex);
                });

            this._paginator = pr;
        }
    }

    _calcPageRange(pnum, begin) {
        if (pnum === 1) this._beginIndex = this._fixedRows;
        else this._beginIndex = begin - (pnum - 2) * this._fixedRows;

        this._endIndex = this._beginIndex + this._rowsPerPage - this._fixedRows;
    }

    _pageData() {
        this._data = this._fullData.slice(0, this._fixedRows)
            .concat(this._fullData.slice(this._beginIndex, this._endIndex));
    }

    _rerender() {
        this._g.selectAll("clipPath").remove();
        if (this._table) this._table.remove();
        if (this._scrollbar.horizontal) this._scrollbar.horizontal.dispose();
        if (this._scrollbar.vertical) this._scrollbar.vertical.dispose();

        this._focus = null;
        this._height = this._heightA;
        this._width = this._widthA;
        this._scrollbar.visible = [true, true];

        const ph = this._charBox.height + this._paginator.buttonPadding() / 2;
        this._height -= ph;

        this._processColumns();
        this._prepare();

        this._calcConstrains();
        this._createClipPaths();

        this._createTable();
        this._renderBody(this._table);
        this._renderHeader(this._table);
        this._addScrollbars();
    }

    _validate() {
        return this._data && this._data.length > 0;
    }

    _prepare() {
        this._fixedHeight = this._cellHeightA * this._fixedRows + this._cellHeightA;

        const w = this._sumWidth();
        const h = this._data.length * this._cellHeightA;

        if (w + this._sliderWidth < this._width) {
            this._width = w;
            this._scrollbar.visible[0] = false;
        }
        else {
            this._width -= this._sliderWidth;
        }

        if (h + this._sliderWidth + this._cellHeightA < this._height) {
            this._height = h + this._cellHeightA; // includes header
            this._scrollbar.visible[1] = false;
        }
        else {
            this._height -= this._sliderWidth;
        }
    }

    _sumWidth(n) {
        // n === 0 : do not calculate, usually it is _fixedColumns = 0
        if (n === 0)
            return 0;
        else {
            // n === undefined : all columns
            const l = n || this._columns.length;
            var w = 0;
            for (let i = 0; i < l; i++) w += this._columns[i].width;
            return w;
        }
    }

    _processColumns() {
        if (this._data.length > 0 && this._data[0].length > 0) {
            this._dataIsArray = Array.isArray(this._data[0]);
        }

        if (!this._columns) {
            // CSV or JSON
            const keys = this._data.columns ? this._data.columns : Object.keys(this._data[0]);
            let x = 0;
            this._columns = keys.map((c, i) => {
                const isNumber = typeof this._data[0][c] === "number";
                const column = {
                    name: c,
                    isNumber: isNumber,
                    format: isNumber ? this._defaultNumberFormat : null,
                    order: 0, // 0: none, 1: ascending, 2: descending
                    x: x,
                    tx: x, // x for translate
                    index: i,
                    width: this._defaultColumnWidth
                }
                x += column.width;
                return column;
            });
        }
        else {
            let x = 0;
            this._columns.forEach((column, i) => {
                column.width = column.width || this._defaultColumnWidth;
                column.x = x;
                column.tx = x; // x for translate
                column.index = i;
                x += column.width;
            });
        }

        if (this._autoSizeCell) this._calcSize();

        this._fixedWidth = this._sumWidth(this._fixedColumns);
        for (let i = this._fixedColumns; i < this._columns.length; i++) {
            const c = this._columns[i];
            c.tx = c.x - this._fixedWidth; // x for translate
        }

        this._columns.resetOrder = (except) => this._columns.forEach(c => { if (except && c !== except || !except) c.order = 0; });
    }

    _calcSize() {
        // test if it is used in a generator
        if (this._charBox.width > 0 && this._charBox.height > 0) {

            // overrides cellHeight
            this._cellHeight = this._charBox.height;
            this._cellHeightA = this._charBox.height + this._cellPaddingV * 2;

            // prepare keys
            const keys = [];
            const longest = this._columns.map((column, i) => {
                if (this._dataIsArray) keys.push(i);
                else keys.push(column.name);
                return column.name;
            });

            // find the longest string for each column
            for (let i = 0; i < this._data.length; i++) {
                const row = this._data[i];
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j], column = this._columns[j];
                    const val = row[key];
                    if (val) {
                      const curr = column.isNumber && column.format ? d3.format(column.format)(row[key]) : row[key];
                      if (curr.length > longest[j].length) longest[j] = curr;
                    }
                }
            }

            // re-calculate column width for each column based on longest[]
            var x = 0;
            for (let i = 0; i < longest.length; i++) {
                const column = this._columns[i];
                column.x = column.tx = x;
                column.width = this._getBBox(longest[i]).width + this._cellPaddingH * 2 + 20;
                x += column.width;
            }
        }
    }

    _getBBox(str) {
        var t;
        try {
            t = this._svg.append("text").text(str);
            return t.node().getBBox();
        }
        finally {
            t.remove();
        }
    }

    _processHeatmap() {
        if (!this._heatmapPalette) return;

        const data = this._fullData || this._data;
        const all = data.slice(this._fixedRows).flatMap(d => {
            const r = this._dataIsArray ?
                d.slice(this._fixedColumns) :
                Object.keys(d).map(k => d[k]).slice(this._fixedColumns);

            const values = [];
            for (let i = 0; i < r.length; i++) {
                const col = this._columns[i + this._fixedColumns];
                if (col.isNumber) values.push(this._dataIsArray ? r[i] : r[col.name]);
            }
            return r;
        })

        const ext = d3.extent(all);
        const p = this._heatmapPalette;
        if (Array.isArray(p)) {
            // Palette is an array
            this._heatmapColor = d3.scaleSequential()
                .domain(this._series(ext[0], ext[1], p.length))
                .range(p);
        }
        else if (typeof p === "function") {
            // Palette is a color interpolator
            this._heatmapColor = d3.scaleSequential(p)
                .domain(ext);
        }
    }

    _series(min, max, num) {
        const n = num - 1, s = [min], intrv = max / n;
        var i = min;
        while (i < max && s.length < num) {
            i += intrv;
            s.push(i);
        }

        if (s.length < num)
            s.push(max);
        else
            s[s.length - 1] = max;

        return s;
    }

    _createClipPaths() {
        const addClipPath = (id, width, height, x, y) => {
            const cp = this._g.append("clipPath")
                .attr("id", `${id}.${this._uniqueId}`)
                .append("rect")
                .attr("width", width)
                .attr("height", height);

            if (x) cp.attr("x", x);
            if (y) cp.attr("y", y);
        }

        addClipPath("bodyClip", this._width, this._height);
        addClipPath("headerRowClip", this._width - this._fixedWidth, this._fixedHeight + 1, null, -1);
        this._columns.forEach((column, i) => {
            addClipPath("headerClip" + i, column.width - this._cellPaddingH, this._cellHeightA);
            if (column.isNumber)
                addClipPath("cellClip" + i, column.width - this._cellPaddingH, this._cellHeightA, -(column.width - this._cellPaddingH));
            else
                addClipPath("cellClip" + i, column.width - this._cellPaddingH, this._cellHeightA);
        })
    }

    _clipPath(id) {
        return `url(#${id}.${this._uniqueId})`;
    }

    _createTable() {
        // table container
        this._table = this._g.append("g")
            .attr("transform", `translate(${this._left},${this._top})`)
            .on("wheel", e => this._scroll(e))
            .on("mousewheel", e => this._scroll(e))
            .on("DOMMouseScroll", e => this._scroll(e));
    }

    _renderBody() {
        const that = this, style = this._style,
            highlight = style.highlight !== "none",
            cross = style.highlight === "cross";

        // table body container
        const bodyBox = this._table.append("g").attr("clip-path", this._clipPath("bodyClip"));
        // inner container of the table body, y is controlled by vertical scrollbar and its content is clipped by bodyClip  
        // it contains two parts: dataArea which is horizontally moveable and fixed columns on the left
        const body = bodyBox.append("g").attr("transform", `translate(0,${this._fixedHeight})`);
        // container of the moveable part of the body
        const dataArea = body.append("g")
            .attr("transform", `translate(${this._fixedWidth},0)`);

        const rows = this._data.slice(this._fixedRows);
        //if (this._dataIsArray) rows.forEach(r => r[0].origin = r);
        // moveable part of the body, x is controlled by horizontal scrollbar
        const cell = this._addRows(
            dataArea,
            "row",
            () => rows,
            (d, i) => this._columns.slice(this._fixedColumns).map((c, j) => {
                return {
                    rowIndex: i + this._fixedRows,
                    column: c,
                    value: this._dataIsArray ? d[c.index] : d[c.name]
                }
            }),
            (d, i) => `translate(0,${i * this._cellHeightA})`,
            d => `translate(${d.column.tx},0)`,
            g => this._addCell(g, style.background, this._fixedColumns))
            .on("click", click)
            .on("contextmenu", contextmenu)
            .on("mouseover", mouseover)
            .on("mouseleave", mouseleave);

        var fixedCell;
        if (this._fixedColumns) {
            // fixed columns on the left
            fixedCell = this._addRows(
                body.append("g"),
                "row",
                () => rows.map((r, i) => this._columns.slice(0, this._fixedColumns).map((c, j) => ({
                    origin: r, // for sort to get the index of data
                    rowIndex: i + this._fixedRows,
                    column: c,
                    value: this._dataIsArray ? r[c.index] : r[c.name]
                }))),
                d => d,
                (d, i) => `translate(0,${i * this._cellHeightA})`,
                d => `translate(${d.column.tx},0)`,
                g => this._addCell(g, style.fixedBackground, 0, false, true));
        }

        this._body = body;
        this._dataArea = dataArea;

        const test = cross ?
            (d, cell) => cell.rowIndex === d.rowIndex || cell.column.index === d.column.index :
            (d, cell) => cell.rowIndex === d.rowIndex && cell.column.index === d.column.index;

        d3.select("body").on(`keydown.eric.svgtable.${this._uniqueId}`, keypress);

        function keypress(e) {
            if (e.key === "Escape") that._focus = null;
        }

        function click(e, d) {
            if (that._focus !== d) {
                that._focus = null;
                mouseover(e, d);
                that._focus = d;
            }
            else
                that._focus = null;

            if (that._onclick) that._onclick(e, d);
        }

        function contextmenu(e, d) {
            if (that._oncontextmenu) {
                if (that._focus !== d) {
                    that._focus = null;
                    mouseover(e, d);
                    that._focus = d;
                    that._oncontextmenu(e, d);
                }
                return false;
            }
        }

        function mouseover(e, d) {
            if (!highlight || that._focus) return;

            const r = cell.select("rect")
                .datum(cell => test(d, cell) ? style.highlightBackground : that._cellColor(cell, style.background, false, false))
                .attr("fill", d => d);
            if (!that._style.border) r.attr("stroke", d => d);

            if (fixedCell) fixedCell.select("text").attr("font-weight", cell => cell.rowIndex === d.rowIndex ? "bold" : "");
            that._dataHeader.selectAll("text").attr("font-weight", cell => cell.column.index === d.column.index ? "bold" : "");

            if (that._onhighlight) {
                that._onhighlight(e, {
                    cell: d,
                    column: d.column,
                    getRow: () => that.getRowData(d.rowIndex),
                    getColumn: () => that.getColumnData(d.column.index)
                });
            }
        }

        function mouseleave() {
            if (!highlight || that._focus) return;

            const r = cell.select("rect").attr("fill", d => that._cellColor(d, style.background, false, false));
            if (!that._style.border) r.attr("stroke", d => that._cellColor(d, style.background, false, false));

            if (fixedCell) fixedCell.select("text").attr("font-weight", "");
            that._dataHeader.selectAll("text").attr("font-weight", "");
        }
    }

    _updateHeatmap() {
        const bg = this._style.background;
        const rects = this._dataArea.selectAll("rect");
        if (this._heatmap) {
            rects.attr("fill", d => this._cellColor(d, bg, false, false));
            if (!this._style.border) rects.attr("stroke", d => this._cellColor(d, bg, false, false));
        }
        else {
            rects.attr("fill", d => bg);
            if (!this._style.border) rects.attr("stroke", bg);
        }
    }

    _renderHeader(g) {
        const style = this._style;

        // fixed rows sliced from this._data
        const rows = this._data.slice(0, this._fixedRows);
        // header container
        const header = g.append("g");
        // top-left cells which are always fixed if fixedColumns is specified
        header.selectAll(".column")
            // Unify the the data structure make it compatible with addCell
            .data(this._columns.slice(0, this._fixedColumns).map((d, i) => ({
                column: d
            })))
            .join("g")
            .attr("class", "column")
            .attr("transform", d => `translate(${d.column.tx},0)`)
            .call(g => this._addCell(g, style.headerBackground, 0, true, true))
            .on("click", (e, d) => this._sort(d));

        // fixed data cells in the fixed columns section
        if (this._fixedColumns) {
            this._addRows(
                header,
                "fixedRow",
                () => rows.map((r, i) => this._columns.slice(0, this._fixedColumns).map((c, j) => ({
                    rowIndex: i,
                    column: c,
                    value: this._dataIsArray ? r[c.index] : r[c.name]
                }))),
                d => d,
                (d, i) => `translate(0,${(i + 1) * this._cellHeightA})`,
                d => `translate(${d.column.tx},0)`,
                g => this._addCell(g, style.fixedBackground, 0, false, true));
        }

        // the container of the rest of the header cells, its content is clipped by headerClip
        const headerBox = header.append("g")
            .attr("clip-path", this._clipPath("headerRowClip"))
            .attr("transform", `translate(${this._fixedWidth},0)`);

        // horizontally moveable part of the header, x is controlled by and synchronized with horizontal scrollbar
        const dataHeader = headerBox.append("g");
        dataHeader.selectAll(".column")
            // Unify the the data structure make it compatible with addCell
            .data(this._columns.slice(this._fixedColumns).map((d, i) => ({
                column: d
            })))
            .join("g")
            .attr("class", "column")
            .attr("transform", d => `translate(${d.column.tx},0)`)
            .call(g => this._addCell(g, style.headerBackground, this._fixedColumns, true, true))
            .on("click", (e, d) => this._sort(d));

        this._addRows(
            dataHeader,
            "fixedRow",
            () => rows,
            (d, i) => this._columns.slice(this._fixedColumns).map((c, j) => {
                return {
                    rowIndex: i,
                    column: c,
                    value: this._dataIsArray ? d[c.index] : d[c.name]
                }
            }),
            (d, i) => `translate(0,${(i + 1) * this._cellHeightA})`,
            d => `translate(${d.column.tx},0)`,
            g => this._addCell(g, style.fixedBackground, this._fixedColumns, false, true)
        );

        // a fixed line for seperating header and body
        g.append("line")
            .attr("stroke", style.borderColor)
            .attr("x1", 0)
            .attr("y1", this._cellHeightA)
            .attr("x2", this._width)
            .attr("y2", this._cellHeightA);

        this._header = header;
        this._dataHeader = dataHeader;
    }

    _sort(d) {
        const sorted = this._sortData(d.column);

        if (this._paginator && this._fullData.length > this._rowsPerPage) {
            const x = this._getX(), y = this._getY();
            this._pageData();
            this._rerender();
            this._moveX(x);
            this._moveY(y);
            if (this._onsort) this._onsort(d.column, this._paginator !== null);
        }
        else {
            const f = 250 / sorted.length;
            this._table.selectAll(".row")
                .transition()
                .duration((d, i) => i * f)
                .ease(d3.easeBounce)
                .attr("transform", d => {
                    const i = Array.isArray(d) && d[0].origin !== undefined ? sorted.indexOf(d[0].origin) : sorted.indexOf(d);
                    return `translate(0,${i * this._cellHeightA})`;
                });
        }

        const cg = this._header.selectAll(".column");
        cg.select(".asc").attr("fill", _ => d.column === _.column && d.column.order === 1 ? "#777" : "#bbb");
        cg.select(".desc").attr("fill", _ => d.column === _.column && d.column.order === 2 ? "#777" : "#bbb");
    }

    _sortData(column) {
        //var sorted = [...this._data].slice(this._fixedRows);
        var fixed, sorted;
        if (this._paginator) {
            if (this._fixedRows > 0) {
                fixed = this._fullData.slice(0, this._fixedRows);
                sorted = this._fullData.slice(this._fixedRows);
            }
            else
                sorted = this._fullData;
        }
        else {
            sorted = [...this._data].slice(this._fixedRows);
        }

        this._columns.resetOrder(column);
        if (column.order === 0)
            column.order = 1;
        else if (column.order === 1)
            column.order = 2;
        else
            column.order = 1;

        const index = this._dataIsArray ? column.index : column.name;

        if (column.order === 0) {
            sorted.sort((a, b) => -1);
        }
        else if (column.isNumber) {
            if (column.order === 1)
                sorted.sort((a, b) => a[index] - b[index]);
            else
                sorted.sort((a, b) => b[index] - a[index]);
        }
        else {
            if (column.order === 1)
                sorted.sort((a, b) => a[index].localeCompare(b[index]));
            else
                sorted.sort((a, b) => b[index].localeCompare(a[index]));
        }

        if (fixed) this._fullData = fixed.concat(sorted);

        return sorted;
    }

    // rows: data function for rows
    // columns: data function for columns
    // rt: row translate function
    // ct: column translate function
    // cell: cell function
    _addRows(g, className, rows, columns, rt, ct, cell) {
        return g.selectAll("." + className)
            .data(rows)
            .join("g")
            .attr("class", className)
            .attr("transform", rt)
            .selectAll(".cell")
            .data(columns)
            .join("g")
            .attr("class", "cell")
            .attr("transform", ct)
            .call(cell)
    }

    // base: number of fixed cells on the same row
    _addCell(g, fill, base, isHeader, isFixed) {
        const style = this._style;

        const rect = g.append("rect")
            .attr("width", d => d.column.width)
            .attr("height", this._cellHeightA)
            .attr("fill", d => this._cellColor(d, fill, isHeader, isFixed))
            .attr("stroke-width", 0.1)
            .attr("stroke", style.border ? style.borderColor : fill);

        if (this._heatmap && !(isHeader || isFixed)) rect.attr("opacity", 0.5);

        const t = g.append("text").attr("y", "1em").attr("dy", this._cellPaddingV).attr("fill", style.textColor);

        if (isHeader) {
            if (!style.border)
                g.append("line")
                    .attr("x1", d => d.column.width - 1).attr("y1", 5)
                    .attr("x2", d => d.column.width - 1).attr("y2", this._cellHeightA - 5)
                    .attr("stroke", style.borderColor);

            this._arrow(g, base, "asc", "M 0 8 L 3 4 L 6 8");
            this._arrow(g, base, "desc", "M 0 11 L 3 15 L 6 11");

            // Header cell
            t.attr("dx", this._cellPaddingH)
                .attr("clip-path", d => this._clipPath(`headerClip${d.column.index}`))
                .text(d => d.column.name);
        }
        else {
            t.attr("class", "value")
                .attr("dx", d => d.column.isNumber ? -this._cellPaddingH : this._cellPaddingH)
                .attr("clip-path", d => this._clipPath(`cellClip${d.column.index}`))
                .attr("transform", d => `translate(${d.column.isNumber ? d.column.width : 0},0)`)
                .attr("text-anchor", d => d.column.isNumber ? "end" : "start")
                .text(d => {
                    if (d.column.isNumber && d.column.format)
                        return d3.format(d.column.format)(d.value);
                    else
                        return d.value;
                });
        }
    }

    _cellColor(d, fill, isHeader, isFixed) {
        if (this._heatmap) {
            if (isHeader || isFixed || !d.column.isNumber)
                return fill;
            else
                return this._heatmapColor(d.value);
        }
        else
            return fill;
    }

    _arrow(g, base, name, path) {
        g.append("path")
            .attr("class", name)
            .attr("d", path)
            .attr("fill", "#bbb")
            .attr("transform", d => `translate(${d.column.width - this._cellPaddingH - 10},2)`);
    }

    _addScrollbars() {
        if (this._scrollbar.visible[1]) this._addVScroll();
        if (this._scrollbar.visible[0]) this._addHScroll();
    }

    _addVScroll() {
        const sb = this._scrollbar.vertical = new Scrollbar(this._svg);
        sb.position(this._left + this._width, this._top + this._fixedHeight, this._height - this._fixedHeight)
            .sliderWidth(this._sliderWidth)
            .sliderLength(this._sliderLength)
            .onscroll((y, sy, delta) => this._body.attr("transform", `translate(0,${-sy * this._yf + this._fixedHeight})`))
            .attach();
    }

    _addHScroll() {
        const sb = this._scrollbar.horizontal = new Scrollbar(this._svg);
        sb.vertical(false)
            .position(this._left + this._fixedWidth, this._top + this._height, this._width - this._fixedWidth)
            .sliderWidth(this._sliderWidth)
            .sliderLength(this._sliderLength)
            .onscroll((x, sx, delta) => {
                this._dataArea.attr("transform", `translate(${-sx * this._xf + this._fixedWidth},0)`);
                this._dataHeader.attr("transform", `translate(${-sx * this._xf},0)`);
            })
            .attach();
    }

    _calcConstrains() {
        // f for both scrollbars = (total - visible) / (visible - slider length)    
        // Vertical scrollbar constrain        
        const th = (this._data.length - this._fixedRows) * this._cellHeightA,
            sh = this._height - this._fixedHeight;
        this._yf = (th - sh) / (sh - this._sliderLength);

        // Horizontal scrollbar constrain
        const tw = this._sumWidth() - this._sumWidth(this._fixedColumns),
            sw = this._width - this._sumWidth(this._fixedColumns);
        this._xf = (tw - sw) / (sw - this._sliderLength);

        this._minX = -(tw - this._width);
        this._minY = -((this._data.length - this._fixedRows) * this._cellHeightA - this._height);
    }

    _scroll(e) {
        if (this._scrollbar.vertical) {
            const dy = e.wheelDeltaY ? e.wheelDeltaY : e.wheelDelta ? e.wheelDelta : -1;
            if (dy === -1) return;

            const cy = this._getY();
            var y = cy + dy;
            this._moveY(y);
        }

        if (this._scrollbar.horizontal) {
            const dx = e.wheelDeltaX;
            if (dx) {
                const cx = this._getX();
                var x = cx + dx;
                this._moveX(x);
            }
        }
        e.preventDefault();
    }

    _getX() { return +this._dataArea.attr("transform").split(",")[0].substring(10); }
    _getY() { return +this._body.attr("transform").split(",")[1].replace(")", ""); }

    _moveX(x) {
        if (x > this._fixedWidth) x = this._fixedWidth;
        else if (x < this._minX) x = this._minX;

        this._dataArea.attr("transform", `translate(${x},0)`);
        this._dataHeader.attr("transform", `translate(${x - this._fixedWidth},0)`);
        if (this._scrollbar.horizontal)
            this._scrollbar.horizontal.moveSlider(-((x - this._fixedWidth) / this._xf));
    }

    _moveY(y) {
        if (y < this._minY) y = this._minY;
        else if (y > this._fixedHeight) y = this._fixedHeight;

        this._body.attr("transform", `translate(0,${y})`);
        if (this._scrollbar.vertical)
            this._scrollbar.vertical.moveSlider(-(y - this._fixedHeight) / this._yf);
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Scrollbar
The Scrollbar is an accessory of the SVGTable, it can also be used independently as a general-purpose scrollbar.`
)});
  main.variable(observer()).define(["d3","width","Scrollbar"], function(d3,width,Scrollbar)
{
  const svg = d3.create("svg")
    .attr("viewBox", [0,0,width,70]);
  
  const rect = svg.append("rect")
    .attr("x",0).attr("y",0)
    .attr("width", 30).attr("height", 30);
  
  new Scrollbar(svg)
    .vertical(false)
    .sliderLength(30)
    .position(0, 35, width)
    .onscroll((x, sx, delta) => rect.attr("x", sx))
    .attach();
  
  return svg.node();
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`* **Scrollbar(svg)** - Constructs a new scrollbar with default settings.
* **vertical(vertical)** - A boolean value sets the orientation of the scrollbar to vertical (which is default) and returns this scrollbar
* **sliderWidth(width)** - Sets the width of the slider and returns this scrollbar
* **sliderLength(length)** - Sets the length of the slider and returns this scrollbar
* **position(x, y, length)** - Sets the position and the length of the scrollbar and return this scrollbar
* **attach() ** - Attaches the scrollbar to the svg
* **moveSlider(pos) ** - Moves the slider to specific position
* **onscroll(pos, edge, delta) ** - Occurs when user moves the slider
  * **pos**: the x or y (depends on the orientation) of the mouse pointer
  * **edge**: the left or top (depends on the orientation) of the slider
  * **delta**: the distance between pointer and the center of the slider`
)});
  main.variable(observer("Scrollbar")).define("Scrollbar", ["d3"], function(d3){return(
class Scrollbar {
    constructor(svg) {
        this._svg = svg;
        this._g = null;
        this._box = null;
        this._vertical = true;
        this._bar = null;
        this._slider = null;

        this._sliderWidth = 13;
        this._sliderLength = 50;

        this._sliderTimer = null;
        this._sliderTimeout = 300;
        this._sliderSteps = null;

        this._grabbing = false;
        this._delta = 0;
        this._deltac = 0;

        this._onscroll = null;
        this._namespace = `eric.scrollbar.${Date.now() * Math.random()}`;
    }

    vertical(_) {
        return arguments.length ? (this._vertical = _, this) : this._vertical;
    }

    sliderWidth(_) {
        return arguments.length ? (this._sliderWidth = _, this) : this._sliderWidth;
    }

    sliderLength(_) {
        return arguments.length ? (this._sliderLength = _, this) : this._sliderLength;
    }

    position(x, y, length) {
        return arguments.length ? (this._box = { x, y, length }, this) : this._box;
    }

    onscroll(_) {
        return arguments.length ? (this._onscroll = _, this) : this._onscroll;
    }

    attach() {
        this._render();
        this._attachEvents();
    }

    dispose() {
        if (this._g) this._g.remove();
        d3.select("body")
            .on(`mousedown.${this._namespace}`, null)
            .on(`mouseup.${this._namespace}`, null)
            .on(`mousemove.${this._namespace}`, null);
    }

    moveSlider(pos) {
        if (pos < 0)
            pos = 0;
        else if (pos + this._sliderLength > this._box.length)
            pos = this._box.length - this._sliderLength;

        this._slider.attr(this._vertical ? "y" : "x", pos);
    }

    _render() {
        if (this._vertical)
            this._renderVBar();
        else
            this._renderHBar();
    }

    _renderVBar() {
        const box = this._box;

        const g = this._svg.append("g")
            .attr("transform", `translate(${box.x},${box.y})`);

        this._bar = g.append("rect")
            .attr("width", this._sliderWidth)
            .attr("height", box.length)
            .attr("fill", "#eee");

        this._slider = g.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", this._sliderWidth)
            .attr("height", this._sliderLength)
            .attr("fill", "#ccc");

        this._g = g;
    }

    _renderHBar() {
        const box = this._box;

        const g = this._svg.append("g")
            .attr("transform", `translate(${box.x},${box.y})`);

        this._bar = g.append("rect")
            .attr("width", box.length)
            .attr("height", this._sliderWidth)
            .attr("fill", "#eee");

        this._slider = g.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", this._sliderLength)
            .attr("height", this._sliderWidth)
            .attr("fill", "#ccc");

        this._g = g;
    }

    _attachEvents(tbox) {
        const box = this._box;

        //this._svg
        d3.select("body")
            .on(`mousedown.${this._namespace}`, e => {
                if (e.buttons === 1) {
                    const p = d3.pointer(e);
                    if (e.srcElement === this._slider.node()) {
                        this._grabbing = true;
                        this._slider.attr("fill", "#aaa");
                        if (this._vertical) {
                            this._delta = p[1] - +this._slider.attr("y");
                            this._deltac = p[1] - +this._slider.attr("y") - this._sliderLength / 2;
                        }
                        else {
                            this._delta = p[0] - +this._slider.attr("x");
                            this._deltac = p[0] - +this._slider.attr("x") - this._sliderWidth / 2;
                        }
                        e.stopPropagation();
                    }
                    else if (e.srcElement === this._bar.node()) {
                        const cbox = this._bar.node().getBoundingClientRect();

                        var a, b, pos;
                        if (this._vertical) {
                            a = pos = +this._slider.attr("y");
                            b = p[1] - cbox.y;
                        }
                        else {
                            a = pos = +this._slider.attr("x");
                            b = p[0] - cbox.x;
                        }

                        const intr = (b - a) / 4;
                        const steps = [];
                        for (var i = 0; i < 3; i++) {
                            pos += intr;
                            steps.push(pos);
                        }

                        if (b + this._sliderLength > this._box.length)
                            steps.push(this._box.length - this._sliderLength);
                        else
                            steps.push(b);

                        this._sliderSteps = steps.reverse();
                        this._sliderTimeout = 200;
                        this._sliderTimer = setTimeout(() => this._slide(), this._sliderTimeout);
                        e.stopPropagation();
                    }
                }
            })
            .on(`mouseup.${this._namespace}`, () => {
                if (this._sliderTimer) clearTimeout(this._sliderTimer);
                const steps = this._sliderSteps;
                if (steps && steps.length > 0) {
                    this._slideTo(steps.reverse().pop());
                    this._sliderSteps = null;
                }

                this._grabbing = false;
                this._slider.attr("fill", "#ccc");
            })
            .on(`mousemove.${this._namespace}`, e => {
                const box = this._box;

                if (this._grabbing) {
                    if (this._vertical) {
                        const y = d3.pointer(e)[1];
                        const sy = y - this._delta;
                        if (sy >= 0 && sy <= box.length - this._sliderLength) {
                            this._slider.attr("y", sy);
                            if (this._onscroll) this._onscroll(y, sy, this._deltac);
                        }
                    }
                    else {
                        const x = d3.pointer(e)[0];
                        const sx = x - this._delta;
                        if (sx >= 0 && sx <= box.length - this._sliderLength) {
                            this._slider.attr("x", sx);
                            if (this._onscroll) this._onscroll(x, sx, this._deltac);
                        }
                    }
                }
            });
    }

    _slideTo(dest) {
        this._slider.attr(this._vertical ? "y" : "x", dest);
        if (this._onscroll) this._onscroll(dest, dest, 0);
    }

    _slide() {
        this._slideTo(this._sliderSteps.pop());
        if (this._sliderSteps.length > 0) {
            this._sliderTimeout -= 50;
            this._sliderTimer = setTimeout(() => this._slide(), this._sliderTimeout);
        }
        else
            this._sliderTimer = null;
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Paginator
An accessory of the SVGTable`
)});
  main.variable(observer("Paginator")).define("Paginator", ["d3"], function(d3){return(
class Paginator {
    constructor(table) {
        this._table = table;
        this._tableWidth = 0;
        this._tableHeight = 0;

        this._top = 0;
        this._left = 0;
        this._pw = 0;
        this._sw = 0;

        this._controls = {
            gotoInput: false,
            recordsPerPageSelector: true
        };
        this._options = {
            position: "top",
            selector: "left",
            buttonColor: "#aaa"
        }
        this._recordsPerPageSelections = [25, 50, 75];

        this._recordCount = 0;
        this._recordsPerPage = 50;
        this._currentPage = 1;
        this._totalPages = 0;
        this._currFloor = 0;
        this._currCeiling = 0;

        this._buttonPadding = 15;
        this._buttonSpacing = 5;
        this._containerTable = null;
        this._selectorCell = null;
        this._paginatorCell = null;

        this._onPageNumberChange = null;
        this._onRecordsPerPageChange = null;
    }

    controls(_) {
        return arguments.length ? (this._controls = _, this) : this._controls;
    }

    options(_) {
        return arguments.length ? (this._options = _, this) : this._options;
    }

    position(_) {
        return arguments.length ? (this._left = _[0], this._top = _[1], this) : [this._left, this.top];
    }

    buttonPadding(_) {
        return arguments.length ? (this._buttonPadding = _, this) : this._buttonPadding;
    }

    buttonSpacing(_) {
        return arguments.length ? (this._buttonSpacing = _, this) : this._buttonSpacing;
    }

    recordsPerPageSelections(_) {
        return arguments.length ? (this._recordsPerPageSelections = _, this) : this._recordsPerPageSelections;
    }

    recordsPerPage(_) {
        if (arguments.length) {
            this._recordsPerPage = _;
            this._totalPages = Math.ceil(this._recordCount / this._recordsPerPage);
            this._validateCurrentPage();
            return this;
        }
        else
            return this._recordsPerPage;
    }

    recordCount(_) {
        if (arguments.length) {
            this._recordCount = _;
            this._totalPages = Math.ceil(this._recordCount / this._recordsPerPage);
            this._validateCurrentPage();
            return this;
        }
        else
            return this._recordCount;
    }

    onPageNumberChange(_) {
        return arguments.length ? (this._onPageNumberChange = _, this) : this._onPageNumberChange;
    }

    onRecordsPerPageChange(_) {
        return arguments.length ? (this._onRecordsPerPageChange = _, this) : this._onRecordsPerPageChange;
    }

    init(recordsPerPage, recordCount) {
        this._recordsPerPage = recordsPerPage;
        this._recordCount = recordCount;
        this._totalPages = Math.ceil(this._recordCount / this._recordsPerPage);
        this._resetBoundary();
        return this;
    }

    render() {
        this._prepare();
        this._createContainers();
        this._renderPaginator();
        if (this._controls.recordsPerPageSelector) {
            this._renderRecordsPerPageSelector();
        }

        this._table.g.append(() => this._containerTable.node());
        return this;
    }

    _prepare() {
        const s = this._table.size();
        this._tableWidth = s[0];
        this._tableHeight = s[1];
    }

    _createContainers() {
        const c = d3.create("svg:g");
        if (this._options.position === "top")
            c.attr("transform", `translate(${this._left},${this._top})`);
        else
            c.attr("transform", `translate(${this._left},${this._top})`);

        this._containerTable = c;
        this._createSelectorCell();
        this._createPaginatorCell();
    }

    _createSelectorCell() {
        if (this._selectorCell) this._selectorCell.remove();
        this._selectorCell = this._containerTable.append("g");
    }

    _createPaginatorCell() {
        if (this._paginatorCell) this._paginatorCell.remove();
        this._paginatorCell = this._containerTable.append("g");
    }

    _renderPaginator(pnum) {
        this._createPaginatorCell();

        //if (this._controls.gotoInput) this._addGotoInput(pnum);
        var tx = 0;
        tx += this._addPageButton(1, tx);
        if (this._currFloor === 1 && this._currentPage < 5) {
            for (let i = 2; i <= this._currCeiling; i++)
                tx += this._addPageButton(i, tx);
        }
        else {
            var floor;
            if (this._totalPages === 5) {
                floor = 2;
            }
            else {
                floor = this._currFloor;
                tx += this._addSeperator(tx);
            }

            for (let i = floor; i <= this._currCeiling; i++) {
                tx += this._addPageButton(i, tx);
            }
        }

        if (this._currCeiling < this._totalPages) {
            tx += this._addSeperator(tx);
            tx += this._addPageButton(this._totalPages, tx);
        }

        this._pw = tx;
        this._adjust();
    }

    _renderRecordsPerPageSelector() {
        this._createSelectorCell();
        var tx = 0;
        this._recordsPerPageSelections.forEach(d => {
            tx += this._addSelectorButton(d, tx);
        });
        this._sw = tx;
        this._selectorCell.attr("transform", `translate(${this._tableWidth - tx},0)`);
    }

    _adjust() {
        const left = this._selectorCell && this._pw > this._tableWidth - this._sw ? this._pw + 30 : this._tableWidth - this._sw;
        this._selectorCell.attr("transform", `translate(${left},0)`);
    }

    _addSelectorButton(num, tx) {
        tx += this._buttonSpacing;
        const s = num.toString();
        const b = this._getBBox(s);
        this._selectorCell.append(() =>
            this._addButton(s, "selBtn", true, b.width, b.height, tx, num === this._recordsPerPage)
                .attr("num", num)
                .on("click", e => this._clickSelectorNumber(e))
                .node()
        );
        return b.width + this._buttonPadding + this._buttonSpacing;
    }

    _addPageButton(pageNum, tx) {
        tx += this._buttonSpacing;
        const s = pageNum.toString();
        const b = this._getBBox(s);
        this._paginatorCell.append(() =>
            this._addButton(s, "pageBtn", true, b.width, b.height, tx, pageNum === this._currentPage)
                .attr("pageNum", pageNum)
                .on("click", e => this._clickPageNumber(e))
                .node()
        );
        return b.width + this._buttonPadding + this._buttonSpacing;
    }

    _addSeperator(tx) {
        tx += this._buttonSpacing;
        const s = "...";
        const b = this._getBBox(s);
        this._paginatorCell.append(() => this._addButton(s, "seperator", false, b.width, b.height, tx).node());
        return b.width + this._buttonPadding + this._buttonSpacing;
    }

    _addButton(caption, className, rect, w, h, tx, selected) {
        const rw = w + this._buttonPadding,
            rh = h + this._buttonPadding / 2;

        return d3.create("svg:g")
            .attr("class", className)
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${tx},0)`)
            .call(g => {
                if (rect)
                    g.append("rect")
                        .attr("rx", 4).attr("ry", 4)
                        .attr("width", rw).attr("height", rh)
                        .attr("opacity", selected ? 1 : 0)
                        .attr("fill", this._options.buttonColor)
            })
            .call(g => g.append("text")
                .attr("transform", `translate(${rw / 2},${rh / 2 + h / 4})`)
                .text(caption));
    }

    _getBBox(str) {
        const svg = this._table.svg;
        if (!svg) return { width: 0, height: 0 };
        else {
            var t;
            try {
                t = svg.append("text").text(str);
                return t.node().getBBox();
            }
            finally {
                t.remove();
            }
        }
    }

    _gotoPage(pnum) {
        if (pnum < 1)
            pnum = 1;
        else if (pnum > this._totalPages)
            pnum = this._totalPages;

        if (pnum <= this._totalPages) {
            if (pnum >= 1 && pnum <= 4) {
                this._currFloor = 1;
                if (this._totalPages <= 5)
                    this._currCeiling = this._totalPages;
                else
                    this._currCeiling = 5;
            }
            else if (pnum >= this._totalPages - 4 && pnum <= this._totalPages) {
                this._currFloor = this._totalPages - 4;
                this._currCeiling = this._totalPages;
            }
            else {
                this._currFloor = pnum - 2;
                this._currCeiling = pnum + 1;
            }
        }
        this._currentPage = pnum;
        return this._currentPage;
    }

    _clickPageNumber(e) {
        var btn = e.currentTarget;
        var pnum = +btn.attributes["pageNum"].value;

        this._currentPage = pnum;
        if (pnum == this._currCeiling && pnum != this._totalPages) {
            this._currCeiling++;
            if (this._currCeiling + 2 >= this._totalPages) {
                this._currCeiling = this._totalPages;
                this._currFloor = this._totalPages - 4;
            }
            else
                this._currFloor = this._currCeiling - 3;
            this._renderPaginator();
        }
        else if (pnum == this._currFloor) {
            this._currFloor--;
            if (this._currFloor < 3)
                this._resetBoundary();
            else
                this._currCeiling = this._currFloor + 3;
            this._renderPaginator();
        }
        else if (pnum == 1) {
            this._resetBoundary();
            this._renderPaginator();
        }
        else if (pnum == this._totalPages && this._totalPages > 5) {
            this._currCeiling = this._totalPages;
            this._currFloor = this._totalPages - 4;
            this._renderPaginator();
        }
        else {
            this._paginatorCell
                .selectAll("rect")
                .nodes().forEach(node => {
                    const num = +node.parentElement.attributes["pageNum"].value;
                    node.setAttribute("opacity", num === this._currentPage ? 1 : 0);
                });
        }

        if (this._onPageNumberChange) {
            var r = this._getRange(pnum);
            this._onPageNumberChange(pnum, r.begin, r.end);
        }
    }

    _clickSelectorNumber(e) {
        var btn = e.currentTarget;
        var num = +btn.attributes["num"].value;

        this.recordsPerPage(num);
        this._selectorCell
            .selectAll("rect")
            .nodes().forEach(node => {
                const n = +node.parentElement.attributes["num"].value;
                node.setAttribute("opacity", num === n ? 1 : 0);
            });

        this._gotoPage(this._currentPage);

        this._renderPaginator();

        if (this._onRecordsPerPageChange) {
            var r = this._getRange(this._currentPage);
            this._onRecordsPerPageChange(this._recordsPerPage, this._currentPage, r.begin, r.end);
        }
    }

    _getRange(pnum) {
        var begin = (pnum - 1) * this._recordsPerPage;
        var end = begin + this._recordsPerPage - 1;
        return { begin: begin, end: end };
    }

    _validateCurrentPage() {
        if (this._currentPage > this._totalPages) {
            this._currentPage = this._totalPages;
            this._currCeiling = this._totalPages;
            this._currFloor = this._totalPages - 4;
        }
    }

    _resetBoundary() {
        this._currFloor = 1;
        this._currCeiling = this._totalPages <= 5 ? this._totalPages : 5;
    }
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Appendix`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Miniature Charts`
)});
  main.variable(observer("miniMap")).define("miniMap", ["d3","grid","seq","options","up"], function(d3,grid,seq,options,up){return(
(svg, x, y, width, height) => {
  const cols = d3.max(grid.map(d => d.col)) + 1,
        rows = d3.max(grid.map(d => d.row)) + 1;  
  
  const sx = d3.scaleBand().domain(seq(cols)).range([0, width]),
        sy = d3.scaleBand().domain(seq(rows)).range([0, height]),
        sc = d3.scaleSequential(d3.interpolateBuPu);
  
  const bandwidth = ({ x: sx.bandwidth(), y: sy.bandwidth(), hx: sx.bandwidth() / 2, hy: sy.bandwidth() / 2 })
  const g = svg.append("g").attr("transform", `translate(${x},${y})`);
  const caption = g.append("text")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("transform", `translate(${width / 2},${height + 35})`);
  
  update();

  function update(context) {
    if (context) {
      const cdata = context.getColumn();
      sc.domain(d3.extent(cdata.slice(1)));
      cdata.forEach((d, i) => {
        const cell = grid.find(m => m.rowIndex === i);
        if (cell) cell.value = d;
      });
      const s = options.dataset === "sales" ? "Sales Profit" : options.field;      
      caption.text(`${context.column.name} ${up(s)}`);
    }
    
    g.selectAll("rect")
      .data(grid)
      .join("rect")
      //.transition()
      //.duration(250)
      .attr("fill", d => d.value ? sc(d.value) : "#ccc")
      .attr("x", d => sx(d.col)).attr("y", d => sy(d.row))
      .attr("width", bandwidth.y).attr("height", bandwidth.y)
      .call(g => g.select("title").remove())
      .append("title")
      .text(d => `${d.state}\n${d.value ? d3.format(",.2f")(d.value) : "--"}`);
  }

  return update;
}
)});
  main.variable(observer("miniChart")).define("miniChart", ["data","d3","options","up"], function(data,d3,options,up){return(
(svg, x, y, width, height) => {  
  const columns = data.columns.slice(1);  
  const sx = d3.scaleBand().domain(columns).range([0, width]);
  const sy = d3.scaleLinear()
    .domain(d3.extent(columns.map(c => data[0][c]))).nice()
    .range([height, 0]);  
  const bandwidth = { half: sx.bandwidth() / 2, qtr: sx.bandwidth() / 4 };
  
  const chart = svg.append("g").attr("transform", `translate(${x},${y})`);
  const caption = chart.append("text")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("transform", `translate(${width / 2},${height + 35})`);

  chart.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(sx));
  var axisY = chart.append("g").call(d3.axisLeft(sy).ticks(2, "s").tickValues(sy.domain()));
  
  update({co: {name: "Total"}, getRow: () => data[0]});
  
  function update(context) {
    axisY.remove();

    const rdata = context.getRow();
    const s = options.dataset === "sales" ? "Sales Profit" : options.field;      
    caption.text(`${rdata["state"]} ${up(s)}`);    
    const values = columns.map(c => rdata[c]);
    sy.domain(d3.extent(values)).nice();
    axisY = chart.append("g").call(d3.axisLeft(sy).ticks(2, "s").tickValues(sy.domain()));

    chart.selectAll("rect")
      .data(values)
      .join("rect")
      .attr("fill", "#a8dadc")
      .call(g => {
        g.select("title").remove();      
        g.append("title").text(d => d3.format(",d")(d));
      })
      .attr("x", (d, i) => sx(columns[i]) + bandwidth.qtr)
      .attr("y", d => sy(d))      
      .attr("width", bandwidth.half)
      .attr("height", d => height - sy(d));
  }
  
  return update;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Date Preparation`
)});
  main.variable(observer("data")).define("data", ["options","getStates","d3","FileAttachment"], async function(options,getStates,d3,FileAttachment)
{
  if (options.dataset === "covid") {
    const cdata = getStates(options.field);    
    const cml = cdata.find(d => d.state === "Northern Mariana Islands"); 
    if (cml) cml.state = "N. Mariana Isl."; // Shorten the name for display
    return cdata;
  }
  else 
    return d3.csvParse(await FileAttachment("profit@1.csv").text(), d3.autoType);
}
);
  main.variable(observer("states")).define("states", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("statecodes@1.csv").text())
)});
  main.variable(observer("grid")).define("grid", ["states","data"], function(states,data)
{
  const grid = [[11, 0, "ME"], [0, 1, "AK"], [6, 1, "WI"], [10, 1, "VT"], [11, 1, "NH"], [1, 2, "WA"], [2, 2, "ID"], [3, 2, "MT"], [4, 2, "ND"], [5, 2, "MN"], [6, 2, "IL"], [7, 2, "MI"], [9, 2, "NY"], [10, 2, "MA"], [1, 3, "OR"], [2, 3, "NV"], [3, 3, "WY"], [4, 3, "SD"], [5, 3, "IA"], [6, 3, "IN"], [7, 3, "OH"], [8, 3, "PA"], [9, 3, "NJ"], [10, 3, "CT"], [11, 3, "RI"], [1, 4, "CA"], [2, 4, "UT"], [3, 4, "CO"], [4, 4, "NE"], [5, 4, "MO"], [6, 4, "KY"], [7, 4, "WV"], [8, 4, "VA"], [9, 4, "MD"], [10, 4, "DE"], [2, 5, "AZ"], [3, 5, "NM"], [4, 5, "KS"], [5, 5, "AR"], [6, 5, "TN"], [7, 5, "NC"], [8, 5, "SC"], [9, 5, "DC"], [0, 6, "HI"], [4, 6, "OK"], [5, 6, "LA"], [6, 6, "MS"], [7, 6, "AL"], [8, 6, "GA"], [4, 7, "TX"], [9, 7, "FL"]].map(d => ({ col: d[0], row: d[1], code: d[2] }));
  
  grid.forEach(d => {
    const state = states.find(s => s.Code === d.code);
    if (state) {
      d.state = state.State;
      for(var i = 0; i < data.length; i++) {
        if (data[i]["state"] === d.state) {
          d.rowIndex = i;
          break;
        }
      }
    }
    else
      d.rowIndex = -1;
  });
  return grid;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### COVID-19 Dataset
The COVID-19 dataset is live data from NYT's Github repository. The getStates function retrieves the data from the repository then processes it into a monthly data table format. It comes in handy when you're doing visualizations based on monthly statistics.

#### getStates(field)
  * **field**: cases, deaths, newcases, newdeaths`
)});
  main.variable(observer("getStates")).define("getStates", ["covid"], function(covid){return(
field => {
  const data = covid.filter(d => d.lastDay);

  const m_month = Math.max.apply(null, data.map(d => d.month));
  const m_fips = Math.max.apply(null, data.map(d => d.fips));  

  const states = new Array(m_fips);
  for(let i = 0; i <= m_fips; i++) {
    const row = data.find(d => d.fips === i);
    if (row) states[i] = row.state;
  }
  
  const matrix = new Array(m_fips + 1).fill(null);  
  for(let i = 0; i <= m_fips; i++) {    
    matrix[i] = new Array(m_month + 1);
  }
  
  data.forEach(d => matrix[d.fips][d.month] = { 
    cases: d.cases, 
    deaths: d.deaths, 
    newcases: d.cases, 
    newdeaths: d.deaths 
  });
  
  const result = matrix.map((d, i) => {
    const row = new Object();
    row.state = states[i];
    for(let m = 0; m < d.length; m++) {    
      const mdata = d[m];
      if (mdata && m > 0) {        
        const prev = d[m - 1];
        if (prev) {
          mdata.newcases = mdata.cases - prev.cases;
          mdata.newdeaths = mdata.deaths - prev.deaths;
        }
      }      
      const ycode = 20 + Math.floor(m / 12);
      const mcode = m - Math.floor(m / 12) * 12 + 1;
      row[`${ycode}-${String(mcode).padStart(2, "0")}`] = mdata ? mdata[field] : 0;
    }
    return row;
  }).filter(d => d.state);  
  
  const total = {state: "Total"};
  result.columns = Object.keys(result[0]); 
  const months = result.columns.slice(1);
  
  for(let month of months) {
    let sum = 0;
    for(let row of result) sum += row[month];
    total[month] = sum;
  }  
  result.unshift(total)
  
  return result;  
}
)});
  main.variable(observer("covid")).define("covid", ["d3"], async function(d3)
{ 
  const data = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv", d => {
    const date = new Date(d.date.replaceAll("-", "/"));
    const y = date.getFullYear(), m = date.getMonth();
    const ldy = new Date(y, m + 1, 0);    
    return {
      date: date,
      lastDay: date.getTime() === ldy.getTime(),
      month: (y - 2020) * 12 + m,
      state: d.state,
      fips: +d.fips,
      cases: +d.cases,
      deaths: + d.deaths
    }
  });
  
  const last = data[data.length - 1].date.getTime();  
  for(let i = data.length - 1; i > 0; i--) {
      const row = data[i];
      if (row.date.getTime() === last)
        row.lastDay = true;
      else
        break;
  }
  
  return data;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### Miscellaneous...`
)});
  main.variable(observer()).define(["html"], function(html){return(
html`<style>
body, svg text {
  cursor: default;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
input[type="radio"], input[type="color"]
{
  vertical-align:baseline;
}
</style>`
)});
  main.variable(observer("seq")).define("seq", function(){return(
n => Array.apply(null, {length: n}).map((d, i) => i)
)});
  main.variable(observer("up")).define("up", function(){return(
s => s.charAt(0).toUpperCase() + s.slice(1)
)});
  main.variable(observer("resetGrid")).define("resetGrid", ["grid"], function(grid){return(
() => grid.forEach(d => d.value = null)
)});
  main.variable(observer("sample")).define("sample", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("sea19.csv").text(), d3.autoType)
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
