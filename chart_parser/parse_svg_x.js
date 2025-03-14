const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require('path');
const { SingleBar } = require('cli-progress');
const { console } = require("inspector");
const inputFileName = "20210831_bubble_stack_nyt";  
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








    //utils fuctions
    function rgbStringToRGB(rgbString) {

      // 检查是否为 undefined、null 或空字符串
      if (!rgbString || rgbString === "none" || rgbString === "transparent") {
          return [0, 0, 0];  // 默认返回黑色
      }
  
      const result = rgbString.match(/\d+/g);
      if (!result || result.length !== 3) {
          return [0, 0, 0];  // 如果不是标准 RGB 格式，仍返回黑色
      }
  
      return [parseInt(result[0], 10), parseInt(result[1], 10), parseInt(result[2], 10)];
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


    //解析path
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

    //主要修改入口
    function get_all_rects(current_svg) {

      //已经修改
      let rects = current_svg.getElementsByTagName("rect");
      rects = [...rects].map((element) => {
          element.focus();
          const computed_style = window.getComputedStyle(element);

          const bbox = element.getBoundingClientRect();

          const width = element.hasAttribute('real_width') 
              ? parseFloat(element.getAttribute('real_width')) 
              : bbox.width;

          const height = element.hasAttribute('real_height') 
              ? parseFloat(element.getAttribute('real_height')) 
              : bbox.height;

          const left = bbox.x;
          const right = bbox.x + width;
          const up = bbox.y;
          const down = bbox.y + height;

          const new_rect = element.cloneNode(true);
          const origin = new_rect.outerHTML;
          const original_soup = element.outerHTML;

          const fillColor = rgbStringToRGB(computed_style.fill);
          const opacity = parseFloat(computed_style.opacity) || 1.0;
          const fill_opacity = parseFloat(computed_style.fillOpacity) || 1.0;

          const value = element.hasAttribute('q0')
              ? parseFloat(element.getAttribute('q0')) 
              : 0.0;

          const ctm = element.getCTM();
          const transform_matrix = {
              a: ctm.a,
              b: ctm.b,
              c: ctm.c,
              d: ctm.d,
              e: ctm.e,
              f: ctm.f
          };

          return {
              type: "rect",
              origin: origin,
              original_soup: original_soup,
              width: width,
              height: height,
              left: left,
              right: right,
              value: value,
              fill: fillColor,
              fill_opacity: fill_opacity,
              stroke: computed_style.stroke || "none",
              stroke_width: computed_style.strokeWidth || "1px",
              opacity: opacity,
              x: left,
              y: up,
              up: up,
              down: down,
              text: "",
              transform_matrix: transform_matrix
          };
      });

      //已经修改
      let circles = current_svg.getElementsByTagName("circle");
      for (let i = 0; i < circles.length; i++) {
          const element = circles[i];
          element.focus();

          const computed_style = window.getComputedStyle(element);
          const radius = parseFloat(element.getAttribute("r") || "0");
          const bbox = element.getBoundingClientRect();

          const cx = bbox.x + bbox.width / 2;
          const cy = bbox.y + bbox.height / 2;

          const left = cx - radius;
          const right = cx + radius;
          const up = cy - radius;
          const down = cy + radius;

          rects.push({
              type: "circle",
              origin: element.outerHTML,         // 保留原始 HTML
              original_soup: element.outerHTML,  // 保留完整 HTML
              width: bbox.width,
              height: bbox.height,
              left: left,
              right: right,
              fill: rgbStringToRGB(computed_style.fill || "rgb(0, 0, 0)"),
              stroke: rgbStringToRGB(computed_style.stroke || "rgb(0, 0, 0)"),
              stroke_width: computed_style.strokeWidth || "1px",
              opacity: parseFloat(computed_style.opacity) || 1.0,
              fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
              x: cx,
              y: cy,
              up: up,
              down: down,
              r: radius
          });
      }

      //已经修改
      texts = current_svg.getElementsByTagName("text");
      for (let i = 0; i < texts.length; i++) {
          const element = texts[i];
          // console.log(element);
          // 忽略不可见元素
          if (window.getComputedStyle(element).display === "none" || window.getComputedStyle(element).opacity === '0') {
              continue;
          }
          const computed_style = window.getComputedStyle(element);
          
          //这里处理了text,匹配时候要注意
          const textContent = element.textContent.trim()
            .replaceAll(' ', '_')        // 空格替换为下划线
            .replaceAll('\u2212', '-')   // Unicode减号替换为普通减号
            .replaceAll(',', '');        // 删除逗号
           // 提取文字内容
          const fillColor = rgbStringToRGB(computed_style.fill); // 转换为 [r, g, b] 格式
          const bbox = element.getBoundingClientRect(); // 获取位置和尺寸信息
          const left = bbox.x;
          const right = bbox.x + bbox.width;
          const up = bbox.y;
          const down = bbox.y + bbox.height;

          rects.push({
              type: "text",

              //这里origin也使用的是原始svg,没有处理
              origin: element.outerHTML,            // 原始 HTML/SVG 标签
              original_soup: element.outerHTML,     // 完整原始代码块
              width: bbox.width,                    // 宽度
              height: bbox.height,                  // 高度
              left: left,                           // 左边界
              right: right,                         // 右边界
              value: 0,                             // 默认为 0
              fill: computed_style.fill,            // 原始填充信息 (可能为空)
              fill_color: fillColor,                // RGB 数组格式
              opacity: parseFloat(computed_style.opacity) || 1.0,
              fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
              ox: (left + right) / 2,               // 中心点 x 坐标
              oy: (up + down) / 2,                  // 中心点 y 坐标
              x: left,                              // 左上角 x 坐标
              y: up,                                // 左上角 y 坐标
              up: up,                               // 上边界
              down: down,                           // 下边界
              text: textContent                     // 文字内容
          });
      }

      //未修改
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

        // path 为圆形
        if (isCirclePathData(element.getAttribute("d"))) {
          rects.push({
              type: "circle",
              origin: element.outerHTML,
              original_soup: element.outerHTML,
              width: element.getBoundingClientRect().width,
              height: element.getBoundingClientRect().height,
              left: element.getBoundingClientRect().x,
              right: element.getBoundingClientRect().x + element.getBoundingClientRect().width,
              fill: rgbStringToRGB(computed_style.fill),
              stroke: rgbStringToRGB(computed_style.stroke),
              stroke_width: computed_style.strokeWidth || "1px",
              opacity: parseFloat(computed_style.opacity) || 1.0,
              fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
              x: element.getBoundingClientRect().x,
              y: element.getBoundingClientRect().y,
              up: element.getBoundingClientRect().y,
              down: element.getBoundingClientRect().y + element.getBoundingClientRect().height,
              r: element.getBoundingClientRect().width / 2
          });
          continue;
        } 


        let points = parsePath(element.getAttribute("d"), matrixArray)


        if (points.length === 0) {
          continue
        }

        //注意这里称为polygon,不再叫area了
        //先假设是line, 如果是闭合的, 就是polygon
        let path_type = "line"
        if (points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y && computed_style.fill !== 'none') {
          points.pop();
          path_type = 'polygon'
        }

        // 判断是否是矩形
        if (isAxisAlignedRectangle(points)) {
            rects.push({
                type: "rect",
                origin: element.outerHTML,
                original_soup: element.outerHTML,
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
                left: element.getBoundingClientRect().x,
                right: element.getBoundingClientRect().x + element.getBoundingClientRect().width,
                fill: rgbStringToRGB(computed_style.fill),
                stroke: rgbStringToRGB(computed_style.stroke),
                stroke_width: computed_style.strokeWidth || "1px",
                opacity: parseFloat(computed_style.opacity) || 1.0,
                fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
                x: element.getBoundingClientRect().x,
                y: element.getBoundingClientRect().y,
                up: element.getBoundingClientRect().y,
                down: element.getBoundingClientRect().y + element.getBoundingClientRect().height
            });
            continue;
        }

        rects.push({
          type: path_type,
          origin: element.outerHTML,
          original_soup: element.outerHTML,
          fill: rgbStringToRGB(computed_style.fill) || "",
          stroke: rgbStringToRGB(computed_style.stroke),
          opacity: parseFloat(computed_style.opacity) || 1.0,
          fill_opacity: parseFloat(computed_style.fillOpacity) || 0,
          stroke_width: computed_style.strokeWidth || "0px",
          polygon: points.map(point => `(${point.x}, ${point.y})`),
          text: "",
          center: null,
          append_info: Array(points.length).fill(null)
        });
      }

      return rects;
    }

    const rects = get_all_rects(svg);











    //加uniform的, 已经删除
    // rects.forEach((rect) => {
      // rect.uniform_x = parseInt((rect.x * granularity) / svg_width);
      // rect.uniform_y = parseInt((rect.y * granularity) / svg_height);
      // rect.uniform_width = parseInt((rect.width * granularity) / svg_width);
      // rect.uniform_height = parseInt((rect.height * granularity) / svg_height);
      // rect.fill_hex = rgbStringToHex(rect.fill)
      // rect.stroke_hex = rgbStringToHex(rect.stroke)
      // if (rect.hasOwnProperty("points")) {
      //   rect.uniform_points = rect.points.map((point) => {
      //     return {
      //       x: Math.round((point.x * granularity) / svg_width),
      //       y: Math.round((point.y * granularity) / svg_height),
      //     };
      //   })
      // }
    // });

    //过滤掉无效的rects
    let filtered_rects = rects.filter(
      (rect) => !(rect.type === "path" && rect.points.length == 0) && !(rect.width == 0 && rect.height == 0)
    )

    //生成简略的sim_vector用的
    filtered_rects.forEach((rect) => {
      let point_string = `[${rect.x},${rect.y},${rect.width},${rect.height}]`;
  
      if (rect.hasOwnProperty('points')) {
          point_string = rect.points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(';');
          rect.point_string = point_string;
      }
  
      if (rect.type === 'text') {
          // 使用左上角坐标
          point_string = `[${rect.x},${rect.y},${rect.width},${rect.height}]`;
          rect.sim_description = `${rect.type} ${rect.content}`;
      } 
      else if (rect.type === 'line') {
          rect.sim_description = `${rect.type} ${rect.stroke_hex}`;
      } 
      else {
          rect.sim_description = `${rect.type} ${rect.fill_hex}`;
      }
  
      rect.sim_description += ` ${point_string}`;
    });

    //排序
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

    //最后返回的数据格式
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
  // console.log("Data:");
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
