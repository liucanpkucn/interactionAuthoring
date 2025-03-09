# 代码逻辑:

* 输入是input_svg_file

* 在get_metadata.py中将其转为图片, 然后使用其中的prompt和图片获得metadata,输出在 intermediate_data\metadata. (这里的metadata一些字段为"wait",这些是大模型不擅长识别的具体坐标数据,一会通过simvec用代码来补全)

* 在parse_svg_x.js中,会输出simvec到 intermediate_data\raw_simvec

* 在data_formatter里会把文本形式的raw_simvec变为json形式的cleaned_simvec,方便后面用. 并且会从simvec里找到对应的数据填补到metadata里的wait字段,处理后的metadata输出到output_json_file\metadata
