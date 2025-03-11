const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require('path');
const { SingleBar } = require('cli-progress');

const inputFileName = "20210817_linechart";  
const inputFilePath = `test_example/${inputFileName}.svg`;
const outputDirectory = "DEBUG";

// 确保输出目录存在 
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 监听 page 的 console 事件
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  const filePath = `file://${path.resolve(inputFilePath)}`;
  await page.goto(filePath);
  const data = await page.evaluate(() => {
    const svg = document.getElementsByTagName("svg")[0];
    // const elements = document.getElementsByTagName("rect");
    // const elements = document.getElementsByTagName("path");

    let svg_width = svg.getBoundingClientRect().width;
    let svg_height = svg.getBoundingClientRect().height;

    svg_width = Math.max(svg_width, svg_height);
    svg_height = Math.max(svg_width, svg_height);


    // function rgbToHsl(r, g, b) {
    //   r /= 255;
    //   g /= 255;
    //   b /= 255;

    //   const max = Math.max(r, g, b);
    //   const min = Math.min(r, g, b);
    //   let h, s, l = (max + min) / 2;

    //   if (max === min) {
    //     h = s = 0; // achromatic
    //   } else {
    //     const d = max - min;
    //     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    //     switch (max) {
    //       case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    //       case g: h = (b - r) / d + 2; break;
    //       case b: h = (r - g) / d + 4; break;
    //     }

    //     h /= 6;
    //   }

    //   return [Math.round(h * 20), Math.round(s * 20), Math.round(l * 20)];
    // }




    function rgbStringToHex(rgbString) {
      // 使用正则表达式提取RGB值
      const result = rgbString.match(/\d+/g);
      if (!result || result.length !== 3) {
        return 'None'
      }

      // 将提取的RGB值转换为整数
      const r = parseInt(result[0], 10);
      const g = parseInt(result[1], 10);
      const b = parseInt(result[2], 10);


      // hsl_20 = rgbToHsl(r, g, b);
      return '(' + r + ',' + g + ',' + b + ')';

      // return '(' + hsl_20[0] + ',' + hsl_20[1] + ',' + hsl_20[2] + ')';

      // 将颜色值转换为两位的十六进制字符串
      // const toHex = (c) => c.toString(16).padStart(2, '0');

      // // 组合为六位十六进制字符串
      // const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

      // return hex;
    }

    function isAxisAlignedRectangle(points) {
      let tolerance = 1
      if (points.length !== 4) return false;
  
      const [p1, p2, p3, p4] = points;
  
      // 定义一个辅助函数来检查两个值是否在容差范围内相等
      function isApproximatelyEqual(a, b, tolerance) {
          return Math.abs(a - b) <= tolerance;
      }
  
      // 检查第一条边是否水平
      const isHorizontal1 = isApproximatelyEqual(p1.y, p2.y, tolerance);
      // 检查第二条边是否垂直
      const isVertical1 = isApproximatelyEqual(p2.x, p3.x, tolerance);
      // 检查第三条边是否水平
      const isHorizontal2 = isApproximatelyEqual(p3.y, p4.y, tolerance);
      // 检查第四条边是否垂直
      const isVertical2 = isApproximatelyEqual(p4.x, p1.x, tolerance);
  
      return isHorizontal1 && isVertical1 && isHorizontal2 && isVertical2;
    }
  


    function isCirclePathData(d) {
      // 解析路径数据
      const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g).map(command => {
        const type = command[0];
        const args = command.slice(1).trim().split(/[\s,]+/).map(Number);
        return { type, args };
      });

      // 检查是否有3个命令：M, A, A
      if (commands.length !== 3) return false;

      // 检查路径命令是否为 M, A, A
      if (commands[0].type !== 'M' || commands[1].type !== 'A' || commands[2].type !== 'A') return false;

      // 检查两个 A 命令的参数是否符合圆的特征
      const [mx, my] = commands[0].args;
      const [rx1, ry1, xAxisRot1, largeArcFlag1, sweepFlag1, x1, y1] = commands[1].args;
      const [rx2, ry2, xAxisRot2, largeArcFlag2, sweepFlag2, x2, y2] = commands[2].args;

      // 检查两个 A 命令的半径、旋转角度、大弧标志和顺时针标志是否相同
      const arcsMatch = (rx1 === rx2) && (ry1 === ry2) && (xAxisRot1 === xAxisRot2) &&
        (largeArcFlag1 === largeArcFlag2) && (sweepFlag1 === sweepFlag2);

      // 检查第一个弧的终点是否是第二个弧的起点，且第二个弧的终点是否是初始点
      const circleFormed = (x1 === -mx) && (y1 === my) && (x2 === mx) && (y2 === my);

      return arcsMatch && circleFormed;
    }



    function parsePath(d, transform_matrix) {
      const commands = d.match(/[a-z][^a-z]*/gi);
      if (!commands) {
        // console.warn('No commands found in path:', d);
        return [];
      }

      let x = 0,
        y = 0;
      let startX = 0,
        startY = 0; // To handle 'Z' command
      const points = [];

      for (const command of commands) {
        const type = command[0];
        const args = command
          .slice(1)
          .trim()
          .split(/[\s,]+/)
          .map(Number);

        switch (type) {
          case "M":
            x = args[0];
            y = args[1];
            points.push({ x, y });
            startX = x;
            startY = y;
            break;
          case "m":
            x += args[0];
            y += args[1];
            points.push({ x, y });
            startX = x;
            startY = y;
            break;
          case "L":
            x = args[0];
            y = args[1];
            points.push({ x, y });
            break;
          case "l":
            x += args[0];
            y += args[1];
            points.push({ x, y });
            break;
          case "H":
            x = args[0];
            points.push({ x, y });
            break;
          case "h":
            x += args[0];
            points.push({ x, y });
            break;
          case "V":
            y = args[0];
            points.push({ x, y });
            break;
          case "v":
            y += args[0];
            points.push({ x, y });
            break;
          case "C":
            x = args[4];
            y = args[5];
            points.push({ x, y });
            break;
          case "c":
            x += args[4];
            y += args[5];
            points.push({ x, y });
            break;
          case "S":
            x = args[2];
            y = args[3];
            points.push({ x, y });
            break;
          case "s":
            x += args[2];
            y += args[3];
            points.push({ x, y });
            break;
          case "Q":
            x = args[2];
            y = args[3];
            points.push({ x, y });
            break;
          case "q":
            x += args[2];
            y += args[3];
            points.push({ x, y });
            break;
          case "T":
            x = args[0];
            y = args[1];
            points.push({ x, y });
            break;
          case "t":
            x += args[0];
            y += args[1];
            points.push({ x, y });
            break;
          case "A":
            x = args[5];
            y = args[6];
            points.push({ x, y });
            break;
          case "a":
            x += args[5];
            y += args[6];
            points.push({ x, y });
            break;
          case "Z":
          case "z":
            x = startX;
            y = startY;
            points.push({ x, y });
            break;
          default:
            console.warn("Unknown command:", type);
        }
      }
      let absolute_points = points.map(point => {
        const { x, y } = point;
        const newX = transform_matrix[0][0] * x + transform_matrix[0][1] * y + transform_matrix[0][2];
        const newY = transform_matrix[1][0] * x + transform_matrix[1][1] * y + transform_matrix[1][2];
        return { x: newX, y: newY };
      });

      return absolute_points;
    }

    

    function get_all_rects(current_svg) {
      let rects = current_svg.getElementsByTagName("rect");
      rects = [...rects].map((element) => {
        element.focus();
        computed_style = window.getComputedStyle(element);
        return {
          type: "rect",
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          fill: computed_style.fill,
          stroke: computed_style.stroke,
          stroke_width: computed_style.strokeWidth,
        };
      });
      let circles = current_svg.getElementsByTagName("circle");
      for (let i = 0; i < circles.length; i++) {
        const element = circles[i];
        element.focus();
        computed_style = window.getComputedStyle(element);
        rects.push({
          type: "circle",
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          fill: computed_style.fill,
          stroke: computed_style.stroke,
          stroke_width: computed_style.strokeWidth,
        });
      }
      texts = current_svg.getElementsByTagName("text");
      for (let i = 0; i < texts.length; i++) {
        const element = texts[i];
        if (window.getComputedStyle(element).display === "none" || window.getComputedStyle(element).opacity === '0') {
          continue;
        }
        element.focus();

        computed_style = window.getComputedStyle(element);

        // console.log("Text", element.textContent, computed_style.opacity);

        rects.push({
          type: "text",
          //这里处理了text,匹配时候要注意
          content: element.textContent.replaceAll(' ', '_').replaceAll('\u2212', '-').replaceAll(',', ''),
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          fill: computed_style.fill,
          stroke: computed_style.stroke,
        });
      }
      paths = current_svg.getElementsByTagName("path");
      for (let i = 0; i < paths.length; i++) {
        const element = paths[i];
        element.focus();
        computed_style = window.getComputedStyle(element);

        if (computed_style.fill === "none" && computed_style.stroke === "none") {
          continue;
        }

        const ctm = element.getCTM();

        // 输出变换矩阵
        // console.log('Transform Matrix:', transformMatrix);

        // 将矩阵转换为 2D 数组形式
        const matrixArray = [
          [ctm.a, ctm.c, ctm.e],
          [ctm.b, ctm.d, ctm.f],
          [0, 0, 1]
        ];

        if (element.getAttribute("d") === null) {
          continue
        }

        if (isCirclePathData(element.getAttribute("d"))) {
          print('this is a circle', element.getAttribute("d"))
          rects.push({
            type: "circle",
            x: element.getBoundingClientRect().x,
            y: element.getBoundingClientRect().y,
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            fill: computed_style.fill,
            stroke: computed_style.stroke,
            stroke_width: computed_style.strokeWidth,
          });
          continue
        }


        let points = parsePath(element.getAttribute("d"), matrixArray)


        if (points.length === 0) {
          continue
        }



        let path_type = "line"
        if (points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y && computed_style.fill !== 'none') {
          points.pop();
          path_type = 'area'
        }


        if (isAxisAlignedRectangle(points)){
          rects.push({
            type: "rect",
            x: element.getBoundingClientRect().x,
            y: element.getBoundingClientRect().y,
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            fill: computed_style.fill,
            stroke: computed_style.stroke,
            stroke_width: computed_style.strokeWidth,
          })
          continue
        }


        rects.push({
          type: path_type,
          d: element.getAttribute("d"),
          points: points,
          x: element.getBoundingClientRect().x,
          y: element.getBoundingClientRect().y,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          fill: computed_style.fill,
          stroke: computed_style.stroke,
          stroke_width: computed_style.strokeWidth,
        });
      }

      return rects;
    }


    const rects = get_all_rects(svg);

    const granularity = 500;

    rects.forEach((rect) => {
      // rect.uniform_x = parseInt((rect.x * granularity) / svg_width);
      rect.uniform_x = parseInt((rect.x + rect.width / 2) * granularity / svg_width); // 顶部中点的 x 坐标
      rect.uniform_y = parseInt((rect.y * granularity) / svg_height);
      rect.uniform_width = parseInt((rect.width * granularity) / svg_width);
      rect.uniform_height = parseInt((rect.height * granularity) / svg_height);
      rect.fill_hex = rgbStringToHex(rect.fill)
      rect.stroke_hex = rgbStringToHex(rect.stroke)
      if (rect.hasOwnProperty("points")) {
        rect.uniform_points = rect.points.map((point) => {
          return {
            x: Math.round((point.x * granularity) / svg_width),
            y: Math.round((point.y * granularity) / svg_height),
          };
        })
      }
    });

    let filtered_rects = rects.filter(
      (rect) => !(rect.type === "path" && rect.points.length == 0) && !(rect.width == 0 && rect.height == 0)
    )

    filtered_rects.forEach((rect) => {
      let point_string = `[${rect.uniform_x},${rect.uniform_y},${rect.uniform_width},${rect.uniform_height}]`
      if (rect.hasOwnProperty('uniform_points')) {
        point_string = rect.uniform_points.map((point) => `${point.x},${point.y}`).join(';')
        rect.point_string = point_string
      }


      if (rect.type === 'text') {
        // 对 text 类型计算中心点并保留小数
        const center_x = (rect.uniform_x + rect.uniform_width / 2).toFixed(1);
        const center_y = (rect.uniform_y + rect.uniform_height / 2).toFixed(1);
        point_string = `[${center_x},${center_y},${rect.uniform_width},${rect.uniform_height}]`;
        rect.sim_description = `${rect.type} ${rect.content}`;
      }
      else if (rect.type === 'line') {
        rect.sim_description = `${rect.type} ${rect.stroke_hex}`
      }
      else {
        rect.sim_description = `${rect.type} ${rect.fill_hex}`
      }

      rect.sim_description += ` ${point_string}`;

      //  ${rect.type === 'text' ? rect.content + ' ' : ''}${rect.type === 'line'?rect.stroke_hex: rect.fill_hex} ${point_string}`;
    });

    filtered_rects.sort(function (a, b) {
      let type_list = ['rect', 'circle', 'path', 'line', 'text', 'area'];
      if (a.type !== b.type) {
        return type_list.indexOf(a.type) < type_list.indexOf(b.type)
      }
      if (a.type === 'text'){
        return 0;
      }
      if (a.x < b.x) {
        return -1;
      } else if (a.x > b.x) {
        return 1;
      } else {
        if (a.y < b.y) {
          return -1;
        } else if (a.y > b.y) {
          return 1;
        } else {
          return 0;
        }
      }
    });


    svg_data = {
      x: svg.getBoundingClientRect().x,
      y: svg.getBoundingClientRect().y,
      width: svg.getBoundingClientRect().width,
      height: svg.getBoundingClientRect().height,
      element_len: filtered_rects.length,
      sim_vector: filtered_rects.map((rect) => rect.sim_description).join('|'),
      rects: filtered_rects,
    };

    return svg_data;
  });

  // console.log(data);
  fs.writeFileSync(
    `${outputDirectory}/1_debug_all_js_parse.json`,
    JSON.stringify(data, null, 2)
  );
  
  // 处理 sim_vector 并保存为 TXT 文件
  const simVectorContent = (data.sim_vector || "").replace(/\|/g, "\n");
  
  fs.writeFileSync(
    `${outputDirectory}/1_debug_simvec.txt`,
    simVectorContent
  );

  await browser.close();
})();

// console.log(parsePath("M10 10 L20 20 L30 10 Z"));
// console.log(parsePath("M0,0h44.896484375v11h-44.896484375Z"));
