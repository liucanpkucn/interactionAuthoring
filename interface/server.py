from flask import Flask, request, jsonify
from flask_cors import CORS  # CORS 해결을 위한 모듈 추가
import os
import json

app = Flask(__name__)

# 🔹 CORS 설정 적용 (모든 도메인 허용)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

SAVE_FOLDERS = {
    "chart": "interface/shared/chart",
    "image": "interface/shared/image",
    "interaction": "interface/shared/interaction"
}

# 폴더가 없으면 생성
for folder in SAVE_FOLDERS.values():
    os.makedirs(folder, exist_ok=True)

@app.route("/check-json/<folder>/<title>", methods=["OPTIONS", "GET"])
def check_json(folder, title):
    if request.method == "OPTIONS":
        return _build_cors_prelight_response()

    if folder not in SAVE_FOLDERS:
        return _build_cors_actual_response(jsonify({"error": "Invalid folder"}), 400)
    
    file_path = os.path.join(SAVE_FOLDERS[folder], f"{title}.json")
    if os.path.exists(file_path):
        return _build_cors_actual_response(jsonify({"exists": True, "message": "이미 존재하는 파일입니다."}), 409)
    return _build_cors_actual_response(jsonify({"exists": False}))

@app.route("/save-json", methods=["OPTIONS", "POST"])
def save_json():
    if request.method == "OPTIONS":
        return _build_cors_prelight_response()

    data = request.json
    title = data.get("title")
    content = data.get("data")
    folder_type = data.get("type")

    if not title or not content or folder_type not in SAVE_FOLDERS:
        return _build_cors_actual_response(jsonify({"error": "Missing parameters"}), 400)

    file_path = os.path.join(SAVE_FOLDERS[folder_type], f"{title}.json")

    if os.path.exists(file_path):
        return _build_cors_actual_response(jsonify({"error": "파일이 이미 존재합니다."}), 409)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

    return _build_cors_actual_response(jsonify({"message": f"저장 완료: {file_path}"}))

@app.route("/save-svg", methods=["OPTIONS", "POST"])
def save_svg():
    if request.method == "OPTIONS":
        return _build_cors_prelight_response()

    data = request.json
    title = data.get("title")
    svg_data = data.get("svgData")

    if not title or not svg_data:
        return _build_cors_actual_response(jsonify({"error": "Missing parameters"}), 400)

    file_path = os.path.join(SAVE_FOLDERS["image"], f"{title}.svg")

    if os.path.exists(file_path):
        return _build_cors_actual_response(jsonify({"error": "파일이 이미 존재합니다."}), 409)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(svg_data)

    return _build_cors_actual_response(jsonify({"message": f"SVG 저장 완료: {file_path}"}))

@app.route("/get-chart-files", methods=["GET"])
def get_chart_files():
    chart_folder = "interface/shared/chart"
    shared_list_path = "interface/shared/shared_list.txt"

    if not os.path.exists(chart_folder):
        return jsonify({"error": "Chart folder not found"}), 404

    files = os.listdir(chart_folder)

    # 🔹 기존 shared_list.txt의 내용과 비교하여 다를 때만 업데이트
    if os.path.exists(shared_list_path):
        with open(shared_list_path, "r", encoding="utf-8") as f:
            existing_files = f.read().splitlines()

        if set(existing_files) == set(files):
            return jsonify({"files": files})  # 파일 변경이 없으면 덮어쓰지 않고 반환

    # 🔹 파일 목록이 변경되었을 때만 shared_list.txt 업데이트
    with open(shared_list_path, "w", encoding="utf-8") as f:
        for file in files:
            f.write(file + "\n")

    return jsonify({"files": files})



# ** Preflight 요청 (`OPTIONS`) 처리 **
def _build_cors_prelight_response():
    response = jsonify({"message": "CORS preflight OK"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


# ** 실제 CORS 응답 설정 **
def _build_cors_actual_response(response, status_code=200):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, status_code


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
