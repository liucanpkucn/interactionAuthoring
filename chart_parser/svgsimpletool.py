import svg.path
import math

def truncate_small_precision_loss(v, ndigits=6):
    return round(v, ndigits=ndigits)

def gen_center_key(center_x, center_y):
    return str(center_x) + '"' + str(center_y)

def dec_center_key(center_str):
    center_x, center_y = list(map(float, center_str.split('"')))
    return center_x, center_y

def positive_zero(v):
    if v == -0.0:
        return 0.0
    return v

def find_center(segs, relative_position):
    # print("** segs:")
    candicate_center = set()
    for seg in segs:
        # print(seg)
        isArc = type(seg) == svg.path.path.Arc
        if isArc:
            center_x = seg.center.real
            center_y = seg.center.imag
            center_x = truncate_small_precision_loss(center_x + relative_position[0])
            center_y = truncate_small_precision_loss(center_y + relative_position[1])
            center_x = positive_zero(center_x)
            center_y = positive_zero(center_y)
            # print("   center:", center_x, center_y)
            candicate_center.add(gen_center_key(center_x, center_y))
    candicate_center = list(map(lambda x: dec_center_key(x), candicate_center))
    # print("**", candicate_center)
    if len(candicate_center) != 1:
        return None
    print(candicate_center[0])
    return candicate_center[0]
    # return [candicate_center[0][0], candicate_center[0][1]]
