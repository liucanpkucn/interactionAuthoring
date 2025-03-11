import os
from datetime import datetime

def pprint(*args, file="DEBUG/1_debug_print.txt", encoding="utf8"):
    """
    Print to file instead of terminal. Appends each call with a timestamp and a distinct header.
    """
    os.makedirs(os.path.dirname(file), exist_ok=True)  

    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")  # 时间戳
    header = "\n" + "$$$"  # 显眼的标头
    with open(file, "a", encoding=encoding) as f: 
        f.write(f"{header}\n{timestamp} " + " ".join(map(str, args)) + "\n")
