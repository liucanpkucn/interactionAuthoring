const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require('path');
const { SingleBar } = require('cli-progress');
const { console } = require("inspector");
const inputFileName = "js_temp_svg";  
const inputFilePath = `parse_tmp/${inputFileName}.svg`;
const outputDirectory = "parse_tmp";
const outputFileName = "js_edited_svg";
const outputFilePath = `parse_tmp/${outputFileName}.svg`;
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
          return "none";  // 默认返回黑色
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


    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function parsePath(d, transform_matrix) {
      // 预处理路径数据：移除换行符并确保命令之间有空格
      const cleanD = d.replace(/\n/g, ' ').trim();
      
      // 改进的正则表达式，匹配所有SVG路径命令
      const commands = cleanD.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g);
      if (!commands) {
          return [];
      }
  
      let x = 0, y = 0;
      let startX = 0, startY = 0; // 处理'Z'命令
      let lastControlX = 0, lastControlY = 0; // 用于S和T命令的反射控制点
      const points = [];
  
      for (const command of commands) {
          const type = command[0];
          // 改进的参数提取，处理多种分隔符
          const args = command
              .slice(1)
              .trim()
              .split(/[\s,]+/)
              .filter(arg => arg !== '') // 过滤空字符串
              .map(Number);
  
          // 保存上一个控制点，用于S和T命令
          let controlX, controlY;
  
          switch (type) {
              case "M": // 绝对移动
                  x = args[0];
                  y = args[1];
                  startX = x;
                  startY = y;
                  points.push({ x, y });
                  
                  // 处理多个坐标对（隐式L命令）
                  for (let i = 2; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x = args[i];
                          y = args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "m": // 相对移动
                  x += args[0];
                  y += args[1];
                  startX = x;
                  startY = y;
                  points.push({ x, y });
                  
                  // 处理多个坐标对（隐式l命令）
                  for (let i = 2; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x += args[i];
                          y += args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "L": // 绝对线段
                  for (let i = 0; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x = args[i];
                          y = args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "l": // 相对线段
                  for (let i = 0; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x += args[i];
                          y += args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "H": // 绝对水平线
                  for (let i = 0; i < args.length; i++) {
                      x = args[i];
                      points.push({ x, y });
                  }
                  break;
                  
              case "h": // 相对水平线
                  for (let i = 0; i < args.length; i++) {
                      x += args[i];
                      points.push({ x, y });
                  }
                  break;
                  
              case "V": // 绝对垂直线
                  for (let i = 0; i < args.length; i++) {
                      y = args[i];
                      points.push({ x, y });
                  }
                  break;
                  
              case "v": // 相对垂直线
                  for (let i = 0; i < args.length; i++) {
                      y += args[i];
                      points.push({ x, y });
                  }
                  break;
                  
              case "C": // 绝对三次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 6) {
                      if (i + 5 < args.length) {
                          controlX = args[i + 2];
                          controlY = args[i + 3];
                          x = args[i + 4];
                          y = args[i + 5];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "c": // 相对三次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 6) {
                      if (i + 5 < args.length) {
                          controlX = x + args[i + 2];
                          controlY = y + args[i + 3];
                          x += args[i + 4];
                          y += args[i + 5];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "S": // 绝对平滑三次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 4) {
                      if (i + 3 < args.length) {
                          controlX = args[i];
                          controlY = args[i + 1];
                          x = args[i + 2];
                          y = args[i + 3];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "s": // 相对平滑三次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 4) {
                      if (i + 3 < args.length) {
                          controlX = x + args[i];
                          controlY = y + args[i + 1];
                          x += args[i + 2];
                          y += args[i + 3];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "Q": // 绝对二次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 4) {
                      if (i + 3 < args.length) {
                          controlX = args[i];
                          controlY = args[i + 1];
                          x = args[i + 2];
                          y = args[i + 3];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "q": // 相对二次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 4) {
                      if (i + 3 < args.length) {
                          controlX = x + args[i];
                          controlY = y + args[i + 1];
                          x += args[i + 2];
                          y += args[i + 3];
                          lastControlX = controlX;
                          lastControlY = controlY;
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "T": // 绝对平滑二次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x = args[i];
                          y = args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "t": // 相对平滑二次贝塞尔曲线
                  for (let i = 0; i < args.length; i += 2) {
                      if (i + 1 < args.length) {
                          x += args[i];
                          y += args[i + 1];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "A": // 绝对椭圆弧
                  for (let i = 0; i < args.length; i += 7) {
                      if (i + 6 < args.length) {
                          x = args[i + 5];
                          y = args[i + 6];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "a": // 相对椭圆弧
                  for (let i = 0; i < args.length; i += 7) {
                      if (i + 6 < args.length) {
                          x += args[i + 5];
                          y += args[i + 6];
                          points.push({ x, y });
                      }
                  }
                  break;
                  
              case "Z":
              case "z": // 闭合路径
                  x = startX;
                  y = startY;
                  points.push({ x, y });
                  break;
                  
              default:
                  console.warn("Unknown command:", type);
          }
      }
  
      // 应用变换矩阵
      let absolute_points = points.map(point => {
          const { x, y } = point;
          const newX = transform_matrix[0][0] * x + transform_matrix[0][1] * y + transform_matrix[0][2];
          const newY = transform_matrix[1][0] * x + transform_matrix[1][1] * y + transform_matrix[1][2];
          return { x: newX, y: newY };
      });
  
      return absolute_points;
  };
  

    // function parsePath(d, transform_matrix) {
    //   const commands = d.match(/[a-z][^a-z]*/gi);
    //   if (!commands) {
    //     return [];
    //   }
    
    //   let x = 0, y = 0;
    //   let startX = 0, startY = 0; // To handle 'Z' command
    //   const points = [];
    
    //   for (const command of commands) {
    //     const type = command[0];
    //     const args = command
    //       .slice(1)
    //       .trim()
    //       .split(/[\s,]+/)
    //       .map(Number);
    
    //     switch (type) {
    //       case "M":
    //         x = args[0];
    //         y = args[1];
    //         startX = x;
    //         startY = y;
    //         break;
    //       case "m":
    //         x += args[0];
    //         y += args[1];
    //         startX = x;
    //         startY = y;
    //         break;
    //       case "L":
    //         x = args[0];
    //         y = args[1];
    //         break;
    //       case "l":
    //         x += args[0];
    //         y += args[1];
    //         break;
    //       case "H":
    //         x = args[0];
    //         break;
    //       case "h":
    //         x += args[0];
    //         break;
    //       case "V":
    //         y = args[0];
    //         break;
    //       case "v":
    //         y += args[0];
    //         break;
    //       case "C":
    //         x = args[4];
    //         y = args[5];
    //         break;
    //       case "c":
    //         x += args[4];
    //         y += args[5];
    //         break;
    //       case "S":
    //         x = args[2];
    //         y = args[3];
    //         break;
    //       case "s":
    //         x += args[2];
    //         y += args[3];
    //         break;
    //       case "Q":
    //         x = args[2];
    //         y = args[3];
    //         break;
    //       case "q":
    //         x += args[2];
    //         y += args[3];
    //         break;
    //       case "T":
    //         x = args[0];
    //         y = args[1];
    //         break;
    //       case "t":
    //         x += args[0];
    //         y += args[1];
    //         break;
    //       case "A":
    //         x = args[5];
    //         y = args[6];
    //         break;
    //       case "a":
    //         x += args[5];
    //         y += args[6];
    //         break;
    //       case "Z":
    //       case "z":
    //         x = startX;
    //         y = startY;
    //         break;
    //       default:
    //         console.warn("Unknown command:", type);
    //     }
    
    //     // 确保每个命令处理后都添加当前点
    //     if (typeof x === 'number' && !isNaN(x) && typeof y === 'number' && !isNaN(y)) {
    //       // 可以选择是否检查重复点
    //       if (!points.length || points[points.length - 1].x !== x || points[points.length - 1].y !== y) {
    //         points.push({ x, y });
    //       }
    //     }
    //   }
    
    //   // 应用变换矩阵
    //   let absolute_points = points.map(point => {
    //     const { x, y } = point;
    //     const newX = transform_matrix[0][0] * x + transform_matrix[0][1] * y + transform_matrix[0][2];
    //     const newY = transform_matrix[1][0] * x + transform_matrix[1][1] * y + transform_matrix[1][2];
    //     return { x: newX, y: newY };
    //   });
    
    //   return absolute_points;
    // }

    
    let vidCounter = 0;  // 新增一个计数器

    function get_all_rects(current_svg) {

      //已经修改
      let rects = current_svg.getElementsByTagName("rect");
      rects = [...rects].map((element) => {
          const vid = vidCounter++;  // 修改为纯数字形式
          const uuid = generateUUID()
          element.setAttribute('uuid', uuid);
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
              vid: vid,   // 新增vid字段
              uuid: uuid,
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
              stroke_width: computed_style.strokeWidth || "0px",
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
          const vid = vidCounter++;  // 修改为纯数字形式

          const element = circles[i];
          element.focus();
          const uuid = generateUUID()
          element.setAttribute('uuid', uuid);


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
              vid: vid,   // 新增vid字段
              uuid: uuid,
              origin: element.outerHTML,         // 保留原始 HTML
              original_soup: element.outerHTML,  // 保留完整 HTML
              width: bbox.width,
              height: bbox.height,
              left: left,
              right: right,
              fill: rgbStringToRGB(computed_style.fill || "rgb(0, 0, 0)"),
              stroke: rgbStringToRGB(computed_style.stroke || "rgb(0, 0, 0)"),
              stroke_width: computed_style.strokeWidth || "0",
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
          const vid = vidCounter++;  // 修改为纯数字形式

          const element = texts[i];

          const uuid = generateUUID()
          element.setAttribute('uuid', uuid);
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

          console.log(bbox);
          const left = bbox.x;
          const right = bbox.x + bbox.width;
          const up = bbox.y;
          const down = bbox.y + bbox.height;

          rects.push({
              type: "text",
              vid: vid,   // 新增vid字段
              uuid: uuid,
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

      //已经修改
      paths = current_svg.getElementsByTagName("path");
      for (let i = 0; i < paths.length; i++) {
        const vid = vidCounter++;  // 修改为纯数字形式
        const element = paths[i];
        element.focus();
        computed_style = window.getComputedStyle(element);
        const uuid = generateUUID()
        element.setAttribute('uuid', uuid);


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
              vid: vid,   // 新增vid字段
              uuid: uuid,
              origin: element.outerHTML,
              original_soup: element.outerHTML,
              width: element.getBoundingClientRect().width,
              height: element.getBoundingClientRect().height,
              left: element.getBoundingClientRect().x,
              right: element.getBoundingClientRect().x + element.getBoundingClientRect().width,
              fill: rgbStringToRGB(computed_style.fill),
              stroke: rgbStringToRGB(computed_style.stroke),
              stroke_width: computed_style.strokeWidth || "0",
              opacity: parseFloat(computed_style.opacity) || 1.0,
              fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
              x: element.getBoundingClientRect().x,
              y: element.getBoundingClientRect().y,
              up: element.getBoundingClientRect().y,
              down: element.getBoundingClientRect().y + element.getBoundingClientRect().height,
              r: element.getBoundingClientRect().width / 2,
              uuid: generateUUID(),
          });
          continue;
        } 

        let points = parsePath(element.getAttribute("d"), matrixArray)

        if (points.length === 0) {
          continue
        }

        //注意这里称为polygon,不再叫area了
        let path_type = "line"

        // 处理 polygon
        if ((points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y) || computed_style.fill !== 'none') {
          // points.pop();
          path_type = 'polygon'
          rects.push({
            type: "polygon",
            vid: vid,   // 新增vid字段
            uuid: uuid,
            origin: element.outerHTML,
            original_soup: element.outerHTML,
            fill: rgbStringToRGB(computed_style.fill) || "",
            stroke: rgbStringToRGB(computed_style.stroke),
            opacity: parseFloat(computed_style.opacity) || 1.0,
            fill_opacity: parseFloat(computed_style.fillOpacity) || 0,
            stroke_width: computed_style.strokeWidth || "0px",
            polygon: points.map(point => [point.x, point.y]),
            points: points,
            left: Math.min(...points.map(point => point.x)),
            right: Math.max(...points.map(point => point.x)),
            up: Math.min(...points.map(point => point.y)),
            down: Math.max(...points.map(point => point.y)),
            text: "",
            center: null,
            // append_info: Array(points.length).fill(null)
          });
          continue;
        }

        // 处理rect
        if (isAxisAlignedRectangle(points)) {
            rects.push({
                type: "rect",
                vid: vid,   // 新增vid字段
                uuid: uuid,
                origin: element.outerHTML,
                original_soup: element.outerHTML,
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
                left: element.getBoundingClientRect().x,
                right: element.getBoundingClientRect().x + element.getBoundingClientRect().width,
                fill: rgbStringToRGB(computed_style.fill),
                stroke: rgbStringToRGB(computed_style.stroke),
                stroke_width: computed_style.strokeWidth || '0',
                opacity: parseFloat(computed_style.opacity) || 1.0,
                fill_opacity: parseFloat(computed_style.fillOpacity) || 1.0,
                x: element.getBoundingClientRect().x,
                y: element.getBoundingClientRect().y,
                up: element.getBoundingClientRect().y,
                down: element.getBoundingClientRect().y + element.getBoundingClientRect().height
            });
            continue;
        }

        // 处理 line
        rects.push({
            type: "line",
            vid: vid,   // 新增vid字段
            uuid: uuid,
            origin: element.outerHTML,
            original_soup: element.outerHTML,
            fill: "",
            stroke: rgbStringToRGB(computed_style.stroke),
            opacity: parseFloat(computed_style.opacity) || 1.0,
            fill_opacity: 0,
            stroke_width: computed_style.strokeWidth || "0",
            polygon: points.map(point => [point.x, point.y]),
            points: points,
            text: "",
            left: Math.min(...points.map(point => point.x)),
            right: Math.max(...points.map(point => point.x)),
            up: Math.min(...points.map(point => point.y)),
            down: Math.max(...points.map(point => point.y)),
            center: null,
            // append_info: Array(points.length).fill(null),
        });
      }

      return rects;
    }

    const rects = get_all_rects(svg);


    //过滤掉无效的rects
    let filtered_rects = rects.filter(
      (rect) => !(rect.type === "path" && rect.points.length == 0) && !(rect.width == 0 && rect.height == 0)
    )

    //生成简略的sim_vector用的
    filtered_rects.forEach((rect) => {
      let rounded_x = Math.round(rect.x);
      let rounded_y = Math.round(rect.y);
      let rounded_width = Math.round(rect.width);
      let rounded_height = Math.round(rect.height);
  
      let point_string = `[${rounded_x},${rounded_y},${rounded_width},${rounded_height}]`;
  
      if (rect.hasOwnProperty('points')) {
          point_string = rect.points.map((point) => `(${Math.round(point.x)}, ${Math.round(point.y)})`).join(';');
          rect.point_string = point_string;
      }
  
      if (rect.type === 'text') {
        rect.sim_description = `${rect.vid} ${rect.type} ${rect.text} ${point_string}`;
      } 
      else if (rect.type === 'line') {
        rect.sim_description = `${rect.vid} ${rect.type} ${JSON.stringify(rect.stroke)} ${point_string}`;
      }
      else if (rect.type === 'polygon') {
        rect.sim_description = `${rect.vid} ${rect.type} (${rect.fill[0]}, ${rect.fill[1]}, ${rect.fill[2]}) ${point_string}`;
      }
      else if (rect.type === 'circle') {
        let rounded_r = Math.round(rect.r);  // 圆的半径也需要保留整数
        rect.sim_description = `${rect.vid} ${rect.type} (${rect.fill[0]}, ${rect.fill[1]}, ${rect.fill[2]}) [${rounded_x},${rounded_y},${rounded_r * 2},${rounded_r * 2}]`;
      }
      else {
        rect.sim_description = `${rect.vid} ${rect.type} (${rect.fill[0]}, ${rect.fill[1]}, ${rect.fill[2]}) ${point_string}`;
      }
    });
  
  
    
    // filtered_rects.forEach((rect) => {
    //   let point_string = `[${rect.x},${rect.y},${rect.width},${rect.height}]`;
  
    //   if (rect.hasOwnProperty('polygon')) {
    //       point_string = rect.polygon.map((point) => `${point}`).join(';');
    //       rect.point_string = point_string;
    //   }
  
    //   if (rect.type === 'text') {
    //       point_string = `[${rect.x},${rect.y},${rect.width},${rect.height}]`;
    //       rect.sim_description = `${rect.type} ${rect.content}`;
    //   } 
    //   else if (rect.type === 'line') {
    //       rect.sim_description = `${rect.type} ${JSON.stringify(rect.stroke)}`;
    //   }
    //   else if (rect.type === 'polygon') {
    //       rect.sim_description = `${rect.type} ${JSON.stringify(rect.fill)}`;
    //   }
    //   else {
    //       rect.sim_description = `${rect.type} ${JSON.stringify(rect.fill)}`;
    //   }
  
    //   rect.sim_description += ` ${point_string}`;
    // });
    
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
    let svg_data = {
      x: svg.getBoundingClientRect().x,
      y: svg.getBoundingClientRect().y,
      width: svg.getBoundingClientRect().width,
      height: svg.getBoundingClientRect().height,
      element_len: filtered_rects.length,
      sim_vector: filtered_rects.map((rect) => rect.sim_description).join('|'),
      rects: filtered_rects,
      svg_string: svg.outerHTML,
    };

    return svg_data;
  });
  // console.log("Data:");
  // console.log(data);
  // fs.writeFileSync(
  //   `$DEBUG/1_debug_all_js_parse.json`,
  //   JSON.stringify(data, null, 2)
  // );
  fs.writeFileSync(
    `${outputDirectory}/svg_parse.json`,
    JSON.stringify(data, null, 2)
  );

  fs.writeFileSync(
    `${outputDirectory}/svg_edited.svg`,
    data.svg_string
  );



  // 处理 sim_vector 并保存为 TXT 文件
  // const simVectorContent = (data.sim_vector || "").replace(/\|/g, "\n");
  // fs.writeFileSync(
  //   `${outputDirectory}/1_debug_simvec.txt`,
  //   simVectorContent
  // );
  await browser.close();
})();

// console.log(parsePath("M10 10 L20 20 L30 10 Z"));
// console.log(parsePath("M0,0h44.896484375v11h-44.896484375Z"));
