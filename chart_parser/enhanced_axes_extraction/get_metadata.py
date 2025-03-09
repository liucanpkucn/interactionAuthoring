from openai import OpenAI
import base64
import json
import os
import cairosvg


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_PATH = os.path.join(BASE_DIR, "test_image.png")

SVG_PATH = os.path.join(BASE_DIR, "input_data", "test.svg")
PNG_OUTPUT_PATH = os.path.join(BASE_DIR, "test_image.png")

import re
import cairosvg

import re
import cairosvg

def convert_svg_to_png():
    """将 SVG 文件转换为 PNG 图像"""
    try:
        with open(SVG_PATH, "r", encoding="utf-8") as svg_file:
            svg_content = svg_file.read()

        # 添加白色背景矩形（推荐，最稳定）
        svg_content = svg_content.replace(
            "<svg",
            '<svg><rect x="0" y="0" width="100%" height="100%" fill="white"/>',
        )

        # 转换 SVG 到 PNG（指定输出尺寸）
        png_data = cairosvg.svg2png(
            bytestring=svg_content.encode('utf-8'),
            output_width=2000,   # 强制指定输出宽度
            output_height=1500   # 强制指定输出高度
        )

        with open(PNG_OUTPUT_PATH, "wb") as png_file:
            png_file.write(png_data)

        print(f"SVG successfully converted to PNG: {PNG_OUTPUT_PATH}")
        return PNG_OUTPUT_PATH

    except Exception as e:
        print(f"Error during SVG to PNG conversion: {e}")
        return None





def clean_openai_json(response_text):
    """Clean OpenAI JSON response by removing Markdown formatting and extra whitespace."""
    # 去掉 Markdown 代码块标记 ```json ... ```
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    response_text = response_text.strip()
    response_text = response_text.replace("\n", "").replace("\t", "").strip()

    # 解析 JSON 并返回
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"Error decoding OpenAI JSON response: {e}")
        return None

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def process_metadata(api_key):
    convert_svg_to_png()
    client = OpenAI(api_key=api_key)
    base64_image = encode_image(IMAGE_PATH)

    text_input = '''
    **【Task Description】**
You are a professional data visualization analyst. Output the details in JSON format following the template given, do not use python, do not forget origin text like 0,YOU need to be very careful to ensure every tick is included 


### **【JSON Template】**

Please strictly follow the JSON format below for output:

{
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
      ]
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
      ]
    }
}


------

### **【Rules Explanation】**

1. **"type"**: Specifies the type of the axis:
   - "x" represents the X-axis.
   - "y" represents the Y-axis.
2. **"main"**:
   - If the **chart is vertical** (e.g., **Bar Chart**), the X-axis is the base ("main": true), and the Y-axis is the numerical axis ("main": false).
   - If the **chart is horizontal** (e.g., **Horizontal Bar Chart**), the Y-axis is the base ("main": true), and the X-axis is the numerical axis ("main": false).
3. **"attr_type"**:
   - "Quantitative": The axis represents **quantitative (numerical) data**.(e.g., population, sales, height, temperature, or any other real-valued numerical measurement)
   - "Categorical": The axis represents **categorical (discrete) data**. Years (e.g., 2020, 2021, 2022, etc.) should always be treated as categorical variables, as they represent distinct labels rather than a continuous numerical scale.
4. **"fixed_distance"**: This field should always be "wait", indicating that the spacing between ticks will be calculated later.
5. **"range"**:
   - "begin": "wait"
   - "end": "wait"
   - These values represent the starting and ending coordinates of the axis and should always be "wait".
6. **"tick"**: Stores all tick marks on the axis:
   - **"position"**: The coordinate position of the tick mark (both "x" and "y" should always be "wait").
   - **"content"**: The textual label of the tick mark (e.g., "Jan", "Feb", etc.).
    
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
        return True
    else:
        print("Failed to parse metadata from OpenAI response")
        return False