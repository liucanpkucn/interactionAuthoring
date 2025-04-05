const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { SingleBar } = require("cli-progress");

const inputFileName = "test";
const inputFilePath = `input_data/${inputFileName}.svg`;
const outputDirectory = "intermediate_data/raw_simvec";
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  const filePath = `file://${path.resolve(inputFilePath)}`;
  await page.goto(filePath);

  const data = await page.evaluate(() => {
    const svg = document.getElementsByTagName("svg")[0];

    function rgbStringToHex(rgbString) {
      const result = rgbString.match(/\d+/g);
      if (!result || result.length !== 3) {
        return "None";
      }
      const r = parseInt(result[0], 10);
      const g = parseInt(result[1], 10);
      const b = parseInt(result[2], 10);

      return `(${r},${g},${b})`;
    }

    function get_all_rects(current_svg) {
      let rects = [...current_svg.getElementsByTagName("rect")].map(
        (element) => {
          element.focus();
          const computed_style = window.getComputedStyle(element);
          return {
            type: "rect",
            x: Math.round(element.getBoundingClientRect().x),
            y: Math.round(element.getBoundingClientRect().y),
            width: Math.round(element.getBoundingClientRect().width),
            height: Math.round(element.getBoundingClientRect().height),
            fill: computed_style.fill,
            stroke: computed_style.stroke,
            stroke_width: computed_style.strokeWidth,
          };
        }
      );

      const circles = current_svg.getElementsByTagName("circle");
      for (let i = 0; i < circles.length; i++) {
        const element = circles[i];
        element.focus();
        const computed_style = window.getComputedStyle(element);
        rects.push({
          type: "circle",
          x: Math.round(element.getBoundingClientRect().x),
          y: Math.round(element.getBoundingClientRect().y),
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
          fill: computed_style.fill,
          stroke: computed_style.stroke,
          stroke_width: computed_style.strokeWidth,
        });
      }

      const texts = current_svg.getElementsByTagName("text");
      for (let i = 0; i < texts.length; i++) {
        const element = texts[i];
        if (
          window.getComputedStyle(element).display === "none" ||
          window.getComputedStyle(element).opacity === "0"
        ) {
          continue;
        }
        element.focus();

        const computed_style = window.getComputedStyle(element);

        rects.push({
          type: "text",
          content: element.textContent
            .replaceAll(" ", "_")
            .replaceAll("\u2212", "-")
            .replaceAll(",", ""),
          x: Math.round(element.getBoundingClientRect().x),
          y: Math.round(element.getBoundingClientRect().y),
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
          fill: computed_style.fill,
          stroke: computed_style.stroke,
        });
      }

      const paths = current_svg.getElementsByTagName("path");
      for (let i = 0; i < paths.length; i++) {
        const element = paths[i];
        element.focus();
        const computed_style = window.getComputedStyle(element);

        if (
          computed_style.fill === "none" &&
          computed_style.stroke === "none"
        ) {
          continue;
        }

        rects.push({
          type: "path",
          x: Math.round(element.getBoundingClientRect().x),
          y: Math.round(element.getBoundingClientRect().y),
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
          fill: computed_style.fill,
          stroke: computed_style.stroke,
          stroke_width: computed_style.strokeWidth,
        });
      }

      return rects;
    }

    const rects = get_all_rects(svg);

    rects.forEach((rect) => {
      rect.fill_hex = rgbStringToHex(rect.fill);
      rect.stroke_hex = rgbStringToHex(rect.stroke);
    });

    let filtered_rects = rects.filter(
      (rect) =>
        !(rect.type === "path" && rect.points && rect.points.length === 0) &&
        !(rect.width === 0 && rect.height === 0)
    );

    filtered_rects.forEach((rect) => {
      let point_string = `[${rect.x},${rect.y},${rect.width},${rect.height}]`;

      if (rect.hasOwnProperty("points")) {
        point_string = rect.points
          .map((point) => `${Math.round(point.x)},${Math.round(point.y)}`)
          .join(";");
        rect.point_string = point_string;
      }

      if (rect.type === "text") {
        rect.sim_description = `${rect.type} ${rect.content}`;
      } else if (rect.type === "line") {
        rect.sim_description = `${rect.type} ${rect.stroke_hex}`;
      } else {
        rect.sim_description = `${rect.type} ${rect.fill_hex}`;
      }

      rect.sim_description += ` ${point_string}`;
    });

    svg_data = {
      x: Math.round(svg.getBoundingClientRect().x),
      y: Math.round(svg.getBoundingClientRect().y),
      width: Math.round(svg.getBoundingClientRect().width),
      height: Math.round(svg.getBoundingClientRect().height),
      element_len: filtered_rects.length,
      sim_vector: filtered_rects.map((rect) => rect.sim_description).join("|"),
      rects: filtered_rects,
    };

    return svg_data;
  });

  // 存完整的
  fs.writeFileSync(`intermediate_data/full.json`, JSON.stringify(data, null, 2));

  // 存simvec
  const simVectorContent = (data.sim_vector || "").replace(/\|/g, "\n");
  fs.writeFileSync(`${outputDirectory}/test.txt`, simVectorContent);

  // line extraction（只保留水平和垂直）
  const lines_only = await page.evaluate(() => {
    const svg = document.getElementsByTagName("svg")[0];

    const lines = svg.getElementsByTagName("line");
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const el = lines[i];

      const pt1 = el.ownerSVGElement.createSVGPoint();
      pt1.x = el.x1.baseVal.value;
      pt1.y = el.y1.baseVal.value;

      const pt2 = el.ownerSVGElement.createSVGPoint();
      pt2.x = el.x2.baseVal.value;
      pt2.y = el.y2.baseVal.value;

      const m = el.getScreenCTM();
      const p1 = pt1.matrixTransform(m);
      const p2 = pt2.matrixTransform(m);

      if (
        Math.round(p1.x) === Math.round(p2.x) ||
        Math.round(p1.y) === Math.round(p2.y)
      ) {
        result.push({
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
        });
      }
    }

    return result;
  });

  const lineOutputDir = "intermediate_data/lines";
  if (!fs.existsSync(lineOutputDir)) {
    fs.mkdirSync(lineOutputDir, { recursive: true });
  }
  fs.writeFileSync(
    `${lineOutputDir}/line.json`,
    JSON.stringify(lines_only, null, 2)
  );
  // console.log(lines_only);
  await browser.close();
})();
