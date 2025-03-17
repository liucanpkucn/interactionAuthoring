from openai import OpenAI
import base64
import json
import os
from playwright.sync_api import sync_playwright
from utils import pprint

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_PATH = os.path.join(BASE_DIR, os.pardir, "parse_tmp", "js_temp_svg.png")

SVG_PATH = os.path.join(BASE_DIR, "input_data", "test.svg")
PNG_OUTPUT_PATH = os.path.join(BASE_DIR, "test_image.png")

import base64
from playwright.sync_api import sync_playwright
import re

def convert_svg_to_png(path_to_svg, output_path):
    print("Converting SVG to PNG...")
    """使用 Playwright 打开 SVG 并截图为 PNG 图像"""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            with open(path_to_svg, "r", encoding="utf-8") as svg_file:
                svg_content = svg_file.read()

            svg_content = re.sub(r'viewBox="([\d.,]+)"', 
                     lambda m: f'viewBox="{m.group(1).replace(",", " ")}"', 
                     svg_content)
            
            # 使用正则表达式精准提取 width 和 height
            width_match = re.search(r'width\s*=\s*["\']?([\d.]+)', svg_content)
            height_match = re.search(r'height\s*=\s*["\']?([\d.]+)', svg_content)
            viewbox_match = re.search(r'viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"', svg_content)

            # 提取尺寸并设置默认值
            if width_match and height_match:
                width, height = float(width_match.group(1)), float(height_match.group(1))
            elif viewbox_match:
                _, _, width, height = map(float, viewbox_match.groups())
            else:
                width, height = 1000, 750  # 默认尺寸

            # 替换或添加 viewBox，确保尺寸一致
            if viewbox_match:
                svg_content = re.sub(r'viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"',
                                     f'viewBox="0 0 {width} {height}"', svg_content)
            else:
                svg_content = svg_content.replace(
                    "<svg", f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}"'
                )

            # 清除 transform_matrix 的偏移
            svg_content = re.sub(r'transform_matrix="{.*?}"', 'transform_matrix="{a:1,b:0,c:0,d:1,e:0,f:0}"', svg_content)

            svg_base64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
            data_url = f"data:image/svg+xml;base64,{svg_base64}"

            # 加载 SVG 
            page.set_content(f'<img src="{data_url}" style="background-color: white;"/>')
            page.wait_for_timeout(1000)

            # 动态设置 clip 参数，确保截图完整
            page.screenshot(path=output_path, clip={"x": 0, "y": 0, "width": width, "height": height + 50})
            browser.close()

        print(f"SVG successfully converted to PNG: {output_path}")
        return output_path

    except Exception as e:
        print(f"Error during SVG to PNG conversion: {e}")
        return None

def clean_openai_json(response_text):
    """Clean OpenAI JSON response by removing Markdown formatting and extra whitespace."""
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    response_text = response_text.strip()
    response_text = response_text.replace("\n", "").replace("\t", "").strip()

    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"Error decoding OpenAI JSON response: {e}")
        return None

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def process_metadata(api_key):
    # convert_svg_to_png(SVG_PATH,PNG_OUTPUT_PATH)
    client = OpenAI(api_key=api_key)
    base64_image = encode_image(IMAGE_PATH)

    text_input = '''
    **【Task Description】**
You are a professional data visualization analyst. Output the details in JSON format following the template given, do not use python, do not forget origin text like 0,YOU need to be very careful to ensure every tick is included 


### **【JSON Template】**

Please strictly follow the JSON format below for output:

{
  "chart_type": "bar_chart",
  "base_axis": "x",
  "legend": {
    "labels": ["Male", "Female"],
    "colors": ["#f2c116", "#0057e7"]
  },
  "x":  
    {
      "type": "x",
      "main": true,  
      "attr_type": "Categorical",  
      "fixed_distance": "wait",  
      "range": { 
        "begin": "wait",
        "end": "wait"
      },
      "tick": [
        {
          "position": { "x": "wait", "y": "wait" },
          "content": "Apr"
        },
        {
          "position": { "x": "wait", "y": "wait" },
          "content": "May"
        }
      ],
      "is_base": true,
      "base_direction": "up"
    },
  "y":  
    {
      "type": "y",
      "main": false,  
      "attr_type": "Categorical",  
      "fixed_distance": "wait",  
      "range": { 
        "begin": "wait",
        "end": "wait"
      },
      "tick": [
        {
          "position": { "x": "wait", "y": "wait" },
          "content": "Low"
        },
        {
          "position": { "x": "wait", "y": "wait" },
          "content": "High"
        }
      ],
      "is_base": false,
      "base_direction": none
    }
}


------

### **【Rules Explanation】**
"chart_type": Specifies the type of chart (e.g.,"bar_chart", "stack_bar_chart", "group_bar_chart", "line_chart", "scatter_chart, ""area_chart","pie_chart").
if a bar chart is neither stacked nor grouped, use "bar_chart".
"base_axis": "x" or "y", The base axis in a chart is the reference axis.
"legend": Contains the labels and colors of the chart elements.
YOU MUST first identify if there is a legned! If the chart has no legend, make sure to include an empty list for both "labels" and "colors".
rather than use the example "labels": ["Male", "Female"],"colors": ["#f2c116", "#0057e7"]
 
1. **"type"**: Specifies the type of the axis:
   - "x" represents the X-axis.
   - "y" represents the Y-axis.
2. **"main"**:
   - If the **chart is vertical** (e.g., **Bar Chart**), the X-axis is the base ("main": true), and the Y-axis is the numerical axis ("main": false).
   - If the **chart is horizontal** (e.g., **Horizontal Bar Chart**), the Y-axis is the base ("main": true), and the X-axis is the numerical axis ("main": false).
3. **"attr_type"**:
   - "Time": The axis represents time-based data. This includes calendar dates (e.g., 2020, 2021, 2022), months (e.g., Jan, Feb, Mar), or other chronological indicators that follow a sequential order. Use "Time" for data points that inherently represent time progression, even if they appear as discrete labels.
   - "Quantitative": The axis represents **quantitative (numerical) data**.(e.g., population, sales, height, temperature, or any other real-valued numerical measurement)
   - "Categorical": The axis represents **non-time-based categorical (discrete) data**. 
  
4. **"fixed_distance"**: This field should always be "wait", indicating that the spacing between ticks will be calculated later.
5. **"range"**:
   - "begin": "wait"
   - "end": "wait"
   - These values represent the starting and ending coordinates of the axis and should always be "wait".
6. **"tick"**: Stores all tick marks on the axis:
   - **"position"**: The coordinate position of the tick mark (both "x" and "y" should always be "wait").
   - **"content"**: The textual label of the tick mark (e.g., "Jan", "Feb", etc.).
   "is_base":
7. **"is_base"**:
true → The axis where the chart elements start (e.g., vertical bar chart → X-axis is true).
false → The axis where values extend (e.g., vertical bar chart → Y-axis is false).
8. **"base_direction"**: 
  "up" → Elements extend upward.
  "down" → Elements extend downward.
  "right" → Elements extend rightward.
  "left" → Elements extend leftward.
  none → Use the null value none (not the string "none") when the axis is not the base axis (i.e., "is_base": false).
'''

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": text_input},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                ],
            }
        ],
    )

    metadata_json_str = response.choices[0].message.content
    metadata_dict = clean_openai_json(metadata_json_str)

    if metadata_dict:
        output_file = os.path.join(BASE_DIR, "intermediate_data", "raw_metadata", "test.json")
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(metadata_dict, f, indent=2)
        print(f"Metadata saved to {output_file}")
        print("Metadata extraction completed")
        return True
    else:
        print("Failed to parse metadata from OpenAI response")
        return False
