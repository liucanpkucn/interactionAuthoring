# -*- coding: UTF-8 -*-
import subprocess
import json
import os
import bs4
from enhanced_axes_extraction.classify_element import classify_simvec
from enhanced_axes_extraction.get_metadata import convert_svg_to_png
from utils import pprint

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PARSE_TMP_DIR = "parse_tmp"
if not os.path.isdir(PARSE_TMP_DIR):
    os.mkdir(PARSE_TMP_DIR)

SVG_INPUT_PATH = os.path.join(BASE_DIR, f"{PARSE_TMP_DIR}/js_temp_svg.svg")
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, f"{PARSE_TMP_DIR}/svg_parse.json")
PNG_OUTPUT_PATH = os.path.join(BASE_DIR, f"{PARSE_TMP_DIR}/js_temp_svg.png")

def parse_unknown_svg_visual_elements(svg_string):
    """
    调用 JavaScript 代码解析 SVG 并返回解析结果。
    """
    os.makedirs(os.path.dirname(SVG_INPUT_PATH), exist_ok=True)

    with open(SVG_INPUT_PATH, "w", encoding="utf-8") as f:
        f.write(svg_string)
    
    convert_svg_to_png(SVG_INPUT_PATH,PNG_OUTPUT_PATH)

    script_path = os.path.join(BASE_DIR, "parse_svg_x.js")
    if not os.path.exists(script_path):
        raise FileNotFoundError(f"找不到 JavaScript 文件: {script_path}")

    try:
        subprocess.run(["node", script_path], check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"JavaScript 解析 SVG 失败: {e}")

    if not os.path.exists(JSON_OUTPUT_PATH):
        raise FileNotFoundError(f"找不到 JSON 解析结果文件: {JSON_OUTPUT_PATH}")

    with open(JSON_OUTPUT_PATH, "r", encoding="utf-8") as f:
        chart_info = json.load(f)
        
    new_svg_string = chart_info['svg_string']

    #调用classify_element.py中的函数
    # 提取 SimVec 数据并调用 classify_simvec
    simvec_data = chart_info.get("sim_vector", "")
    if not simvec_data:
        raise ValueError("未找到有效的 SimVec 数据")

    classified_data = classify_simvec(simvec_data, PNG_OUTPUT_PATH)

    # 创建vid到role的映射字典
    vid_to_role = {}
    for item in classified_data:
        for category, vids in item.items():
            if category == "legend":
                for subcategory, subvids in vids.items():
                    vid_to_role.update({vid: subcategory for vid in subvids})
            else:
                vid_to_role.update({vid: category for vid in vids})

    # 更新rects中的每个元素，添加role字段
    for rect in chart_info.get("rects", []):
        vid = rect.get("vid")
        rect["role"] = vid_to_role.get(vid, "other")

    rects_attr = chart_info.get("rects", [])
    width = chart_info.get("width", 1000)
    height = chart_info.get("height", 1000)

    soup = bs4.BeautifulSoup(new_svg_string, "html5lib")
    svg = soup.select_one("svg")

    pprint(rects_attr)
    return rects_attr, width, height, svg

