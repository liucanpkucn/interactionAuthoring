import os
import subprocess
import json
from enhanced_axes_extraction.data_formatter import process_simvec_data,process_metadata_data
from enhanced_axes_extraction.get_metadata import process_metadata
from enhanced_axes_extraction.cal_origin import calculate_origin
from enhanced_axes_extraction.calibrate_tick import calibrate_tick_positions

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARSE_SCRIPT = os.path.join(BASE_DIR, "parse_svg_x.js")
INTERMEDIATE_DIR = os.path.join(BASE_DIR, "intermediate_data")
INPUT_DIR = os.path.join(BASE_DIR, "input_data")
OUTPUT_METADATA_DIR = os.path.join(BASE_DIR, "output_data", "cleaned_metadata")
SVG_FILE = os.path.join(INPUT_DIR, "test.svg")

def save_svg(svg_string):
    with open(SVG_FILE, "w", encoding="utf-8") as f:
        f.write(svg_string)

def run_node_script(script_path):
    result = subprocess.run(["node", script_path], cwd=BASE_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Node.js parsing failed: {result.stderr}")
        return None
    print("Node.js parsing completed")
    return True

def load_axes_array():
    output_file = os.path.join(OUTPUT_METADATA_DIR, "test.json")
    if not os.path.exists(output_file):
        print("axes_array.json not found")
        return {"x": [], "y": []}

    with open(output_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("DEBUG: load_axes_array() output =", type(data), data)
    return data


def run_enhanced_extraction(svg_string, api_key):
    print("Starting enhanced axes extraction...")

    save_svg(svg_string)

    print("Step 1: Running Node.js script...")
    if not run_node_script(PARSE_SCRIPT):
        print("ERROR: Node.js script failed.")
        return None

    print("Step 2: Processing SimVec data...")
    if not process_simvec_data():
        print("ERROR: SimVec processing failed")
        return None
    
    print("Step 3: Processing metadata with API key...")
    if not process_metadata(api_key):
        print("ERROR: Metadata extraction failed")
        return None
    
    print("Step 4: Processing cleaned metadata...")
    if not process_metadata_data():
        print("ERROR: Metadata processing failed")
        return None
    
    print("Step 5: Calculating origin position...")
    try:
        origin = calculate_origin()
        output_path = os.path.join(BASE_DIR, "output_data", "origin", "origin.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(origin, f, indent=2)
        print(f"Origin saved to {output_path}: {origin}")
    except Exception as e:

        print(f"ERROR: Origin calculation failed - {e}")
        return None
    
    print("Step 6:Calibrating tick positions...")
    try:
        calibrate_tick_positions()
        print("Tick calibration completed")
    except Exception as e:
        print(f"ERROR: Tick calibration failed - {e}")
        return None


    print("Step 7: Loading axes array...")
    axes_array = load_axes_array()
    if axes_array:
        print("Enhanced axes extraction completed")
    else:
        print("Enhanced axes extraction failed")

    return axes_array
