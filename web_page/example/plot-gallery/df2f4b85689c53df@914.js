// https://observablehq.com/@analyzer2004/covid-utilities@914
import define1 from "./363f88951485f09d@1787.js";
import define2 from "./a2166040e5fb39a6@229.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["state_fips@2.csv",new URL("./files/26edb36af0fde039070b2cdaf9a865171e244f093ab0697c0f55b88c81cdc1ed53576b24a3e6c4813d58d732eec847c031838bef446909ac33691ab14035bb9a",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md","firstDay"], function(md,firstDay){return(
md`# COVID Utilities

Miscellaneous utilities for processing COVID-19 data.

## getStates(field)
Aggregate and convert NTY's COVID-19 us_states.csv into monthly data table foramts.
- \`field\` - field name: cases, deaths, newcases, newdeath

## getStatesLastNDays(field, days, total, code)
Aggregate and convert NTY's COVID-19 us_states.csv into daily (last N days) data table foramts.
- \`field\` - field name: cases, deaths, newcases, newdeath
- \`days\` - last N days
- \`total\` - aggregates daily numbers into the total row and adds the row at the beginning of the dataset
- \`code\` - adds a state code column to the dataset

## getStatesNumber(field, date)
- \`field\` - field name: cases, deaths
- \`date\` - it can be a specific date (**Date**) or a **number** which represents day n from the first day - ${firstDay}
`
)});
  main.variable(observer("viewof field")).define("viewof field", ["html"], function(html){return(
html`<select>
<option value="cases">cases</option>
<option value="deaths">deaths</option>
<option value="newcases">newcases</option>
<option value="newdeaths">newdeaths</option>
</select>`
)});
  main.variable(observer("field")).define("field", ["Generators", "viewof field"], (G, _) => G.input(_));
  main.variable(observer()).define(["d3","width","SVGTable","getStates","field"], function*(d3,width,SVGTable,getStates,field)
{
  const svg = d3.create("svg")
    .attr("font-size", "11pt")
    .attr("viewBox", [0, 0, width, 260]);
  
  yield svg.node();
  
  new SVGTable(svg)
    .size([width, 250])
    .fixedRows(1)
    .fixedColumns(1)
    .rowsPerPage(25)    
    .defaultNumberFormat(",.0d")
    .style({ border: false })
    .data(getStates(field))      
    .render();    
}
);
  main.variable(observer()).define(["d3","width","SVGTable","getStatesLastNDays","field"], function*(d3,width,SVGTable,getStatesLastNDays,field)
{
  const svg = d3.create("svg")
    .attr("font-size", "11pt")
    .attr("viewBox", [0, 0, width, 260]);
  
  yield svg.node();
  
  new SVGTable(svg)
    .size([width, 250])
    .fixedRows(1)
    .fixedColumns(2)
    .rowsPerPage(25)    
    .defaultNumberFormat(",.0d")
    .style({ border: false })
    .data(getStatesLastNDays(field, 7, true, true))      
    .render();    
}
);
  main.variable(observer("getStates")).define("getStates", ["src"], function(src){return(
field => {  
  const data = src.filter(d => d.lastDay);

  const m_month = Math.max.apply(null, data.map(d => d.month));
  const m_fips = Math.max.apply(null, data.map(d => d.fips));  

  // Map state by fips
  const states = new Array(m_fips);
  for(let i = 0; i <= m_fips; i++) {
    const row = data.find(d => d.fips === i);
    if (row) states[i] = row.state;
  }
  
  // Generate a m_fips * m_month matrix
  const matrix = new Array(m_fips + 1).fill(null);  
  for(let i = 0; i <= m_fips; i++) {    
    matrix[i] = new Array(m_month + 1);
  }
  
  // Fill matrix with object, newcases and newdeaths are zeros for now, will be calcualted in the next step 
  data.forEach(d => matrix[d.fips][d.month] = { 
    cases: d.cases, 
    deaths: d.deaths, 
    newcases: d.cases, 
    newdeaths: d.deaths 
  });
  
  const result = matrix.map((d, i) => {
    const row = new Object();
    row.state = states[i];
    // Process data by month
    for(let m = 0; m < d.length; m++) {    
      const mdata = d[m];
      if (mdata && m > 0) {        
        const prev = d[m - 1];
        // Calculate newcases and newdeaths
        if (prev) {
          mdata.newcases = mdata.cases - prev.cases;
          mdata.newdeaths = mdata.deaths - prev.deaths;
        }
      }      
      // yy-mm format
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
  main.variable(observer("getStatesLastNDays")).define("getStatesLastNDays", ["src","today","map"], function(src,today,map){return(
(field, days, total, code) => {
  const data = src.filter(d => d.dayDiff <= days + 1);
  
  const m_fips = Math.max.apply(null, data.map(d => d.fips));  

  // Map state by fips
  const states = new Array(m_fips);
  for(let i = 0; i <= m_fips; i++) {
    const row = data.find(d => d.fips === i);
    if (row) states[i] = row.state;
  }
  
  // Generate a m_fips * days matrix
  const matrix = new Array(m_fips + 1).fill(null);  
  for(let i = 0; i <= m_fips; i++) {    
    matrix[i] = new Array(days + 1);
  }
  
  // Fill matrix with object, newcases and newdeaths will be calcualted in the next step 
  data.forEach(d => matrix[d.fips][d.dayDiff - 1] = { 
    cases: d.cases, 
    deaths: d.deaths, 
    newcases: d.cases, 
    newdeaths: d.deaths 
  });
  
  // Pregenerate date strings for each day
  const td = today(), dates = [];
  for (let i = 1;i <= days; i++) {    
    td.setDate(td.getDate() - 1);
    dates.push(`${td.getFullYear()}/${td.getMonth() + 1}/${td.getDate()}`);
  }
  
  const result = matrix.map((d, i) => {
    const row = new Object();
    row.state = states[i];
    if (code) {
      const c = map.get(row.state);
      row.code = c !== undefined ? c : "";
    }
    // Process data by day
    for(let dy = 0; dy < d.length - 1; dy++) {    
      const dydata = d[dy];
      if (dydata) {        
        const prev = d[dy + 1];
        // Calculate newcases and newdeaths
        if (prev) {
          dydata.newcases = dydata.cases - prev.cases;
          dydata.newdeaths = dydata.deaths - prev.deaths;
        }
      }      
      row[dates[dy]] = dydata ? dydata[field] : 0;
    }
    return row;
  }).filter(d => d.state);  
  
  result.columns = Object.keys(result[0]);  
 
  if (total) {
    const total = {state: "Total", code: ""};
    result.columns = Object.keys(result[0]); 
    const ds = result.columns.slice(code ? 2 : 1);

    for(let day of ds) {
      let sum = 0;
      for(let row of result) sum += row[day];
      total[day] = sum;
    }  
    result.unshift(total)
  }
  
  return result;  
}
)});
  main.variable(observer("getStatesNumber")).define("getStatesNumber", ["days","map","src"], function(days,map,src){return(
(field, date) => {
  const td = days, mapper = map;
  
  var data;  
  if (typeof date === "number") 
    data = src.filter(d => td - d.dayDiff === date);
  else
    data = src.filter(d => d.date.getTime() === date.getTime());
  
  return data.map(d => ({
    state: d.state,
    code: mapper.get(d.state),
    number: d[field]
  }));
}
)});
  main.variable(observer("getYesterdayNumbers")).define("getYesterdayNumbers", ["getStatesLastNDays"], function(getStatesLastNDays){return(
(field, sorted) => {
  const 
    states = getStatesLastNDays("newcases", 1, false, true),
    date = Object.keys(states[0])[2];
  
  const a = states.map(d => ({
    state: d.state,
    code: d.code,
    number: d[date]
  }));
  
  return sorted ? a.sort((a, b) => b.number - a.number) : a;
}
)});
  main.variable(observer()).define(["getYesterdayNumbers"], function(getYesterdayNumbers){return(
getYesterdayNumbers("newcases", true)
)});
  main.variable(observer("days")).define("days", ["src","ms"], function(src,ms)
{
  const first = src[0].date;
  const last = src[src.length - 1].date;
  return Math.floor((last - first) / ms.day) + 1;
}
);
  main.variable(observer("firstDay")).define("firstDay", ["src"], function(src){return(
src[0].date
)});
  main.variable(observer("dates")).define("dates", ["src"], function(src)
{
  const dates = [];
  new Set(src.map(d => d.date.getTime()))
    .forEach(d => dates.push(new Date(d)));
  return dates;
}
);
  main.variable(observer("src")).define("src", ["today","nytdata","d3","ms"], function(today,nytdata,d3,ms)
{   
  const td = today();
  //const data = await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv", d => {  
  const data = nytdata.map(d => {
    const date = d3.timeParse('%Y-%m-%d')(d.date);
    const y = date.getFullYear(), m = date.getMonth();
    const ldy = new Date(y, m + 1, 0);    
    return {
      date: date,
      dayDiff: Math.floor((td - date) / ms.day), // diff from today
      lastDay: date.getTime() === ldy.getTime(), // last day of the month
      month: (y - 2020) * 12 + m,
      state: d.state,
      fips: +d.fips,
      cases: +d.cases,
      deaths: +d.deaths
    }
  });
  
  // last day of dataset
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
  main.variable(observer()).define(["nytdata"], function(nytdata){return(
nytdata.filter(d => {
  return (d.date === "2020-09-06" || d.date === "2020-09-05") && d.state === "Guam";
})
)});
  main.variable(observer("nytdata")).define("nytdata", ["d3"], async function(d3){return(
await d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")
)});
  main.variable(observer("map")).define("map", ["d3","FileAttachment"], async function(d3,FileAttachment){return(
new Map(d3.csvParse(await FileAttachment("state_fips@2.csv").text(), d3.autoType).map(d => [d.stname, d.stusps]))
)});
  main.variable(observer("today")).define("today", function(){return(
() => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
)});
  main.variable(observer("yesterday")).define("yesterday", ["today"], function(today)
{
  const yd = today();
  return new Date(yd.setDate(yd.getDate() - 1));
}
);
  main.variable(observer("ms")).define("ms", function(){return(
{
  day: 24 * 3600 * 1000,
  week: 7 * 24 * 3600 * 1000  
}
)});
  const child1 = runtime.module(define1);
  main.import("SVGTable", child1);
  const child2 = runtime.module(define2);
  main.import("printTable", child2);
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  main.variable(observer()).define(["md"], function(md){return(
md`🐱[GitHub Repositories](https://github.com/analyzer2004?tab=repositories) 🐦[Twitter](https://twitter.com/analyzer2004)`
)});
  return main;
}
