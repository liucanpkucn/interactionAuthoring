import json
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 输入路径
INPUT_SIMVEC_DIR = os.path.join(BASE_DIR, "intermediate_data", "raw_simvec")
INPUT_METADATA_DIR = os.path.join(BASE_DIR, "intermediate_data", "raw_metadata")

# 输出路径
OUTPUT_SIMVEC_DIR = os.path.join(BASE_DIR, "intermediate_data", "cleaned_simvec")
OUTPUT_METADATA_DIR = os.path.join(BASE_DIR, "output_data", "cleaned_metadata")

# 确保输出目录存在
os.makedirs(OUTPUT_SIMVEC_DIR, exist_ok=True)
os.makedirs(OUTPUT_METADATA_DIR, exist_ok=True)


def normalize_text_content(text: str) -> str:
    text = text.replace(" ", "_").replace("\u2212", "-").replace(",", "")
    text = re.sub(r"[^\w.-]", "", text)
    return text.lower()


def process_simvec_data():
    """ 处理 SimVec 文件（从文本转换为 JSON）"""
    for filename in os.listdir(INPUT_SIMVEC_DIR):
        if not filename.endswith(".txt"):
            continue

        input_path = os.path.join(INPUT_SIMVEC_DIR, filename)
        output_path = os.path.join(OUTPUT_SIMVEC_DIR, filename.replace(".txt", ".json"))

        data = {"rect": [], "text": [], "circle": [], "line": [], "area": []}

        with open(input_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

            for line in lines:
                line = line.strip()

                if line.startswith("rect "):
                    _, color, position_str = line.split(" ", 2)
                    position = json.loads(position_str)
                    if color != "None":
                        data["rect"].append({"color": color, "position": position})

                elif line.startswith("text "):
                    _, content, position_str = line.split(" ", 2)
                    normalized_content = normalize_text_content(content)
                    position = json.loads(position_str)
                    data["text"].append({"content": normalized_content, "position": position})

                elif line.startswith("circle "):
                    _, color, position_str = line.split(" ", 2)
                    position = json.loads(position_str)
                    data["circle"].append({"color": color, "position": position})

                elif line.startswith("line "):
                    _, color, points_str = line.split(" ", 2)
                    points = [
                        [int(coords[0]), int(coords[1])]
                        for p in points_str.split(';')
                        if (coords := p.split(',')) and len(coords) == 2 and coords[0] != "NaN" and coords[1] != "NaN"
                    ]
                    if points:
                        data["line"].append({"color": color, "points": points})

                elif line.startswith("area "):
                    _, color, points_str = line.split(" ", 2)
                    points = [
                        [int(coords[0]), int(coords[1])]
                        for p in points_str.split(';')
                        if (coords := p.split(',')) and len(coords) == 2 and coords[0] != "NaN" and coords[1] != "NaN"
                    ]
                    if points:
                        data["area"].append({"color": color, "points": points})

        with open(output_path, "w", encoding="utf-8") as f_out:
            json.dump(data, f_out, indent=2)

    print("SimVec processing completed.")
    return True

def process_metadata_data():
    """ 处理 Metadata 文件，并补全缺失数据 """
    for filename in os.listdir(INPUT_METADATA_DIR):
        if not filename.endswith(".json"):
            continue

        metadata_path = os.path.join(INPUT_METADATA_DIR, filename)
        simvec_path = os.path.join(OUTPUT_SIMVEC_DIR, filename)
        output_metadata_path = os.path.join(OUTPUT_METADATA_DIR, filename)

        if not os.path.exists(simvec_path):
            print(f"Skipping {filename}, no corresponding SimVec file found.")
            continue

        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        with open(simvec_path, "r", encoding="utf-8") as f:
            simvec_data = json.load(f)

        for axis in ["x", "y"]:
            if axis in metadata and isinstance(metadata[axis], dict):
                metadata[axis] = [metadata[axis]]  # 转换为列表形式

        # 补全 tick 位置
        for axis in ["x", "y"]:
            for axis_item in metadata[axis]: 
                if "tick" in axis_item:
                    # 仅保留匹配成功的 tick
                    valid_ticks = []

                    for tick in axis_item["tick"]:
                        normalized_tick_content = normalize_text_content(tick["content"])

                        for text_item in simvec_data["text"]:
                            if normalized_tick_content == text_item["content"]:
                                tick["position"] = {
                                    "x": text_item["position"][0],
                                    "y": text_item["position"][1]
                                }
                                valid_ticks.append(tick)  
                                break  

                    # 仅保留匹配成功的 tick
                    axis_item["tick"] = valid_ticks


        # 补全 range
        for axis in ["x", "y"]:
            for axis_item in metadata[axis]:
                if "range" in axis_item:
                    axis_item["range"]["begin"] = "wait"
                    axis_item["range"]["end"] = "wait"

                    tick_positions = [
                        tick["position"]["x"] if axis == "x" else tick["position"]["y"]
                        for tick in axis_item["tick"] if tick["position"]["x"] != "wait"
                    ]
                    if tick_positions:
                        axis_item["range"]["begin"] = min(tick_positions)
                        axis_item["range"]["end"] = max(tick_positions)

        # 补全 fixed_distance
        for axis in ["x", "y"]:
            for axis_item in metadata[axis]:
                if "fixed_distance" in axis_item:
                    axis_item["fixed_distance"] = "wait"
                    tick_positions = sorted([
                        tick["position"]["x"] if axis == "x" else tick["position"]["y"]
                        for tick in axis_item["tick"] if tick["position"]["x"] != "wait"
                    ])
                    if len(tick_positions) > 1:
                        distances = [
                            tick_positions[i + 1] - tick_positions[i]
                            for i in range(len(tick_positions) - 1)
                        ]
                        if distances:
                            axis_item["fixed_distance"] = sum(distances) / len(distances)

        # 保存
        print(f"Processed metadata for {filename}")
        with open(output_metadata_path, "w", encoding="utf-8") as f_out:
            json.dump(metadata, f_out, indent=2)

    print("Metadata processing completed.")
    return True

