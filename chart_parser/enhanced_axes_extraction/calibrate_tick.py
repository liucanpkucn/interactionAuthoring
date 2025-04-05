import os
import json

BASEDIR = os.path.dirname(os.path.abspath(__file__))

# 固定路径
METADATA_PATH = os.path.join(BASEDIR, "output_data", "cleaned_metadata", "test.json")
FULL_JSON_PATH = os.path.join(BASEDIR, "intermediate_data", "full.json")
LINE_PATH = os.path.join(BASEDIR, "intermediate_data", "lines", "line.json")
TOLERANCE = 10  # 容差范围


def calibrate_tick_positions():
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    with open(FULL_JSON_PATH, "r", encoding="utf-8") as f:
        full_data = json.load(f)
    # 筛选出 full.json 里的所有 text 元素
    full_texts = [
        item for item in full_data.get("rects", [])
        if item.get("type") == "text"
    ]

    with open(LINE_PATH, "r", encoding="utf-8") as f:
        lines = json.load(f)
    vertical_lines = [line for line in lines if round(line["x1"]) == round(line["x2"])]
    horizontal_lines = [line for line in lines if round(line["y1"]) == round(line["y2"])]

    # === 第一步：用 full.json 中的文字位置校准 tick 的中心坐标 ===
    def find_center(content: str):
        for text in full_texts:
            if text.get("content") == content:
                x = text.get("x", 0)
                y = text.get("y", 0)
                w = text.get("width", 0)
                h = text.get("height", 0)
                return {
                    "x": round(x + w / 2),
                    "y": round(y + h / 2)
                }
        return None

    for axis in ["x", "y"]:
        if axis in metadata:
            for axis_item in metadata[axis]:
                if "tick" in axis_item:
                    for tick in axis_item["tick"]:
                        content = tick.get("content")
                        center = find_center(content)
                        if center:
                            tick["position"] = center

    # === 第二步：用 line.json 的竖线和横线进一步吸附坐标 ===
    for axis in ["x", "y"]:
        if axis in metadata:
            for axis_item in metadata[axis]:
                if "tick" in axis_item:
                    for tick in axis_item["tick"]:
                        pos = tick.get("position", {})
                        if axis == "x":
                            tick_x = pos.get("x")
                            for line in vertical_lines:
                                if abs(tick_x - line["x1"]) <= TOLERANCE:
                                    tick["position"]["x"] = round(line["x1"])
                                    break
                        else:  # axis == "y"
                            tick_y = pos.get("y")
                            for line in horizontal_lines:
                                if abs(tick_y - line["y1"]) <= TOLERANCE:
                                    tick["position"]["y"] = round(line["y1"])
                                    break

    # === 写回 JSON 文件 ===                 
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("Tick positions calibrated and saved.")


if __name__ == "__main__":
    calibrate_tick_positions()
