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

async function getAnswer(message) {
  // localStorage.setItem("apiToken", "sk-xxxxxxxxxxxxxxxxxxxx");
  const token = localStorage.getItem("apiToken");

  if (!token) {
      console.error("There are no API tokens!");
      return "API Token is not set.";
  }

  const prompt = `
  ### **INSTRUCTION** ###
  Your task is to convert user input (natural language instructions) into a structured JSON format.
  The JSON structure must strictly follow this schema:

  {
      "data": [
          {
              "action": {
                  "target": ( "visual mark" | "axis" | "button" ),
                  "action": ( "click" | "double click" | "right button click" | "mouseover" | "drag" | "zoom" ),
                  "parameter": ( "x" | "y" | "all" | "<behavior value>" | "" )  
              },
              "result": {
                  "target": ( "visual mark" | "axis" | "tooltip" ),
                  "behavior": ( "remove" | "rescale" | "resort" | "annotate" | "overlap" | "highlight" ),
                  "by": ( "height" | "opacity" | "color" | "axis" | "value" | "auto" | "unselected ),
                  "parameter": ( "black" | "white" | "red" | "green" | "blue" | "yellow" | "gray" | "orange" | "pink" | "purple" | "brown" | "x" | "y" | "all" | "" )
              },
              "similar": (true | false),
              "description": "<A concise and user-friendly explanation of the interaction>"
          }
      ],
      "description": "<A high-level explanation of the overall interaction sequence>"
  }

  ### **RULES FOR JSON FORMATTING** ###
  1. **Multiple action-result pairs must be included** in the \`data\` array.
    - Each interaction should be represented as a separate JSON object in the array.

  2. **action.target** must be one of: "visual mark", "axis", or "button".
    - If "axis", then parameter must be "x", "y", or "all".
    - If "button", then parameter must match the **exact value of result.behavior**.
    - If "visual mark", then parameter must be an **empty string** ("").

  3. **action.action** must be one of: "click", "double click", "right button click", "mouseover", "drag", or "zoom".

  4. **result.target** must be one of: "visual mark", "axis", or "tooltip".

  5. **result.behavior** must be one of: "remove", "rescale", "resort", "annotate", "overlap", "highlight".
    - \`"resort"\` is used for both **resort and reorder**.
    - \`"annotate"\` replaces **add and show** (e.g., highlighting or marking elements).
    - \`"highlight"\` is used when an element is specifically chosen.

  6. **result.by** must be one of: "height", "opacity", "color", "axis", "value", or "auto".
    - If "color", then parameter must be one of:
      **"black", "white", "red", "green", "blue", "yellow", "gray", "orange", "pink", "purple", "brown"**.
    - If "axis", then parameter must be "x", "y", or "all".
    - If "value", then parameter must be "x", "y", or "all" (only used when target = "tooltip").
    - If "height", "opacity", or "auto", then parameter must be an **empty string** ("").

  7. **Handling Insufficient Information**  
    - If the user input **does not provide enough details**, return:
      \`\`\`json
      {
          "data": [
              {
                  "action": {
                      "target": "<best guess>",
                      "action": "<best guess>",
                      "parameter": "<best guess>"
                  },
                  "result": {
                      "target": "<best guess>",
                      "behavior": "<best guess>",
                      "by": "<best guess>",
                      "parameter": "<best guess>"
                  },
                  "similar": true,
                  "description": "Based on the input, we inferred the most likely interaction."
              }
          ],
          "description": "The input lacked detail, so we made an educated guess about the intended interactions."
      }
      \`\`\`

  8. **Handling Completely Unmatched Input**  
    - If the user input **does not match any valid interaction**, return:
      \`\`\`json
      {
          "data": [],
          "description": "Please provide more information."
      }
      \`\`\`

  9. **Description Formatting (No Extra Words!)**
   - The **description for each action-result pair must be direct and clear**.
   - The **overall description must summarize the entire interaction sequence**.
   - Example formatting:
     - ✅ \`"Clicking on two colors highlights them for comparison."\`
     - ✅ \`"Clicking the compare button removes unselected visual marks."\`
     - ✅ \`"Zooming on the y-axis rescales it for better visualization."\`
   - Avoid vague or unnecessary words like:
     - ❌ \`"We inferred that clicking the x-axis will reorder the elements."\`
     - ❌ \`"When the user hovers, a tooltip appears."\`

  ---

  ### **EXAMPLES OF INPUT AND EXPECTED OUTPUT** ###

  #### **Example 1 (Multiple Interactions):**
  **Input:**  
  *"When the user clicks on two colors and then clicks the compare button, we compare these two colors."*

  **Output:**
  \`\`\`json
  {
      "data": [
          {
              "action": {
                  "target": "visual mark",
                  "action": "click",
                  "parameter": ""
              },
              "result": {
                  "target": "visual mark",
                  "behavior": "highlight",
                  "by": "color",
                  "parameter": "auto"
              },
              "similar": false,
              "description": "Clicking on two colors selects them for comparison."
          },
          {
              "action": {
                  "target": "button",
                  "action": "click",
                  "parameter": "compare"
              },
              "result": {
                  "target": "visual mark",
                  "behavior": "remove",
                  "by": "unselected",
                  "parameter": "auto"
              },
              "similar": false,
              "description": "Clicking the compare button removes unselected visual marks."
          },
          {
              "action": {
                  "target": "button",
                  "action": "click",
                  "parameter": "compare"
              },
              "result": {
                  "target": "visual mark",
                  "behavior": "overlap",
                  "by": "auto",
                  "parameter": ""
              },
              "similar": false,
              "description": "Clicking the compare button overlaps the stacked area chart."
          },
          {
              "action": {
                  "target": "axis",
                  "action": "zoom",
                  "parameter": "y"
              },
              "result": {
                  "target": "axis",
                  "behavior": "rescale",
                  "by": "auto",
                  "parameter": "y"
              },
              "similar": false,
              "description": "Zooming on the y-axis rescales it for better visualization."
          }
      ],
      "description": "To compare two colors, first select two colors by clicking on them. Then, click the compare button to remove unselected visual marks, overlap the stacked area chart, and rescale the y-axis for better visualization."
  }
  \`\`\`

  ---

  ### **INPUT FROM USER** ###
  \`\`\`
  ${JSON.stringify(message)}
  \`\`\`

  ### **RESPONSE FORMAT**
  Return **only a valid JSON object** based on the input above. Do **not** provide explanations, comments, or extra text. Ensure the response is strictly valid JSON.
  `;


  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "model": "gpt-4o",
    "messages": [
        {
          "role": "user",
          "content": prompt
        }
    ],
    "max_tokens": 1688,
    "temperature": 0.5,
    "stream": false
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  console.log("requestOptions", requestOptions);

  try {
    const response = await fetch("https://api.gpt.ge/v1/chat/completions", requestOptions);
    const result = await response.json();
    console.log("result", result);
    return result.choices[0].message.content;
  } catch (error) {
      console.error("error", error);
      return "Error fetching response";
  }
}

function activateInteraction(parsedJson){
  let action = parsedJson.action;
  let result = parsedJson.result;
  let description = parsedJson.description;

  // mouse action
  let mouse_action;
  if (action.action === "click" || action.action === "mouseover" || action.action === "drag" || action.action === "zoom") {
    mouse_action = action.action;
  } else if (action.action === "double click") {
    mouse_action = "dbclick";
  } else if (action.action === "right button click") {
    mouse_action = "contextmenu";
  }

  console.log(action);
  console.log(result);
  console.log(mouse_action);


  // rescale axis
  if(action.action === "zoom"){
    console.log("Rescale Axis");
    activate_axis_zoom_rescale();
    _chart_object[0].share_json.push(parsedJson);
    return true;
    // alert("Rescale Axis");
    // return "Rescale Axis";
  }
  // annotate visual mark
  if(result.target === "tooltip") {
    console.log("Annotate Visual Mark");
    if(result.parameter){
      _chart_object[0].CoordSys[2].activate_value_tooltip(result.parameter);
      _chart_object[0].share_json.push(parsedJson);
      return true;
    } else {
      _chart_object[0].CoordSys[2].activate_value_tooltip("all");
      _chart_object[0].share_json.push(parsedJson);
      return true;
    }
  }
  // resort axis by height/opacity/color - bar chart
  if(result.behavior === "resort" || result.behavior === "reorder"){
    console.log("Resort Axis");
    let sort_by;

    // min_value / max_value / diff / color / opacity
    if(result.by === 'height' || result.by === "value") {
      sort_by = 'min_value';
    } else if (result.by === "color" || result.by === "opacity" || result.by === "auto") {
      sort_by = result.by;
    }
    else  {
      sort_by = 'auto';
    }
    _chart_object[0].x_axis_object_list[0].activate_sort(mouse_action, sort_by);
    _chart_object[0].share_json.push(parsedJson);
    return true;
  }
  // remove area
  if(result.behavior === "remove") {
    console.log("Remove Area");
    // button create
    if(action.target === "button"){
      console.log("Create Button");
      buttonCreation(action.parameter, result.parameter);
    } else {
      console.log("Please write again.");
    }
    _chart_object[0].share_json.push(parsedJson);
    return true;
  }
  // overlap area
  if(result.behavior === "overlap") {
    console.log("Overlap Area");
    _chart_object[0].CoordSys[2].activate_allow_overlap();
    _chart_object[0].share_json.push(parsedJson);
    return true;
  }
  // move to bottom area
  if(result.target === "visual mark" && action.action === "click") {
    console.log("Move Area");
    _chart_object[0].CoordSys[2].activate_move_to_bottom();
    _chart_object[0].share_json.push(parsedJson);
    return true;
  }
  return false;
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

function activate_axis_zoom_rescale() {
  _chart_object[0].x_axis_object_list[0].activate_rescale();
  _chart_object[0].y_axis_object_list[0].activate_rescale();
}