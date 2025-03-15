# -*- coding: UTF-8 -*-
import subprocess
import json
import os
import bs4

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PARSE_TMP_DIR = "parse_tmp"
if not os.path.isdir(PARSE_TMP_DIR):
    os.mkdir(PARSE_TMP_DIR)

SVG_INPUT_PATH = os.path.join(BASE_DIR, f"{PARSE_TMP_DIR}/js_temp_svg.svg")
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, f"{PARSE_TMP_DIR}/svg_parse.json")

def parse_unknown_svg_visual_elements(svg_string):
    """
    调用 JavaScript 代码解析 SVG 并返回解析结果。
    """
    os.makedirs(os.path.dirname(SVG_INPUT_PATH), exist_ok=True)

    with open(SVG_INPUT_PATH, "w", encoding="utf-8") as f:
        f.write(svg_string)

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
        data = json.load(f)

    rects_attr = data.get("rects", [])
    width = data.get("width", 1000)
    height = data.get("height", 1000)

    soup = bs4.BeautifulSoup(svg_string, "html5lib")
    svg = soup.select_one("svg")

    
    

    return rects_attr, width, height, svg

