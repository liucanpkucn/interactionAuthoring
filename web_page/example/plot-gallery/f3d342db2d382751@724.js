// https://observablehq.com/@observablehq/plot@724
import define1 from "./a33468b95d0b15b0@703.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["athletes.csv",new URL("./files/31ca24545a0603dce099d10ee89ee5ae72d29fa55e8fc7c9ffb5ded87ac83060d80f1d9e21f4ae8eb04c1e8940b7287d179fe8060d887fb1f055f430e210007c",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# Observable Plot

[Observable Plot](https://github.com/observablehq/plot) is a free, open-source JavaScript library to help you quickly visualize tabular data. It has a concise and (hopefully) memorable API to foster fluency — and plenty of examples to learn from and copy-paste.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`In the spirit of *show don’t tell*, below is a scatterplot of the height and weight of Olympic athletes (sourced from [Matt Riggott](https://flother.is/2017/olympic-games-data/)), constructed using a [dot mark](/@observablehq/plot-dot). We assign columns of data (such as *weight*) to visual properties (such as the dot’s *x*), and Plot infers the rest. You can configure much more, if needed, but Plot’s goal is to help you get a meaningful visualization quickly.`
)});
  main.variable(observer("athletes")).define("athletes", ["FileAttachment"], function(FileAttachment){return(
FileAttachment("athletes.csv").csv({typed: true})
)});
  main.variable(observer()).define(["Swatches","d3","athletes"], function(Swatches,d3,athletes){return(
Swatches({color: d3.scaleOrdinal(athletes.map(d => d.sex).sort(), d3.schemeTableau10)})
)});
  main.variable(observer()).define(["Plot","athletes"], function(Plot,athletes){return(
Plot.dot(athletes, {x: "weight", y: "height", stroke: "sex"}).plot()
)});
  main.variable(observer()).define(["Inputs","athletes"], function(Inputs,athletes){return(
Inputs.table(athletes)
)});
  main.variable(observer()).define(["md"], function(md){return(
md`This scatterplot suffers from overplotting: many dots are drawn in the same spot, so it’s hard to perceive density. We can fix this by [binning](/@observablehq/plot-bin) athletes of similar height and weight (and sex), then using opacity to encode the number of athletes in the bin.`
)});
  main.variable(observer()).define(["Plot","athletes"], function(Plot,athletes){return(
Plot.rect(athletes, Plot.bin({fillOpacity: "count"}, {x: "weight", y: "height", fill: "sex"})).plot()
)});
  main.variable(observer()).define(["md"], function(md){return(
md`A simpler take on this data is to focus on one dimension: weight. We can use the bin transform again to make a histogram with weight on the *x*-axis and frequency on the *y*-axis. This plot uses a [rect mark](/@observablehq/plot-rect) and an implicit [stack transform](/@observablehq/plot-stack).`
)});
  main.variable(observer()).define(["Plot","athletes"], function(Plot,athletes){return(
Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight", fill: "sex"})).plot()
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Or if we’d prefer to show the two distributions separately as small multiples, we can [facet](/@observablehq/plot-facets) the data along *y* (keeping the *fill* encoding for consistency, and adding grid lines and a rule at *y* = 0 to improve readability).`
)});
  main.variable(observer()).define(["Plot","athletes"], function(Plot,athletes){return(
Plot.plot({
  grid: true,
  facet: {
    data: athletes,
    y: "sex"
  },
  marks: [
    Plot.rectY(athletes, Plot.binX({y: "count"}, {x: "weight", fill: "sex"})),
    Plot.ruleY([0])
  ]
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Plot employs a layered grammar of graphics inspired by [Vega-Lite](https://vega.github.io/vega-lite/), [ggplot2](https://vita.had.co.nz/papers/layered-grammar.html), Wilkinson’s *Grammar of Graphics*, and Bertin’s *Semiology of Graphics*. Plot rejects a chart typology in favor of [marks](/@observablehq/plot-marks), [scales](/@observablehq/plot-scales), and [transforms](/@observablehq/plot-transforms). Plot can be readily extended in JavaScript, whether to define a channel, a transform, or even a custom mark. And Plot is compatible with [Observable dataflow](/@observablehq/how-observable-runs): use [inputs](/@observablehq/inputs) to control charts, and [views](/@observablehq/introduction-to-views) to read chart selections. (This last part is coming soon!)`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`We created Plot to better support exploratory data analysis in reactive, JavaScript notebooks like Observable. We continue to support D3 for bespoke explanatory visualization and recommend Vega-Lite for imperative, polyglot environments such as Jupyter. Plot lets you see your ideas quickly, supports interaction with minimal fuss, is flexible with respect to data, and can be readily extended by the community. We believe people will be more successful finding and sharing insight if there’s less wrestling with the intricacies of programming and more “using vision to think.”

To learn more, start with [Plot: Marks](/@observablehq/plot-marks) or dive into the docs below.`
)});
  main.variable(observer("concepts")).define("concepts", ["md"], function(md){return(
md`---

## Concepts

These core concepts provide Plot’s foundation.`
)});
  main.variable(observer()).define(["html","previews"], function(html,previews){return(
html`${previews([
{
  path: "@observablehq/plot-marks",
  thumbnail: "a225b31a256dbe429a549aa477780e3dcadf2960f6e425374c84b59d56ee3c5f",
  title: "Marks"
},
{
  path: "@observablehq/plot-scales",
  thumbnail: "5fedc92d34ff5a96246df8aabea36a88501cca181786f49d23ff7fe6f8697dd0",
  title: "Scales"
},
{
  path: "@observablehq/plot-transforms",
  thumbnail: "b7e98ea9069d9e6c344471f717303a3de3c1065fd8cf5a34b4fff129730fc8ea",
  title: "Transforms"
},
{
  path: "@observablehq/plot-facets",
  thumbnail: "c5f86a11103f38178e732c50b80c9532fdffeed1051a72c7911e923769235d09",
  title: "Facets"
}
], {target: null})}`
)});
  main.variable(observer("marks")).define("marks", ["md"], function(md){return(
md`---

## Marks

Plot provides built-in graphical marks for common charts.`
)});
  main.variable(observer()).define(["html","previews"], function(html,previews){return(
html`${previews([
{
  path: "@observablehq/plot-area",
  thumbnail: "7568656358844aa6133c452bfe89b41631deccb0777a00026b23b63902b4bfa0",
  title: "Area"
},
{
  path: "@observablehq/plot-bar",
  thumbnail: "82b842794e8a7fa84a3b8719395a07339f5dbaf3c73c2c93db15a1ac616a58c4",
  title: "Bar"
},
{
  path: "@observablehq/plot-cell",
  thumbnail: "170617989e598757192a6bf3e5e5ecf2aa34491262c9bcd7065019df0874afd5",
  title: "Cell"
},
{
  path: "@observablehq/plot-dot",
  thumbnail: "fedfff542e32745c89f0f10868c4749afaa07de5a17ab4e47bdd0c2100def417",
  title: "Dot"
},
{
  path: "@observablehq/plot-line",
  thumbnail: "6cc7053a43b2d62b13c323cc34770a41fd3dc673c30f8c74ccb6bf46cd1ddec7",
  title: "Line"
},
{
  path: "@observablehq/plot-link",
  thumbnail: "54531f9a7c32ac9bd455dd3603fec88633ca0c35ed1d360fe1ff416579addec4",
  title: "Link"
},
{
  path: "@observablehq/plot-rect",
  thumbnail: "e932cd8dd44a34192409196103c85b3b2c3cb59f2c0bbfa0067caf11e0e9a268",
  title: "Rect"
},
{
  path: "@observablehq/plot-rule",
  thumbnail: "2388d2007fcfd56073e002154526d81cf23d9302f68db10605173b6f65bb8660",
  title: "Rule"
},
{
  path: "@observablehq/plot-text",
  thumbnail: "9111208b1a12c70d76e42bc9e7f2cab9e595e2de62414faa893a8028ca54e8ed",
  title: "Text"
},
{
  path: "@observablehq/plot-tick",
  thumbnail: "44553166c4f5cb9747359daf3dd6278b17856f83e83505688230a5fd6340a8cb",
  title: "Tick"
},
{
  path: "@observablehq/plot-frame",
  thumbnail: "c5f86a11103f38178e732c50b80c9532fdffeed1051a72c7911e923769235d09",
  title: "Frame"
}
], {target: null})}`
)});
  main.variable(observer("transforms")).define("transforms", ["md"], function(md){return(
md`---

## Transforms

Plot provides built-in transforms for deriving data.`
)});
  main.variable(observer()).define(["html","previews"], function(html,previews){return(
html`${previews([
{
  path: "@observablehq/plot-group",
  thumbnail: "2870d3b254a161d529654e15e95fda292d161384dee7cf17438963db66f566e6",
  title: "Group"
},
{
  path: "@observablehq/plot-bin",
  thumbnail: "b4514409de9a53a75b6a14511846c3cc7eef37b65d635ff09174718efb08b66d",
  title: "Bin"
},
{
  path: "@observablehq/plot-stack",
  thumbnail: "079a9e7bc43ddbf6d8efce0668a16e9646805283beab72a5f2f2a5e26ed7f96e",
  title: "Stack"
},
{
  path: "@observablehq/plot-map",
  thumbnail: "dd8da2fdf912213f7c52ee93ce57b2bc882a86f2e9336a8f6628a16843f34b18",
  title: "Map"
},
{
  path: "@observablehq/plot-select",
  thumbnail: "d9cbe4ce81709d38fb41be502a7883af64bb10443d98250419d93a56f225afeb",
  title: "Select"
}
], {target: null})}`
)});
  main.variable(observer("more")).define("more", ["md"], function(md){return(
md`---
## And more!

Got the basics? Here are even more resources:

* [API Reference](https://github.com/observablehq/plot/blob/main/README.md)
* [Exploration: Penguins](/@observablehq/plot-exploration-penguins)
* [Exploration: Weather](/@observablehq/plot-exploration-weather)
* … and more coming soon!
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Observable Plot is released under the [ISC license](https://github.com/observablehq/plot/blob/main/LICENSE) and depends on [D3](https://d3js.org). It works great on Observable but does not depend on Observable; use it anywhere! To contribute to Plot’s development or to report an issue, please see [our repository](https://github.com/observablehq/plot). For recent changes, please see [our release notes](https://github.com/observablehq/plot/releases).`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---

## Appendix`
)});
  main.variable(observer("previews")).define("previews", ["htl","preview"], function(htl,preview){return(
function previews(notebooks, options) {
  return htl.html`<div style="display: grid; grid-gap: .875rem; grid-template-columns: repeat(auto-fill, minmax(160px, 5fr));">${notebooks.map(notebook => preview(notebook, options))}</div>`;
}
)});
  main.variable(observer("preview")).define("preview", ["htl"], function(htl){return(
function preview({path, title, author, thumbnail}, {target = "_blank"} = {}) {
  return htl.html`<a href=${`/${path}`} target=${target} title="${title}${author ? `by ${author}`: ""}" style="display: inline-flex; flex-direction: column; align-items: start; font: 400 .75rem var(--sans-serif); color: #1b1e23; width: 100%;" onmouseover=${event => event.currentTarget.firstElementChild.style.borderColor = "#1b1e23"} onmouseout=${event => event.currentTarget.firstElementChild.style.borderColor = "#e8e8e8"}>
  <div style="border: solid 1px #e8e8e8; border-radius: 4px; box-sizing: border-box; width: 100%; padding-top: 62.5%; background-size: cover; background-image: url(https://static.observableusercontent.com/thumbnail/${encodeURI(thumbnail)}.jpg);"></div>
  <div style="width: 100%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${title}</div>
</a>`;
}
)});
  const child1 = runtime.module(define1);
  main.import("swatches", "Swatches", child1);
  return main;
}
