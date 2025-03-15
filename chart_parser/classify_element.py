import base64
import json
import os
from openai import OpenAI

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def clean_openai_json(response_text):
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    
    response_text = response_text.strip().replace("\n", "").replace("\t", "").strip()
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"Error decoding OpenAI JSON response: {e}")
        return None

def classify_simvec(simvec,path_to_image):
    with open("enhanced_axes_extraction/api_key.txt", "r") as f:
        api_key = f.read().strip()
        
    base64_image = encode_image(path_to_image)

    text_input = f'''
    **【Task Description】**
    You are a professional data visualization analyst. Classify the elements from the given SimVec data into four categories:

    - **axis_text**: Text elements representing axis labels or tick marks.
    - **title_text**: Text elements representing the chart title.
    - **data_encoded**: Elements representing primary data points (e.g., bars in a bar chart).
    - **legend**: Dictionary with two keys: `legend-graphic` (visual markers for legend) and `legend text` (legend descriptions).
    - **other**: Any other elements not fitting the above categories.

    Return the result in the following JSON format:

    [
        {{ "axis_text": [1, 2, 4] }},
        {{ "title_text": [3, 5, 6] }},
        {{ "data_encoded": [7, 8, 9] }},
        {{ "legend": {{ "legend-graphic": [10, 11], "legend text": [12, 13] }} }}
        {{ "other": [0, 14, 15, 16] }}
    ]

    where the numbers represent the index of the element in the SimVec data.
    make sure all simvec elements are classified
    SimVec data:
    "{simvec}"
    '''

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
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

    return metadata_dict if metadata_dict else "Failed to classify SimVec elements"

if __name__ == "__main__":
    
    simvec_example = "13 rect (0, 0, 0) [-10,-10,674,324]|0 rect (69, 169, 160) [0,0,800,450]|12 rect (0, 0, 0) [0,0,654,304]|1 rect (0, 0, 0) [85,74,698,379]|2 rect (255, 255, 255) [100,180,51,196]|3 rect (255, 255, 255) [163,298,51,78]|4 rect (255, 255, 255) [227,222,51,154]|5 rect (255, 255, 255) [291,205,51,171]|6 rect (255, 255, 255) [355,169,51,207]|7 rect (255, 255, 255) [418,202,51,174]|8 rect (255, 255, 255) [482,167,51,209]|9 rect (255, 255, 255) [546,175,51,201]|10 rect (255, 255, 255) [610,213,51,163]|11 rect (255, 255, 255) [673,120,51,256]|14 text Output [388,406,48,18]|17 text Jan [116,382,19,14]|18 text Feb [179,382,21,14]|19 text Mar [242,382,21,14]|20 text Apr [307,382,20,14]|21 text May [369,382,23,14]|22 text Jun [434,382,19,14]|23 text Jul [500,382,15,14]|24 text Aug [560,382,22,14]|25 text Sep [624,382,21,14]|26 text Oct [689,382,19,14]|27 text 0 [69,371,7,14]|28 text 10K [55,321,22,14]|29 text 20K [55,270,22,14]|30 text 30K [55,220,22,14]|31 text 40K [55,170,22,14]|32 text 50K [55,119,22,14]|33 text 60K [55,69,22,14]|34 text Panel_Output [328,28,140,27]|35 line [255,255,255] (NaN, NaN);(NaN, NaN)"
    path_to_image = "enhanced_axes_extraction/test_image.png"
    
    result = classify_simvec(simvec_example,path_to_image)
    print(json.dumps(result, indent=2))