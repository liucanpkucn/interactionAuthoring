


with open('../web_page/chosen_svg/multi_line_old.svg', 'r', encoding='utf8') as f:
    svg_string = f.read()

# svg_string = svg_string.replace('rgb(44, 132, 101)', 'rgb(120, 120, 120)')



colors = ["rgb(243, 90, 76)", "rgb(0, 128, 214)", "rgb(255, 216, 1)", "rgb(147, 84, 191)", "rgb(233, 187, 217)", "rgb(0, 201, 190)"]

# color_B
# 
# rgb(193, 80, 101)
# rgb(44, 132, 101)
# rgb(207, 10, 102)
# rgb(109, 62, 145)
# rgb(24, 71, 15)
# rgb(190, 89, 21)

replace_dict = {
    'rgb(193, 80, 101)': 'rgb(243, 90, 76)',
    'rgb(44, 132, 101)': 'rgb(0, 128, 215)',
    'rgb(207, 10, 102)': 'rgb(147, 84, 191)',
    'rgb(109, 62, 145)': 'rgb(233, 187, 217)',
    'rgb(24, 71, 15)': 'rgb(0, 202, 190)',
    'rgb(190, 89, 21)': 'rgb(255, 216, 1)'
}

for key, value in replace_dict.items():
    svg_string = svg_string.replace(key, value)

with open('../web_page/chosen_svg/multi_line_style.svg', 'w', encoding = 'utf8') as f:
    f.write(svg_string)
