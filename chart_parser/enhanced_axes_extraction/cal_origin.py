import os
import json
import math

# 统一路径起点为当前脚本所在目录
BASEDIR = os.path.dirname(os.path.abspath(__file__))

def calculate_origin() -> dict:
    line_path = os.path.join(BASEDIR, "intermediate_data", "lines", "line.json")
    meta_path = os.path.join(BASEDIR, "output_data", "cleaned_metadata", "test.json")

    # 加载数据
    if not os.path.exists(line_path) or not os.path.exists(meta_path):
        raise FileNotFoundError("line.json 或 test.json 不存在")

    with open(line_path, "r") as f:
        lines = json.load(f)

    with open(meta_path, "r") as f:
        metadata = json.load(f)

    # 获取 y=0 对应的文字位置
    y_ticks = metadata.get("y", [])[0]["tick"]
    y0_tick = next((tick for tick in y_ticks if tick["content"] == "0"), y_ticks[0])
    text_x = y0_tick["position"]["x"]
    text_y = y0_tick["position"]["y"]

    # 提取水平线和竖直线
    horizontal_lines = [line for line in lines if abs(line["y1"] - line["y2"]) < 1e-2]
    vertical_lines = [line for line in lines if abs(line["x1"] - line["x2"]) < 1e-2]

    def closest_endpoint(line, ref_x, ref_y):
        d1 = math.hypot(line["x1"] - ref_x, line["y1"] - ref_y)
        d2 = math.hypot(line["x2"] - ref_x, line["y2"] - ref_y)
        return (d1, (line["x1"], line["y1"])) if d1 < d2 else (d2, (line["x2"], line["y2"]))

    hline_dist, hline_point = min(
        (closest_endpoint(line, text_x, text_y) for line in horizontal_lines),
        default=(float("inf"), None),
    )
    vline_dist, vline_point = min(
        (closest_endpoint(line, text_x, text_y) for line in vertical_lines),
        default=(float("inf"), None),
    )

    # 判断原点
    origin = None
    threshold = 20

    if hline_point and vline_point:
        dist_between = math.hypot(hline_point[0] - vline_point[0], hline_point[1] - vline_point[1])
        if dist_between < threshold:
            origin = {
                "x": round((hline_point[0] + vline_point[0]) / 2, 2),
                "y": round((hline_point[1] + vline_point[1]) / 2, 2),
            }
        elif hline_dist < vline_dist and hline_dist < threshold:
            origin = {"x": round(hline_point[0], 2), "y": round(hline_point[1], 2)}
        elif vline_dist < hline_dist and vline_dist < threshold:
            origin = {"x": round(vline_point[0], 2), "y": round(vline_point[1], 2)}
    elif hline_point and hline_dist < threshold:
        origin = {"x": round(hline_point[0], 2), "y": round(hline_point[1], 2)}
    elif vline_point and vline_dist < threshold:
        origin = {"x": round(vline_point[0], 2), "y": round(vline_point[1], 2)}

    return origin if origin else {}

if __name__ == "__main__":
    result = calculate_origin()
    if result:
        print("Estimated origin:", result)
    else:
        print("Origin not found.")
