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
                  "behavior": ( "remove" | "rescale" | "resort" | "annotate" | "overlap" | "highlight" | "reencode" ),
                  "by": ( "height" | "opacity" | "color" | "axis" | "value" | "auto" | "unselected | "move bottom" | "line" | "area" | "" ),
                  "parameter": ("bar" | "stacked area" | "area" | "black" | "white" | "red" | "green" | "blue" | "yellow" | "gray" | "orange" | "pink" | "purple" | "brown" | "x" | "y" | "all" | "" )
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
    - ⚠️ If action.target is "visual mark" and action.action is "click", then:
      - result.by must be an empty string ("").
      - result.parameter must be an empty string ("").

  3. **action.action** must be one of: "click", "double click", "right button click", "mouseover", "drag", or "zoom".

  4. **result.target** must be one of: "visual mark", "axis", or "tooltip".

  5. **result.behavior** must be one of: "remove", "rescale", "resort", "annotate", "overlap", "highlight", "reencode".
    - \`"resort"\` is used for both **resort and reorder**.
    - \`"annotate"\` replaces **add and show** (e.g., highlighting or marking elements).
    - \`"highlight"\` is used when an element is specifically chosen.
    - ⚠️ If result.behavior is \`"resort"\`, then result.parameter must be either \`"bar"\` or \`"stacked area"\`.  
      - For \`"stacked area"\`, result.by can include \`"move bottom"\`.
      - result.by can also be \`height\`, \`opacity\`, or \`color\` for both values.
    - If result.behavior is \`"reencode"\`, then you must follow this rule.
      - result.target must be \`"visual mark"\`.
      - action.target must be \`"button"\` and action.action must be \`"click"\`.
      - If result.by is \`"line"\`, then result.parameter must be \`"area"\`.
      - Else if result.by is \`"area"\`, then result.parameter must be \`"bar"\`.

  6. **result.by** must be one of: "height", "opacity", "color", "axis", "value", "auto", "unselected", "move bottom", "line", "area" or empty string("").
    - If "color", then parameter must be one of:
      **"black", "white", "red", "green", "blue", "yellow", "gray", "orange", "pink", "purple", "brown"**.
    - If "axis", then parameter must be "x", "y", or "all".
    - If "value", then parameter must be "x", "y", or "all" (only used when target = "tooltip").
    - If "height", "opacity", "move bottom", or "auto", then parameter must be an **empty string** ("").
    - ⚠️ If result.by is not "color", then result.parameter must not include any of:
      - "black", "white", "red", "green", "blue", "yellow", "gray", "orange", "pink", "purple", "brown".

  7. **Handling 'compare' in input**  
    - If the user input includes the word \`compare\`, assume the behavior is \`"overlap"\`, unless explicitly specified otherwise.

  8. **Rescale Behavior Expanded**
    - If \`result.behavior\` is \`"rescale"\`, then:
      - action.action can be \`"zoom"\` with action.target = \`"axis"\`
      - OR action.action can be \`"click"\` with action.target = \`"button"\` and action.parameter = \`"y"\`

  9. **Handling Insufficient Information**  
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

  10. **Handling Completely Unmatched Input**  
    - If the user input **does not match any valid interaction**, return:
      \`\`\`json
      {
          "data": [],
          "description": "Please provide more information."
      }
      \`\`\`

  11. **Description Formatting (No Extra Words!)**
   - The **description for each action-result pair must be direct and clear**.
   - The **overall description must summarize the entire interaction sequence**.
   - Example formatting:
     - ✅ \`"Clicking on two colors highlights them for comparison."\`
     - ✅ \`"Clicking the compare button removes unselected visual marks."\`
     - ✅ \`"Clicking the y-axis rescale button adjusts the axis scale."\`
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
                  "target": "button",
                  "action": "click",
                  "parameter": "y"
              },
              "result": {
                  "target": "axis",
                  "behavior": "rescale",
                  "by": "auto",
                  "parameter": "y"
              },
              "similar": false,
              "description": "Clicking the y-axis rescale button adjusts the axis scale."
          }
      ],
      "description": "To compare two colors, first select two colors by clicking on them. Then, click the compare button to remove unselected visual marks, overlap the stacked area chart, and rescale the y-axis using the rescale button."
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
    "model": "gpt-4o-mini",
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
    const response = await fetch("https://api.vveai.com/v1/chat/completions", requestOptions);
    const result = await response.json();
    console.log("result", result);
    return result.choices[0].message.content;
  } catch (error) {
      console.error("error", error);
      return "Error fetching response";
  }
}

async function validateParse(parsed_json, nl_input) {
  const token = localStorage.getItem("apiToken");

  if (!token) {
    console.error("There are no API tokens!");
    return "API Token is not set.";
  }

  // correct
  // miss info
  // not support
  // parse된 json 파일들을 검증하려고 한다.
  // input은 parse된 json들의 배열이다.
  // parse된 json들을 배열 안에서 하나씩 꺼내어 검증하도록 한다.
  
  // parse된 json은 규칙에 따라 miss info, not support, correct 세 가지 상태로 분류된다.
  // miss info 상태는 다음 두 가지에 따라 나타난다. 
  // 1. action.action, action.target, result.behavior, result.target 중 하나라도 비어 있으면 miss info로 분류한다.
  // 2. json에 parse된 action, target, behavior, parameter 등이 natural language input를 제대로 parse해주지 못한 경우 miss info로 분류한다.
  // not support 상태는 parse된 json과 맵핑되는 인터랙션이 없는 경우 해당된다.
  // correct 상태는 miss info와 not support가 아닌 경우 해당된다.
  
  // 다음은 miss info, not support, correct 상태에 따른 조치이다.
  // miss info인 경우, 
  // 1. natural language input을 바탕으로 다시 한 번 json을 파싱한다.
  // 2-1. 파싱한 결과가 여전히 miss info라면 해당 json은 제거한다. 
  // 2-2. 파싱한 결과가 not support라면 not support와 같은 방식으로 조치한다.
  // 2-3. 파싱한 결과가 correct라면 해당 json을 추가한다.

  // not support인 경우,
  // 1. 해당 json 형식에 가장 유사하면서 맵핑되는 인터랙션이 있는 json을 추가한다.
  // 2. 이때 not support를 통해 이러한 인터랙션을 추천한다는 표시를 남긴다.
  
  // correct인 경우, 그대로 사용한다.

  const prompt = `
  ### INSTRUCTION ###
  You are a validator and corrector for structured interaction JSON data, originally generated from natural language instructions.

  Your task is to:
  1. For each item in the original parsed JSON:
    - Check whether it is valid, complete, and executable.
    - Classify it as "correct", "miss info", or "not support" based on its original values (before any changes).
    
  2. Based on the classification:
    - If it is "correct": Keep it as is, and set "similar": false.
    - If it is "miss info": Attempt to regenerate the correct interaction using the original natural language input (nl_input).  
      If you cannot recover it, return a fallback item with "Please provide more information."
    - If it is "not support": You MUST revise the action or result fields to make it executable.  
      Do NOT leave it unchanged. You must generate the most semantically similar supported interaction.

  3. For each final JSON item:
    - Add the field "classification" based on the original parsed_json status.
    - Set "similar" to true only if action or result fields were modified.
    - Return the final list as a cleaned and corrected JSON object.

  ---

  ### ORIGINAL NATURAL LANGUAGE INPUT ###
  \`\`\`
  ${JSON.stringify(nl_input, null, 2)}
  \`\`\`

  ---

  ### ORIGINAL PARSED JSON ###
  \`\`\`json
  ${JSON.stringify(parsed_json, null, 2)}
  \`\`\`

  ---

  ### PART 1. STRUCTURE SCHEMA ###
  Each interaction item must follow this format:

  \`\`\`json
  {
    "action": { "target": "...", "action": "...", "parameter": "..." },
    "result": { "target": "...", "behavior": "...", "by": "...", "parameter": "..." },
    "similar": true | false,
    "description": "...",
    "classification": "miss info" | "not support" | "correct"
  }
  \`\`\`

  ---

  ### PART 2. VALIDATION RULES ###
  #### 🔁 CLASSIFICATION POLICY (VERY IMPORTANT)

  - The \`"classification"\` field must reflect the **original parsed_json item's validity**, **before any correction**.
  - The \`"similar"\` field reflects **whether the item was modified** from the original.

  | Original Status (parsed_json) | After Validation        | classification | similar |
  |-------------------------------|-------------------------|----------------|---------|
  | Valid                         | No Change               | correct        | false   |
  | Valid                         | Slightly changed        | correct        | true    |
  | Missing Info                  | Recovered or Fallback   | miss info      | true    |
  | Not Supported Combination     | Corrected               | not support    | true    |

  ---

  ### VALID ENUM VALUES ###
  You MUST only use the following values for each field.

  - action.target: "visual mark", "axis", "button"
  - action.action: "click", "double click", "right button click", "mouseover", "drag", "zoom"
  - action.parameter: "x", "y", "all", "<behavior value>", or "" (as per rules)

  - result.target: "visual mark", "axis", "tooltip"
  - result.behavior: ONLY one of:
    "remove", "rescale", "resort", "annotate", "overlap", "highlight"

  - result.by: ONLY one of:
    "height", "opacity", "color", "axis", "value", "auto", "unselected", "move bottom", "line", "area", ""

  - result.parameter: ONLY one of:
    "bar", "stacked area", "area",
    "black", "white", "red", "green", "blue", "yellow", "gray", "orange", "pink", "purple", "brown",
    "x", "y", "all", ""

  - ⚠️ If any value outside the list above is used (e.g., "select" in result.behavior), it MUST be treated as invalid and classified as "miss info".
  - NEVER invent or guess new values that are not explicitly allowed in the lists above.
  - action.target: "tooltip" is not allow

  ### VALID EXECUTABLE COMBINATIONS ###
  Only the following combinations of action and result are supported by the system:

  1. REMOVE
    - action.target = "visual mark" → result.behavior = "remove"
    - action.target = "button" + result.by = "color" or "unselected" → result.behavior = "remove"

  2. RESCALE
    - action.target = "axis", action.action = "zoom" → result.behavior = "rescale"
    - action.target = "button", action.parameter = "y" → result.behavior = "rescale"

  3. RESORT
    - result.parameter = "bar" or "stacked area"
      and result.by = "height", "opacity", "color", or "move bottom"

  4. ANNOTATE
    - result.target = "tooltip" → result.behavior = "annotate"

  5. OVERLAP
    - action.target = "button" → result.behavior = "overlap"
    - action.action = "drag" → result.behavior = "overlap"

  6. HIGHLIGHT
    - always allowed, as long as values are valid
  
  7. REENCODE
    - always action.target = "button", action.action = "click"
    - if result.by = "line", then result.parameter = "area.
    - else if result.by = "area", then result.parameter = "bar".
    
  You MUST only use combinations listed below.
  If a combination is not in the list, it is NOT supported.

  [List of allowed combinations goes here]

  DO NOT attempt to infer or invent new combinations.
  Only use those explicitly declared as executable.

  ---

  #### 🔴 MISS INFO
  - If any of these are missing or meaningless:  
    - \`action.target\`, \`action.action\`, \`result.target\`, \`result.behavior\`
  - Or the meaning contradicts the original input
  - → classification: \`"miss info"\`
  - → Try to regenerate the item using \`nl_input\`
  - → If still invalid, include the fallback:

  \`\`\`json
  {
    "action": { "target": "", "action": "", "parameter": "" },
    "result": { "target": "", "behavior": "", "by": "", "parameter": "" },
    "similar": true,
    "description": "Please provide more information.",
    "classification": "miss info"
  }
  \`\`\`

  ---

  #### 🟠 NOT SUPPORTED
  - classification: \`"not support"\`
  - If the combination is not executable in system logic:

  Unsupported combinations:
  - \`"highlight"\` → only valid when it visibly changes color or style
  - \`"annotate"\` → only works with \`result.target === "tooltip"\` and \`action.action === "mouseover"\` and \`action.target === "visual mark"\`
  - \`"rescale"\` → only valid when:
    - \`action.target === "axis"\` and \`action.action === "zoom"\`, OR
    - \`action.target === "button"\` and \`action.parameter === "y"\`
  - \`"remove"\` → only valid when:
    - \`action.target === "button"\` and \`by === "color"\` or \`"unselected"\`, OR
    - \`action.target === "visual mark"\`
  - \`"resort"\` → only for bar or stacked area charts
    - \`result.parameter\` must be \`"bar"\` or \`"stacked area"\`
    - \`by\` must be \`"height"\`, \`"opacity"\`, \`"color"\`, or \`"move bottom"\`
  - \`"overlap"\` → only valid when:
    - \`action.target === "button"\`, OR
    - \`action.action === "drag"\`

  → Revise to the closest valid version  
  → Set \`"similar": true\` but retain original classification as \`"not support"\`

  SPECIAL CASE:
  - \`"highlight"\` does NOT need any visual change to be considered valid.
    - It is always accepted by the system, so should be classified as \`"correct"\`, not \`"not support"\`.

  - If result.behavior = "rescale":
    - result.target MUST be "axis"
    - Any other target is invalid (e.g., "visual mark" or "tooltip")

  - If \`result.behavior\` is \`"remove"\`, then:
    - action.action MUST be one of:
      - "click"
      - "right button click"
      - "double click"
    - action.action CANNOT be:
      - "mouseover"
      - "drag"
      - "zoom"
  
  - If \`result.behavior\` is \`"annotate"\`, then:
    - \`result.target\` MUST be \`"tooltip"\`
    - \`action.action\` MUST be \`"mouseover"\`
    - \`action.target\` MUST be \`"visual mark"\`
    - \`action.action\` MUST not be \`"zoom"\`, \`"drag"\`, \`"click"\`, \`"right button click"\`, \`"double click"\`

  - If \`action.target\` is \`"button"\`, then:
    - \`action.action\` MUST be \`"click"\`

  - If \`result.behavior\` is \`"resort"\`, then:
    - \`action.action\` MUST be \`"click"\`

  - If \`result.behavior\` is \`"reencode"\`, then:
    - \`action.action\` MUST be \`"click"\`
    - \`action.target\` MUST be \`"button"\`
    - If \`result.by\` is \`"line"\`, then \`result.paramter\` is \`"area"\`.
    - If \`result.by\` is \`"area"\`, then \`result.parameter\` is \`"bar"\`.
  ---

  #### 🟢 CORRECT
  - classification: \`"correct"\`
  - If the item is complete, valid, and executable
  - → Keep unchanged  
  - → Set \`"similar": false\`
  - "overlap" is fully supported when:
    - action.target === "button" (e.g., compare button)
    - OR action.action === "drag"
  - The button parameter (e.g., "compare") does NOT need to match the behavior
  - by = "auto" and parameter = "" are both acceptable for overlap

  ---

  ### PART 3. OUTPUT FORMAT ###
  Return a valid JSON object like:

  \`\`\`json
  {
    "data": [
      {
        "action": {
          "target": "<corrected or verified value>",
          "action": "<corrected or verified value>",
          "parameter": "<corrected or verified value>"
        },
        "result": {
          "target": "<corrected or verified value>",
          "behavior": "<corrected or verified value>",
          "by": "<corrected or verified value>",
          "parameter": "<corrected or verified value>"
        },
        "similar": true | false,
        "description": "<clear and accurate description of interaction>"
      },
      ...
    ],
    "description": "<concise description of the full sequence>"
  }
  \`\`\`

  - Do NOT include commentary or extra text.
  - If any item could not be recovered, use the fallback JSON with \`"classification": "miss info"\` instead.
  - Never return \`"Please provide more information."\` unless it's inside the fallback description field.
  - Each \`"classification"\` must be based on the original \`parsed_json\`, NOT the corrected version.
  - when action.target is "button", then action.action MUST be "click"

  ---

  Now validate, revise, and return only the cleaned and corrected JSON.

  ### INPUT ###
  \`\`\`json
  {
    "nl_input": ${JSON.stringify(nl_input, null, 2)},
    "parsed_json": ${JSON.stringify(parsed_json, null, 2)}
  }
  \`\`\`
  `;

  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "model": "gpt-4o-mini",
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
    const response = await fetch("https://api.vveai.com/v1/chat/completions", requestOptions);
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
  } else {
    mouse_action = "click";
  }

  // console.log(action);
  // console.log(result);
  // console.log(mouse_action);
  // "behavior": ( "remove" | "rescale" | "resort" | "annotate" | "overlap" | "highlight" ),

  if(result.behavior === "reencode") {
    if(result.by === "line") {
      reencodeButton("line", "area");
      _chart_object[0].share_json.push(parsedJson);
      return true;
    } else if (result.by === "area" || result.by === "stacked area") {
      reencodeButton("area", "bar");
      _chart_object[0].share_json.push(parsedJson);
      return true;
    }
  }

  // remove area
  if(result.behavior === "remove") {
    // button create
    if(action.target === "button"){
      console.log("Create Button");
      if(result.by === "color"){
        buttonCreation({behavior: "remove", by: result.by, color: result.parameter});
        _chart_object[0].share_json.push(parsedJson);
        return true;
      } else if (result.by === "unselected"){
        buttonCreation({behavior: "remove", by: result.by});
        _chart_object[0].share_json.push(parsedJson);
        return true;
      }
    } else if(action.target === "visual mark"){
      console.log("Remove visual mark by clicking visual mark");
      _chart_object[0].CoordSys.forEach(coordSys => {
        coordSys.activate_remove_visual_object();
      });
      _chart_object[0].share_json.push(parsedJson);
      return true;
    }
  }

  // rescale
  if(result.behavior === "rescale"){
    if(result.target === "axis"){
      console.log("Rescale Axis");
      if(action.target === "button"){
        buttonCreation({behavior: "rescale", by: result.parameter});
        _chart_object[0].share_json.push(parsedJson);
        return true;
      } else if(action.target === "axis"){
        activate_axis_zoom_rescale(result.parameter);
        _chart_object[0].share_json.push(parsedJson);
        return true;
      }
    }
  }

  // resort axis by height/opacity/color - bar chart
  if(result.behavior === "resort"){
    console.log("Resort Axis");
    let sort_by;

    if(result.parameter === "bar"){
      // bar chart
      // min_value / max_value / diff / color / opacity
      if(result.by === 'height' || result.by === "value") {
        sort_by = 'min_value';
      } else if (result.by === "color" || result.by === "opacity" || result.by === "auto") {
        sort_by = result.by;
      }
      else  {
        sort_by = 'auto';
      }

      if(action.target === "button"){
        buttonCreation({behavior: "resort", by: sort_by, chart: result.parameter});
        _chart_object[0].share_json.push(parsedJson);
        return true;
      } else {
        _chart_object[0].x_axis_object_list.forEach(axis => {
          axis.activate_sort(mouse_action, sort_by, result.parameter);
        });
        _chart_object[0].share_json.push(parsedJson);
        return true;
      }
    } else if (result.parameter === "stacked area"){
      // stacked area chart
      // sort by color/opacity/height
      if(result.by === "color" || result.by === "opacity" || result.by === "height"){
        sort_by = result.by;
      } else {
        sort_by = 'height';
      }

      if(action.target === "button"){
        buttonCreation({behavior: "resort", by: sort_by, chart: result.parameter});
        _chart_object[0].share_json.push(parsedJson);
        return true;
      } else {
        if(result.by === "move bottom"){
          // move to bottom area
          console.log("Move Area");
          _chart_object[0].CoordSys.forEach(coordSys => {
            coordSys.activate_move_to_bottom();
          });
          _chart_object[0].share_json.push(parsedJson);
          return true;
        } else {
          _chart_object[0].x_axis_object_list.forEach(axis => {
            axis.activate_sort(mouse_action, sort_by, result.parameter);
          });
          _chart_object[0].share_json.push(parsedJson);
          return true;
        }
      }
    }
  }

  // annotate
  if(result.behavior === "annotate"){
    if(result.target === "tooltip") {
      console.log("Annotate Visual Mark");
      if(result.parameter){
        _chart_object[0].CoordSys.forEach(coordSys => {
          coordSys.activate_value_tooltip(result.parameter);
        });
        _chart_object[0].share_json.push(parsedJson);
        return true;
      } else {
        _chart_object[0].CoordSys.forEach(coordSys => {
          coordSys.activate_value_tooltip("all");
        });
        _chart_object[0].share_json.push(parsedJson);
        return true;
      }
    }
  }

  // overlap area
  if(result.behavior === "overlap") {
    console.log("Overlap Area");
    if(action.target === "button"){
      buttonCreation({behavior: "overlap", by: result.by});
      _chart_object[0].CoordSys.forEach(coordSys => {
        coordSys.activate_allow_overlap();
      });
      _chart_object[0].share_json.push(parsedJson);
      return true;
    } 
    if(action.action === "drag") {
      _chart_object[0].CoordSys.forEach(coordSys => {
        coordSys.activate_allow_overlap();
      });
      _chart_object[0].share_json.push(parsedJson);
      return true;
    }
  }

  // highlight
  if(result.behavior === "highlight"){
    console.log("Highlight Area");
    _chart_object[0].share_json.push(parsedJson);
    return true;
  }
  return false;
}


function buttonCreation({behavior, by, color, chart}) {
  console.log("Button Creation");

  let mainRect = document.querySelector(".mainrect");

  if (!mainRect) {
      console.error("Error: No element found with class 'mainrect'");
      return;
  }

  let button = document.querySelector(".interaction-button");

  if (!button) {
    button = document.createElement("button");
    button.className = "interaction-button";
    button.id = "interaction-button";
    button.innerText = behavior;
    button.style.left = (mainRect.getBoundingClientRect().right - 90) + "px"; // 오른쪽에 배치
    button.style.top = (mainRect.getBoundingClientRect().bottom - 50) + "px"; // 같은 높이로 정렬
    document.body.appendChild(button);
    makeDraggable(button);
  }

  if (behavior === "remove") {
    if (by === "color") {
      console.log("BUTTON - REMOVE COLOR");
      button.addEventListener("click", function () {
        _chart_object[0].CoordSys.forEach(coordSys => {
          coordSys.deactivate_visual_object(find_element_by_color(color));
        });
      });
    } else if (by === "unselected") {
      console.log("BUTTON - REMOVE UNSELECTED AREA");
      button.addEventListener("click", function () {
        _chart_object[0].CoordSys.forEach(coordSys => {
          let selected_idx = [];
          coordSys.visual_object.forEach((vo, idx) => {
            if (vo.selected === false) {
              selected_idx.push(idx);
            }
          });
          coordSys.deactivate_visual_object_group(selected_idx);
        });
      });
    }
  } else if (behavior === "resort") {
    if(chart === "bar"){
      button.addEventListener("click", function (e) {
        _chart_object[0].CoordSys[_chart_object[0].CoordSys.length - 1].x_axis.sorted_axis(e, by);
      });
    } else if (chart === "stacked area"){
      button.addEventListener("click", function () {
        _chart_object[0].CoordSys.forEach(coordSys => {
          coordSys.resort_stacked_area_chart(by);
        });
      });
    }
  } else if (behavior === "overlap") {
    button.innerText = "compare";
    button.addEventListener("click", function () {
      _chart_object[0].CoordSys.forEach(coordSys => {
        coordSys.overlap(_chart_object[0], _chart_object[0].content_group);
      });
    });
  } else if (behavior === "rescale") {
    button.addEventListener("click", function () {
      auto_change_quantitative_scale(_chart_object[0], by);
    });
  }
}

function reencodeButton(by, parameter) {
  console.log("Reencode Button Creation");

  let mainRect = document.querySelector(".mainrect");

  if (!mainRect) {
      console.error("Error: No element found with class 'mainrect'");
      return;
  }
  let button = document.querySelector(".interaction-button");

  button = document.createElement("button");
  button.className = "interaction-button";
  button.id = "interaction-button";
  button.style.width = "90px";
  button.style.height = "50px";
  button.style.left = (mainRect.getBoundingClientRect().right - 120) + "px"; // 오른쪽에 배치

  if (by === "line" && parameter === "area") {
    console.log("BUTTON - Line2Area");
    button.innerText = "Change to Area Chart";
    button.style.top = (mainRect.getBoundingClientRect().top + 60) + "px"; // 같은 높이로 정렬
    button.addEventListener("click", function () {
      re_encode_line2area(_chart_object[0])
    });
  } else if (by === "area" && parameter === "bar") {
    console.log("BUTTON - Area2Bar");
    button.innerText = "Change to Bar Chart";
    button.style.top = (mainRect.getBoundingClientRect().top + 120) + "px"; // 같은 높이로 정렬
    button.addEventListener("click", function () {
      re_encode_area2bar(_chart_object[0], 10)
    });
  }

  document.body.appendChild(button);
  makeDraggable(button);
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

function activate_axis_zoom_rescale(axis) {
  if(axis === "x"){
    _chart_object[0].x_axis_object_list[0].activate_rescale();
  } else if(axis === "y"){
    _chart_object[0].y_axis_object_list[0].activate_rescale();
  } else {
    _chart_object[0].x_axis_object_list[0].activate_rescale();
    _chart_object[0].y_axis_object_list[0].activate_rescale();
  }
}

function makeDraggable(element) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  element.addEventListener("mousedown", function (e) {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}
