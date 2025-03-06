const predefinedColors = {
  "black": [0, 0, 0],
  "white": [255, 255, 255],
  "red": [255, 0, 0],
  "green": [0, 255, 0],
  "blue": [0, 0, 255],
  "yellow": [255, 255, 0],
  "gray": [128, 128, 128],
  "orange": [255, 165, 0],
  "pink": [255, 192, 203],
  "purple": [128, 0, 128],
  "brown": [165, 42, 42]
};

function receiveJson(parsedJson){
  let action = parsedJson.action;
  let result = parsedJson.result;
  console.log(action);
  console.log(result);
  const color = extractColorFromResult(result);
  console.log('result color', color);
  // button create
  if(action.target.type === "button"){
    console.log("Create Button");
    buttonCreation(action.target.label, color);
  }
  // rescale axis
  if(action.type === "zoom" && action.target.type === "axis" && result.type === "rescale"){
    console.log("Rescale Axis");
    axis_zoom_rescale();
  }
  // resort axis by height/opacity/color - bar chart
  if(result.type === "sort"){
    console.log("Resort Axis");
    let sort_action;
    let sort_by;
    
    // click / dbclick / contextmenu
    sort_action = "contextmenu";

    // min_value / max_value / diff / color / opacity
    if(result.parameter === 'height') {
      sort_by = 'min_value';
    } else {
      sort_by = 'auto';
    }
    _chart_object[0].x_axis_object_list[0].activate_sort(sort_action, sort_by);
  }
  // resort the stacked bar chart
  console.log("Resort Area");
  _chart_object[0].CoordSys[2].activate_move_to_bottom();
}


function buttonCreation(label, color) {
  console.log("Button Creation");

  let mainRect = document.querySelector(".mainrect");

  if (!mainRect) {
      console.error("Error: No element found with class 'mainrect'");
      return;
  }

  let button = document.createElement("button");
  button.innerText = label;
  button.style.position = "absolute";
  button.style.left = (mainRect.getBoundingClientRect().right - 170) + "px"; // 오른쪽에 배치
  button.style.top = (mainRect.getBoundingClientRect().bottom - 150) + "px"; // 같은 높이로 정렬
  button.style.padding = "8px 12px";
  button.style.backgroundColor = color;
  button.style.color = "#000";
  button.style.borderWidth = "1px";
  button.style.cursor = "pointer";
  button.style.borderRadius = "5px";
  
  if(label === "remove"){
    button.addEventListener("click", function () {
      _chart_object[0].CoordSys[2].deactivate_visual_object(find_element_by_color(color));
    });
  }

  document.body.appendChild(button);
}

function closestColor(r, g, b) {
  let closest = null;
  let minDistance = Number.MAX_VALUE;

  for (const [colorName, [cr, cg, cb]] of Object.entries(predefinedColors)) {
      let distance = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
      if (distance < minDistance) {
          minDistance = distance;
          closest = colorName;
      }
  }
  return closest;
}

function extractColorFromResult(result) {
  let foundColors = [];

  // result의 모든 속성을 확인하면서 predefinedColors에 있는 키값이 포함되어 있는지 확인
  for (let key of Object.keys(result)) {
      if (typeof result[key] === "string") {
          for (let color of Object.keys(predefinedColors)) {
              if (result[key].toLowerCase().includes(color)) {
                  foundColors.push(color);
              }
          }
      }
  }
  return foundColors.length > 0 ? foundColors : null;
}

// 특정 색상과 가장 가까운 visual_object 찾기
function find_element_by_color(color) {
  if (!predefinedColors[color]) {
      console.error(`"${color}" is not a valid predefined color.`);
      return null;
  }

  let targetRGB = predefinedColors[color]; // 찾고자 하는 색상의 RGB 값
  let closestIndex = -1;
  let minDistance = Number.MAX_VALUE;

  for (let i = 0; i < number_of_visual_element(); i++) {
      let element = document.getElementById(`visual_object_${i}`);
      if (element) {
          let rgb = window.getComputedStyle(element).fill;
          let match = rgb.match(/\d+/g);

          if (match) {
              let [r, g, b] = match.map(Number);

              // 현재 요소의 색과 목표 색과의 거리 계산
              let distance = Math.sqrt((r - targetRGB[0]) ** 2 + (g - targetRGB[1]) ** 2 + (b - targetRGB[2]) ** 2);
              // 가장 가까운 색상 업데이트
              if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = i;
                  console.log('closestIndex', i);
              }
          }
      }
  }
  return closestIndex !== -1 ? closestIndex : null;
}

function number_of_visual_element() {
  let i = 0;
  while (document.getElementById(`visual_object_${i}`)) {
    i++;
  }
  console.log('visual_element_number:', i);
  return i;
}

function axis_zoom_rescale() {
  _chart_object[0].x_axis_object_list[0].activate_rescale();
  _chart_object[0].y_axis_object_list[0].activate_rescale();
}