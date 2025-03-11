import math
import copy

# from parse_control_point import pack_point
def pack_point(x, y, index, obj_id, radius = 0, fixed = False):

    point = {"ox": x, "oy": y, "id": index, 'obj_id': obj_id, "radius": radius }
    # if index == 3030:
    #     print("asdfasdf", point)
    if fixed:
        point['fixed'] = True
    return point

def same_value(x, y, delta):
    if abs(x-y) < delta:
        return True
    return False

def is_subset(s1, s2):  
    # input: set
    return s1 == (s1 & s2)  

def same_float(x, y):
    return same_value(x, y, delta=1e-6)

def hash_reversed(hm):
    newhm = {}
    for key in hm:
        if hm[key] in newhm:
            print("what", hm)
        newhm[hm[key]] = key
    return newhm

def get_ticks_from_text(vobjects, min_valid_num=3, show=False):
    '''
    output: [xticks, yticks]
        xticks: [xtick, ...]
        yticks: [ytick, ...]
        xtick, ytick: same format with visual_object
        xtick: sorted from left to right
        ytick: sorted from up to down
    '''
    # vobjects = control_points["visual_object"]
    text_objects = []
    for vobject in vobjects:
        if vobject['type'] == "text":
            text_objects.append(vobject)

    def get_p_ticks(text_objects, delta1=0.01, key1="up", get0=0.01, show=False, pre_anchor=None, pre_tickpos=None):
        tmpkey = "tmpkey"
        stored_key1 = copy.deepcopy(key1)
        if type(key1) == list:
            for tob in text_objects:
                values = list(map(lambda x: tob[x], key1))
                tob[tmpkey] = sum(values) / len(values)
            key1 = tmpkey
        text_objects.sort(key=lambda x: x[key1])
        tmptickpos = list(map(lambda x: x[key1], text_objects))
        if show:
            print(tmptickpos)
            print("content:", stored_key1, list(map(lambda x: x['content'], text_objects)))
        delta_array = []
        for i2 in range(1, len(text_objects)):
            i1 = i2 - 1
            delta_v = text_objects[i2][key1] - text_objects[i1][key1]
            delta_array.append(delta_v)
        delta_array.append(math.nan)
        last_i = 0
        last_v = delta_array[last_i]
        possible_ticks = []
        for i in range(1, len(delta_array)):
            cv = delta_array[i]
            if not same_value(cv, last_v, delta1):
                possible_ticks.append({
                    "array": [last_i, i-1],
                    "value": last_v,
                })
                last_i = i
                last_v = cv
        if show:
            print(delta_array)
            print(possible_ticks)
        if key1 == tmpkey:
            for tob in text_objects:
                del tob[tmpkey]
        res = []
        for pitem in possible_ticks:
            pticks = pitem['array']
            if get0:
                if not same_value(pitem['value'], 0.0, get0):
                    continue
            resi = text_objects[pticks[0]:pticks[1]+2]
            tmpres = {
                "array": resi,
                "value": pitem['value'],
                "tickpos": tmptickpos[pticks[0]:pticks[1]+2],
            }
            if pre_anchor:
                tmpres["anchor"] = [pre_anchor, stored_key1]
                tmpres["tickpos"] = [pre_tickpos, tmptickpos[pticks[0]:pticks[1]+2]]
            res.append(tmpres)
        if show:
            for resi in res:
                print("tick:", list(map(lambda x: x['content'], resi['array'])), resi['value'])
        return res

    def get_xy_ticks(text_objects, delta1=0.01, key1="up", key2="left", delta2=20, get0=0.01, show2=False, show1=False, show=False):
        res1 = get_p_ticks(text_objects, delta1=delta1, key1=key1, get0=get0, show=show1)
        res = []
        for resi in res1:
            if len(resi['array']) >= min_valid_num:
                res2 = get_p_ticks(resi['array'], delta1=delta2, key1=key2, get0=None, show=show2, pre_anchor=key1, pre_tickpos=resi['tickpos'])
                if show:
                    print('res2:', len(res2))
                    for resii in res2:
                        print("res2i:", len(resii['array']), ", interval:", resii['value'])
                for resii in res2:
                    if len(resii['array']) >= min_valid_num:
                        res.append(resii)
        return res

    def merge_ticks(ticks, show=False):
        sets = [set(map(lambda x: x['id'], tick['array'])) for tick in ticks]
        fathers = [i for i in range(len(sets))]
        def find_father(i):
            if fathers[i] == i:
                return i
            fathers[i] = find_father(fathers[i])
            return fathers[i]
        for i1 in range(len(sets)):
            for i2 in range(len(sets)):
                father1 = find_father(i1)
                father2 = find_father(i2)
                if father1 == father2:
                    continue
                if is_subset(sets[father1], sets[father2]):
                    fathers[father1] = father2
                    break
        if show:
            for tick in ticks:
                print("debug: f", list(map(lambda x: x['content'], tick['array'])), tick['value'])
            print("debug: f", fathers)
        for i in range(len(sets)):
            fathers[i] = find_father(i)
        ret_ticks = []
        ret_setindex = set(fathers)
        for reti in ret_setindex:
            ret_ticks.append(ticks[reti])
        return ret_ticks

    xticks = []
    for key2 in [["left", "right"], "left", "right"]:
        xticks1 = get_xy_ticks(text_objects, delta1=2.5, key1="up", key2=key2, delta2=5, get0=2.5, show2=False, show1=False)
        xticks.extend(xticks1)
    # print(len(xticks))
    yticks = []
    for key1 in ["left", "right"]:
        yticks1 = get_xy_ticks(text_objects, delta1=2.5, key1=key1, key2=["up", "down"], delta2 = 5, get0=2.5, show2=False, show1=False)
        yticks.extend(yticks1)
    # print(len(yticks))
    xticks = merge_ticks(xticks)
    yticks = merge_ticks(yticks)
    if show:
        print('x:', len(xticks))
        for xtick in xticks:
            print(list(map(lambda x: x['content'], xtick['array'])), ", interval:", xtick['value'], ", anchor:", xtick['anchor'])
        print('y:', len(yticks))
        for ytick in yticks:
            print(list(map(lambda x: x['content'], ytick['array'])), ", interval:", ytick['value'], ", anchor:", ytick['anchor'])
    return [xticks, yticks]

def is_rect_object(aobject, cpoints1):
    if len(aobject['control_point']) != 4:
        return False
    if len(aobject['type']) == 'line':
        return False
    if len(aobject['type']) == 'text': # will not be true, 233
        return False
    [cp1, cp2, cp3, cp4] = list(map(lambda x: cpoints1[x], aobject['control_point']))
    small_delta = 1e-4
    res = False
    if same_value(cp1['ox'], cp2['ox'], small_delta):
        if same_value(cp3['ox'], cp4['ox'], small_delta):
            if same_value(cp1['oy'], cp4['oy'], small_delta) and same_value(cp2['oy'], cp3['oy'], small_delta):
                res = True
            elif same_value(cp1['oy'], cp3['oy'], small_delta) and same_value(cp2['oy'], cp4['oy'], small_delta):
                res = True
    elif same_value(cp1['oy'], cp2['oy'], small_delta):
        if same_value(cp3['oy'], cp4['oy'], small_delta):
            if same_value(cp1['ox'], cp4['ox'], small_delta) and same_value(cp2['ox'], cp3['ox'], small_delta):
                res = True
            elif same_value(cp1['ox'], cp3['ox'], small_delta) and same_value(cp2['ox'], cp4['ox'], small_delta):
                res = True
    # if res:
    #     print(vobject['id'])
    return res

def is_grouped_chart(key1, cpoints_left_x, kept2all, possible_ap):
    # print(possible_ap)
    # print(list(map(lambda x: x['length'], possible_ap)))
    possi_grouped_bar = []
    i1 = 0
    group_num = None
    group_dis = None
    is_2 = False
    while i1 < len(possible_ap):
        if not group_num:
            if possible_ap[i1]['length'] != 2:
                group_num = possible_ap[i1]['length']
                group_dis = possible_ap[i1]['value']
                possi_grouped_bar.append(possible_ap[i1])
                is_2 = True
        elif not is_2:
            if (possible_ap[i1]['length'] == group_num) and same_value(possible_ap[i1]['value'], group_dis, 2.0):
                possi_grouped_bar.append(possible_ap[i1])
                is_2 = True
            else:
                break
        else:
            if possible_ap[i1]['length'] != 2:
                break
            is_2 = False
        i1 += 1
    # print("group:", possi_grouped_bar)
    if len(possi_grouped_bar) > 1:
        return possi_grouped_bar
    return False

def ap_p(seq, apdelta=1.0):
    delta_array = []
    for i2 in range(1, len(seq)):
        i1 = i2 - 1
        delta_v = seq[i2] - seq[i1]
        delta_array.append(delta_v)
    delta_array.append(math.nan)
    last_i = 0
    last_v = delta_array[last_i]
    possible_ap = []
    for i in range(1, len(delta_array)):
        cv = delta_array[i]
        if not same_value(cv, last_v, apdelta):
            possible_ap.append({
                "array": [last_i, i],
                "length": i - last_i + 1,
                "value": last_v,
            })
            last_i = i
            last_v = cv
    if len(possible_ap) == 0:
        possible_ap.append({
            "array": [0, 0],
            "length": 1,
            "value": -1,
        })
    print("possible_ap:", possible_ap)
    max_len = possible_ap[0]['length']
    max_len_idx = 0
    for i in range(1, len(possible_ap)):
        if max_len < possible_ap[i]['length']:
            max_len = possible_ap[i]['length']
            max_len_idx = i
    selected_array = possible_ap[max_len_idx]['array']
    return selected_array[0], selected_array[1], possible_ap

def merge_cpoints_by_key(cpoints1: list, key1=None, samedelta=0.1):
    cpoints1.sort(key=lambda x: x[key1])
    cpoints_x = list(map(lambda x: x[key1], cpoints1))
    cpoints_x.append(math.nan)
    # print(cpoints_x)
    kept_idx = []
    last_idx = 0
    kept2all = {}
    kept2all_cp = {}
    last_v = cpoints_x[last_idx]
    for idx in range(1, len(cpoints_x)):
        cv = cpoints_x[idx]
        if not same_value(last_v, cv, samedelta):
            kept_idx.append(last_idx)
            kept2all[cpoints1[last_idx]['id']] = list(set(map(lambda x: cpoints1[x]['obj_id'], list(range(last_idx, idx)))))
            kept2all_cp[cpoints1[last_idx]['id']] = set()
            for tmpidx in range(last_idx, idx):
                if "old_ids" in cpoints1[tmpidx]:
                    kept2all_cp[cpoints1[last_idx]['id']].update(cpoints1[tmpidx]["old_ids"])
                else:
                    kept2all_cp[cpoints1[last_idx]['id']].add(cpoints1[tmpidx]["id"])
            kept2all_cp[cpoints1[last_idx]['id']] = list(kept2all_cp[cpoints1[last_idx]['id']])
            last_idx = idx
            last_v = cv
    # print(len(kept_idx), ":", kept_idx)
    ret_cpoints = list(map(lambda x: cpoints1[x], kept_idx))
    return ret_cpoints, [kept2all, kept2all_cp]

def many_centers_p(centers):
    centers.sort(key=lambda x: x[0])
    centers.sort(key=lambda x: x[1])
    # print("many centers p:", centers)
    delta = 10
    for i1 in range(0, len(centers)-1):
        i2 = i1 + 1
        if (not same_value(centers[i1][0], centers[i2][0], delta)) or (not same_value(centers[i1][1], centers[i2][1], delta)):
            return True
    return False

def parseFloat(numstr: str):
    numres = None
    if numstr.endswith("%"):
        numres = float(numstr[:-1]) / 100
        return numres
    numstr = numstr.replace(',', '')
    numstr = numstr.replace('_', '')
    numstr = numstr.replace('$', '')
    try:
        numres = float(numstr)
    except Exception as parse_error:
        print(parse_error)
    finally:
        return numres

def try_scale_Q(xytick):
    try:
        axis_type = xytick['type']
        tick = xytick['tick']
        tick_object = list(map(lambda x: x['visual_object'], tick))
        tick_pos = list(map(lambda x: x['position'][axis_type], tick))
        tick_valid = list(map(lambda x: [x[0]['content'], x[1]], filter(lambda x: x[0], zip(tick_object, tick_pos))))
        tick_valid = list(map(lambda x: {"value": parseFloat(x[0]), "position": x[1], "type": axis_type}, tick_valid))
        xytick["Q_scale"] = tick_valid
    except Exception as scale_Q_error:
        print(scale_Q_error)
    return xytick

def get_ticks(cpoints, vobjects, min_valid_num=3, orishow=True, curshow=True):
    print("before donut, object num:", len(vobjects))
    donut_ret = process_donut(cpoints, vobjects)
    print("after donut, object num:", len(vobjects))
    ticks_ret = None
    if len(donut_ret[0]) == 0:
        ticks_ret = get_ticks_v2(cpoints, vobjects, min_valid_num=min_valid_num, orishow=orishow, curshow=curshow)
        return ticks_ret
    centers = []
    trans_objects = donut_ret[0]
    for tobject in trans_objects:
        centers.append(tobject["ori_center"])
    if many_centers_p(centers) or (len(donut_ret[0])==1):
        ticks_ret = get_ticks_v2(cpoints, vobjects, min_valid_num=min_valid_num, orishow=orishow, curshow=curshow)
        return ticks_ret
    donut_transform = donut_ret[1]
    cpoints = donut_ret[2]
    vobjects = donut_ret[3]
    return get_ticks_from_donut(cpoints, vobjects, trans_objects, donut_transform)

def get_ticks_from_donut(cpoints, vobjects, trans_objects, donut_transform):
    ticks_ret = None
    area_objects = trans_objects
    cpointsi_need = set()
    cpoints_idx_acc = len(cpoints)
    for aobject in area_objects:
        if is_rect_object(aobject, cpoints):
            newcpoint = {
                "ox": (aobject["left"]+aobject['right'])/2,
                "oy": (aobject["up"]+aobject['down'])/2,
                "id": cpoints_idx_acc,
                "obj_id": aobject['id'],
                "old_ids": aobject["control_point"],
                'radius': 0
            }
            cpoints.append(newcpoint)
            cpointsi_need.add(cpoints_idx_acc)
            cpoints_idx_acc += 1
        else:
            cpointsi_need.update(aobject['control_point'])
    cpointsi_need = list(cpointsi_need)
    cpoints_need = [cpoints[x] for x in cpointsi_need]

    def gen_new_tick(cpoints_need, key1="ox", samedelta=2.5, xtype="x"):
        nonlocal cpoints_idx_acc
        cpoints_left_x, kept2all = merge_cpoints_by_key(cpoints_need, key1=key1, samedelta=samedelta)
        vox = list(map(lambda x: x[key1], cpoints_left_x))
        voxnums, voxnume, possible_ap = ap_p(vox, apdelta=samedelta)
        print('---', xtype)

        def compute_xtick_range(vox, fixed_distance, range_extend=True, cpoints1=cpoints_left_x, aobjects=trans_objects, xtype=xtype, mainp=False):
            xbegin = -1
            xend = -1
            xbegin = vox[0]
            xend = vox[-1]
            if xbegin == xend:
                vobject = None
                for aobject in aobjects:
                    if aobject['id'] == cpoints1[0]['obj_id']:
                        vobject = aobject
                        break
                if xtype == "x":
                    xbegin = vobject["left"]
                    xend = vobject["right"]
                elif xtype == "y":
                    xbegin = vobject["up"]
                    xend = vobject["down"]
            if range_extend and fixed_distance is not None and fixed_distance > 0:
                xbegin = xbegin - fixed_distance / 2
                xend = xend + fixed_distance / 2
            if not mainp:
                xbegin = 0.0
                xend = 360.0
            return {"begin": xbegin, "end": xend}

        xticks1 = []
        curtick1 = {
            "type": xtype,
            "main": False,
            "attr_type": "",
            "fixed_distance": 0,
            "range": None,
            "tick": None,
        }

        mainp = False
        if len(possible_ap) == 1:
            mainp = True
        curtick1["main"] = mainp
        if mainp:
            curtick1["attr_type"] = "C"
            curtick1["fixed_distance"] = possible_ap[0]["value"]
            ticks1 = []
            for vidx, v in enumerate(vox):
                x = 0; y = 0
                if xtype == "x":
                    x = v
                    y = 0
                elif xtype == "y":
                    x = 0
                    y = v
                curtick = {
                    "position": {
                        "x": x,
                        "y": y,
                    },
                    "controlled": kept2all[1][cpoints_left_x[vidx]['id']],
                    "visual_object": None,
                }
                ticks1.append(curtick)
            curtick1["tick"] = ticks1
            curtick1["controlled"] = list(map(lambda x: x['id'], area_objects))
        else:
            curtick1["attr_type"] = "Q"
            curtick1["fixed_distance"] = None
            ticks1 = []
            for v in vox:
                x = 0; y = 0
                if xtype == "x":
                    x = v
                    y = 0
                elif xtype == "y":
                    x = 0
                    y = v
                curtick = {
                    "position": {
                        "x": x,
                        "y": y,
                    },
                    "controlled": None,
                    "visual_object": None,
                }
                ticks1.append(curtick)
            curtick1["tick"] = ticks1
        curtick1["range"] = compute_xtick_range(vox, curtick1["fixed_distance"], mainp=mainp)
        xticks1.append(curtick1)
        return xticks1

    xticks = gen_new_tick(cpoints_need, key1="ox", samedelta=2.5, xtype="x")
    yticks = gen_new_tick(cpoints_need, key1="oy", samedelta=2.5, xtype="y")
    ticks_ret = {
        "x": xticks,
        "y": yticks,
        "transform": donut_transform,
        "more_object": list(map(lambda x: x['id'], trans_objects))
    }
    return ticks_ret

def get_ticks_v2(cpoints, vobjects, min_valid_num=4, orishow=True, curshow=True):
    [xticks, yticks] = get_ticks_from_text(vobjects, min_valid_num=min_valid_num, show=orishow)
    area_objects = []
    for vobject in vobjects:
        if (vobject['type'] == "area") or (vobject['type'] == "point"):
            area_objects.append(vobject)
        elif (vobject['type']=='line') and (len(vobject['control_point'])==2):
            area_objects.append(vobject)
    cpointsi_need = set()
    cpoints_idx_acc = len(cpoints)
    for aobject in area_objects:
        if is_rect_object(aobject, cpoints):
            newcpoint = {
                "ox": (aobject["left"]+aobject['right'])/2,
                "oy": (aobject["up"]+aobject['down'])/2,
                "id": cpoints_idx_acc,
                "obj_id": aobject['id'],
                "old_ids": aobject["control_point"]
            }
            cpoints.append(newcpoint)
            cpointsi_need.add(cpoints_idx_acc)
            cpoints_idx_acc += 1
        else:
            cpointsi_need.update(aobject['control_point'])
    cpointsi_need = list(cpointsi_need)
    cpoints_need = [cpoints[x] for x in cpointsi_need]

    def gen_new_tick(cpoints_need, xticks, key1=None, samedelta=1.2, xtype="x"):
        nonlocal cpoints_idx_acc
        cpoints_left_x, kept2all = merge_cpoints_by_key(cpoints_need, key1=key1, samedelta=samedelta)
        vox = list(map(lambda x: x[key1], cpoints_left_x))
        # print('---', xtype, vox)
        print('---', xtype)
        voxnums, voxnume, possible_ap = ap_p(vox, apdelta=samedelta)
        grouped_chart_res = is_grouped_chart(key1, cpoints_left_x, kept2all, possible_ap)
        if grouped_chart_res:
            new_cpoints_left_x = []
            new_kept2all = {}
            new_kept2all_cp = {}
            for gcr in grouped_chart_res:
                gcridx = [i for i in range(gcr['array'][0], gcr['array'][1]+1)]
                # print(gcr, gcridx)
                # print(list(map(lambda x: cpoints_left_x[x][key1], gcridx)))
                new_obj_id = list(set(map(lambda x: cpoints_left_x[x]['obj_id'], gcridx)))
                new_cp_id = set()
                for tmpidx in gcridx:
                    if "old_ids" in cpoints_left_x[tmpidx]:
                        new_cp_id.update(cpoints_left_x[tmpidx]["old_ids"])
                    else:
                        new_cp_id.add(cpoints_left_x[tmpidx]["id"])
                new_cp_id = list(new_cp_id)
                newcpoint = {
                    "id": cpoints_idx_acc,
                    "obj_id": new_obj_id,
                    key1: sum(map(lambda x: cpoints_left_x[x][key1], gcridx)) / gcr['length']
                }
                # print(newcpoint)
                new_cpoints_left_x.append(newcpoint)
                new_kept2all[cpoints_idx_acc] = new_obj_id
                new_kept2all_cp[cpoints_idx_acc] = new_cp_id
                cpoints_idx_acc += 1
            cpoints_left_x = new_cpoints_left_x
            kept2all[0] = new_kept2all
            kept2all[1] = new_kept2all_cp
            vox = list(map(lambda x: x[key1], cpoints_left_x))
            voxnums, voxnume, possible_ap = ap_p(vox, apdelta=samedelta)
            # print(list(map(lambda x: x['id'], cpoints_left_x)))
            print("** is grouped bar chart")
        else:
            print("** not grouped bar chart")
        xticks1 = []

        def compute_xtick_type(xtick, mainp, tickrange, tickstep, controlled_objects_id):
            attr_type = "Q"
            if not mainp:
                attr_type = "Q"
            else:
                attr_type = "C"
                # TODO: judge O/C
                across_count = 0
                tpos1 = tickrange['begin']
                tpos2 = tickrange['end']
                for aobject in area_objects:
                    if mainp:
                        if not aobject['id'] in controlled_objects_id:
                            continue
                    pos1 = -1
                    pos2 = -2
                    if xtype == "x":
                        pos1 = aobject['left']
                        pos2 = aobject['right']
                    elif xtype == "y":
                        pos1 = aobject['up']
                        pos2 = aobject['down']
                    # print(pos1, pos2, tpos1, tpos2)
                    if (pos1 <= tpos1) and (tpos2 <= pos2):
                        across_count += 1
                    elif (pos2 - pos1) > tickstep:
                        across_count += 0.5
                if across_count > 0:
                    attr_type = "O"
            return attr_type

        def compute_xtick_range(xtick, range_extend=True):
            xbegin = -1
            xend = -1
            xbegin = xtick['tickpos'][1][0]
            xend = xtick['tickpos'][1][-1]
            if range_extend:
                xbegin = xbegin - xtick['value'] / 2
                xend = xend + xtick['value'] / 2
            return {"begin": xbegin, "end": xend}

        def find_vi2ti(tx, vx, tick_cp_samedelta):
            vi = 0; ti = 0
            vi2ti = {}
            ret_delta = None
            while ti < len(tx):
                while vi < len(vx):
                    if same_value(vx[vi], tx[ti], tick_cp_samedelta):
                        ret_delta = vx[vi] - tx[ti]
                        vi2ti[vi] = ti
                        break
                    vi += 1
                ti += 1
            return vi2ti, ret_delta

        def compute_xtick_newform(xtick, insertp, cpoints_left, showtick=False, tick_cp_samedelta=2.5, kept2all=None):
            if showtick:
                print("tick", '-'*42, "tick")
                print("len tick:", len(xtick['tickpos'][1]), ", len point:", len(cpoints_left), ", insertp: ", insertp)
            ticks1 = []
            tx = xtick['tickpos'][1]
            vx = list(map(lambda x: x[key1], cpoints_left))
            vi2ti, ret_delta = find_vi2ti(tx, vx, tick_cp_samedelta)
            if showtick:
                print(tx)
                print(vx)
                print("abs", vi2ti)
            if ret_delta:
                for tickpos1idx in range(len(xtick['tickpos'][1])):
                    xtick['tickpos'][1][tickpos1idx] += (ret_delta)
            if (not insertp) or (len(tx)==len(vx)):
                ti2vi = hash_reversed(vi2ti)
                for tidx, tick in enumerate(xtick['array']):
                    x = 0; y = 0; cc = None
                    if xtype == "x":
                        x = xtick['tickpos'][1][tidx]
                        y = xtick['tickpos'][0][tidx]
                    if xtype == "y":
                        x = xtick['tickpos'][0][tidx]
                        y = xtick['tickpos'][1][tidx]
                    if insertp:
                        cc = kept2all[1][cpoints_left[ti2vi[tidx]]['id']]
                    curtick = {
                        "position": {
                            "x": x,
                            "y": y,
                        },
                        "controlled": cc,
                        "visual_object": tick['id'],
                    }
                    ticks1.append(curtick)
                return ticks1
            # assume len(xtick) <= len(cpoints)
            v1 = list(vi2ti.keys())[0]
            v2 = list(vi2ti.keys())[1]
            v_per_t = (v1-v2)/(vi2ti[v1]-vi2ti[v2])
            new_t_per_v = (tx[vi2ti[v2]]-tx[vi2ti[v1]]) / v_per_t
            xtick['new_value'] = new_t_per_v
            if showtick:
                print(tx[vi2ti[v2]]-tx[vi2ti[v1]], new_t_per_v)
            for vidx in range(len(cpoints_left)):
                x = 0; y = 0; vo = None; cc = None
                cc = kept2all[1][cpoints_left[vidx]['id']]
                if vidx in vi2ti:
                    tidx = vi2ti[vidx]
                    if xtype == "x":
                        x = xtick['tickpos'][1][tidx]
                        y = xtick['tickpos'][0][tidx]
                    if xtype == "y":
                        x = xtick['tickpos'][0][tidx]
                        y = xtick['tickpos'][1][tidx]
                    vo = xtick['array'][tidx]
                else:
                    min_vidx = -1
                    min_vidxdelta = math.inf
                    for tmp_vidx in range(len(cpoints_left)):
                        if tmp_vidx in vi2ti:
                            cur_vidxdelta = abs(tmp_vidx - vidx)
                            if cur_vidxdelta < min_vidxdelta:
                                min_vidxdelta = cur_vidxdelta
                                min_vidx = tmp_vidx
                            else:
                                break
                    if showtick:
                        print(vidx, "=>", min_vidx)
                    tidx = vi2ti[min_vidx]
                    if xtype == "x":
                        x = xtick['tickpos'][1][tidx] + (vidx - min_vidx) * new_t_per_v
                        y = xtick['tickpos'][0][0] # same y in axis-x
                    if xtype == "y":
                        x = xtick['tickpos'][0][0] # same x in axis-y
                        y = xtick['tickpos'][1][tidx] + (vidx - min_vidx) * new_t_per_v
                curtick = {
                    "position": {
                        "x": x,
                        "y": y,
                    },
                    "controlled": cc,
                    "visual_object": vo
                }
                ticks1.append(curtick)
            return ticks1

        def cp2id(kept2all, s, e, cpoints_left_x):
            ret_void = set()
            for i in range(s, e+1):
                ret_void.update(kept2all[0][cpoints_left_x[i]['id']])
            ret_void = sorted(list(ret_void))
            # print("control:", ret_void)
            return {
                "visual_object": ret_void,
            }

        for xtick in xticks:
            curtick1 = {
                "type": xtype,
                "main": False,
                "attr_type": "",
                "fixed_distance": xtick['value'],
                "range": compute_xtick_range(xtick), # {"begin": None, "end": None},
                "tick": None,
            }
            mainp = False
            if (voxnume - voxnums + 1) >= len(xtick['array']):
                tx = xtick['tickpos'][1]
                vx = list(map(lambda x: x[key1], cpoints_left_x[voxnums:(voxnume+1)]))
                tmpvi2ti, _ = find_vi2ti(tx, vx, tick_cp_samedelta=3.5)
                print(xtype, tmpvi2ti)
                if len(tmpvi2ti) >= min_valid_num:
                    curtick1['main'] = True
                    mainp = True
                    curtick1['controlled'] = cp2id(kept2all, voxnums, voxnume, cpoints_left_x)
                    if curshow:
                        print("main:", list(map(lambda x: x['content'], xtick['array'])))
            controlled_objects_id = None
            if mainp:
                controlled_objects_id = set(curtick1['controlled']['visual_object'])
            curtick1['attr_type'] = compute_xtick_type(xtick, mainp, compute_xtick_range(xtick, range_extend=False), xtick['value'], controlled_objects_id)
            curtick1["tick"] = compute_xtick_newform(xtick, mainp, cpoints_left=cpoints_left_x[voxnums:(voxnume+1)], tick_cp_samedelta=3.5, kept2all=kept2all)
            if "new_value" in xtick:
                curtick1["fixed_distance"] = xtick['new_value']
            xticks1.append(curtick1)
        return xticks1
    
    xticks1 = gen_new_tick(cpoints_need, xticks, key1="ox", samedelta=2.5, xtype="x")
    yticks1 = gen_new_tick(cpoints_need, yticks, key1="oy", samedelta=2.5, xtype="y")
    xticks1.sort(key=lambda x: x['range']['end']-x['range']['begin'], reverse=True)
    yticks1.sort(key=lambda x: x['range']['end']-x['range']['begin'], reverse=True)

    for i in range(len(xticks1)):
        if xticks1[i]["attr_type"] == "Q":
            xticks1[i] = try_scale_Q(xticks1[i])
    for i in range(len(yticks1)):
        if yticks1[i]["attr_type"] == "Q":
            yticks1[i] = try_scale_Q(yticks1[i])

    ret_ticks = {
        "x": xticks1,
        "y": yticks1,
    }

    if curshow:
        print("ticks x:", len(ret_ticks['x']), ', y:', len(ret_ticks['y']))
    return ret_ticks

def compute_slope(x1, y1, x2, y2, tosvg=True):
    # y 是反的坐标; TODO: change to 0-360 from top point? maybe no need
    res = math.atan2((y1-y2), (x2-x1))
    if res < 0:
        res += math.pi * 2
    if tosvg:
        res = (- res + math.pi / 2 + math.pi * 2) % (math.pi * 2)
    return res

def compute_distance(x1, y1, x2, y2):
    delta_x = x1 - x2
    delta_y = y1 - y2
    return math.sqrt(delta_x * delta_x + delta_y * delta_y)

def process_donut(cpoints, vobjects):
    donut_objects = []
    trans_objects = []
    cpoints_idx_acc = len(cpoints)
    vobject_idx_acc = len(vobjects)
    base_angle = math.inf
    clockwise = None # 1 # or -1
    ret_center = None
    for vobject in vobjects:
        if (vobject['type'] == "area") and ("center" in vobject) and (vobject["center"] is not None):
            if clockwise is None:
                for i1, infodatum in enumerate(vobject["append_info"]):
                    if infodatum and (infodatum["sweep"] is True):
                        clockwise = 1
                        break
                    if infodatum and (infodatum["sweep"] is False):
                        clockwise = -1
                        break
            center_x, center_y = vobject["center"]
            ret_center = vobject["center"]
            # print(vobject["center"])
            vobject["slope_array"] = list(map(lambda x: compute_slope(center_x, center_y, cpoints[x]['ox'], cpoints[x]['oy'], tosvg=(clockwise==1))*180/math.pi, vobject["control_point"]))
            vobject["slope"] = sum(vobject["slope_array"]) / len(vobject["slope_array"])
            vobject["slope_range"] = [min(vobject["slope_array"]), max(vobject["slope_array"])]
            vobject["distance_array"] = list(map(lambda x: compute_distance(center_x, center_y, cpoints[x]['ox'], cpoints[x]['oy']), vobject["control_point"]))
            vobject["distance"] = sum(vobject["distance_array"]) / len(vobject["distance_array"])
            vobject["distance_range"] = [min(vobject["distance_array"]), max(vobject["distance_array"])]
            donut_objects.append(vobject)
            delta_angle = -1
            start_angle = 0
            for i1, infodatum in enumerate(vobject["append_info"]):
                if infodatum and (infodatum["sweep"] is (clockwise==1)):
                    start_angle = vobject["slope_array"][i1-(1 if (clockwise==1) else 0)]
                    base_angle = min(base_angle, start_angle)
                    delta_angle = vobject["slope_array"][i1] - vobject["slope_array"][i1-1]
                    if (clockwise==1) and (delta_angle < 0):
                        delta_angle += 360
                    if (clockwise==-1) and (delta_angle > 0):
                        delta_angle -= 360
                    delta_angle *= clockwise
                    break
            end_angle = start_angle + delta_angle
            # print(delta_angle, start_angle, end_angle)

            newcpoint1 = pack_point(start_angle, vobject["distance_range"][0], cpoints_idx_acc, vobject_idx_acc)
            newcpoint2 = pack_point(end_angle, vobject["distance_range"][0], cpoints_idx_acc + 1, vobject_idx_acc)
            newcpoint3 = pack_point(end_angle, vobject["distance_range"][1], cpoints_idx_acc + 2, vobject_idx_acc)
            newcpoint4 = pack_point(start_angle, vobject["distance_range"][1], cpoints_idx_acc + 3, vobject_idx_acc)

            # newcpoint1 = {
            #     "id": cpoints_idx_acc,
            #     "obj_id": vobject_idx_acc,
            #     "ox": start_angle,
            #     "oy": vobject["distance_range"][0],
            # }
            # newcpoint2 = {
            #     "id": cpoints_idx_acc+1,
            #     "obj_id": vobject_idx_acc,
            #     "ox": end_angle,
            #     "oy": vobject["distance_range"][0],
            # }
            # newcpoint3 = {
            #     "id": cpoints_idx_acc+2,
            #     "obj_id": vobject_idx_acc,
            #     "ox": end_angle,
            #     "oy": vobject["distance_range"][1],
            # }
            # newcpoint4 = {
            #     "id": cpoints_idx_acc+3,
            #     "obj_id": vobject_idx_acc,
            #     "ox": start_angle,
            #     "oy": vobject["distance_range"][1],
            # }
            newobject = {
                "id": vobject_idx_acc,
                "control_point": [cpoints_idx_acc, cpoints_idx_acc+1, cpoints_idx_acc+2, cpoints_idx_acc+3],
                "type": "area",
                "opacity": vobject["opacity"],
                "fill": vobject["fill"],
                "fill_opacity": vobject["fill_opacity"],
                "stroke": vobject["stroke"],
                "stroke_width": vobject["stroke_width"],
                "left": start_angle,
                "right": end_angle,
                "up": vobject["distance_range"][0],
                "down": vobject["distance_range"][1],
                "status": "new",
                "ori_center": vobject["center"],
                "ori_id": vobject["id"]
            }
            cpoints_idx_acc += 4
            vobject_idx_acc += 1
            cpoints.append(newcpoint1)
            cpoints.append(newcpoint2)
            cpoints.append(newcpoint3)
            cpoints.append(newcpoint4)
            vobjects.append(newobject)
            trans_objects.append(newobject)
    # print(list(map(lambda x: str(x['id'])+" "+str(x["slope_range"])+" : "+str(x["slope_array"]), donut_objects)))
    # print(list(map(lambda x: str(x['id'])+" "+str(x["distance_range"])+" : "+str(x["distance_array"]), donut_objects)))
    ret_transform = {
        "type": "polar",
        "origin": ret_center,
        "begin_phi": base_angle,
        "begin_radius": 0,
        "radius_rate": [0, 1],
        "phi_rate": [2 * 3.14 / 800, 0]
    }
    return trans_objects, ret_transform, cpoints, vobjects

if __name__ == "__main__":
    import json
    generate_json = True
    get_tick = False
    get_donut = True

    if generate_json:
        import gen_control
        file_name = "../data/lc_stack_chart.svg"
        file_name = "../data/lc_stack_area.svg"
        file_name = "../data/heatmap.svg"
        file_name = "../data/stack_bar_revenue.svg"
        file_name = "../data/revenue.svg"
        file_name = "../data/president3.svg"
        file_name = "../data/cut-by-clarity.svg"
        file_name = "../data/nyt_tct.svg"
        file_name = "../data/stack_bar_vertical.svg"
        file_name = "../data/donut2_lc.svg"
        file_name = "../data/sun_lc.svg"
        file_name = "../data/current_svg.svg"
        file_name = "../data/tmp_wucs.svg"
        file_name = "../data/newnew2_lc.svg"
        file_name = "../data/stack_area_lc.svg"
        file_name = "../data/grouped_lc.svg"
        file_name = "../data/circle_lc.svg"
        file_name = "../data/fusion_1_lc.svg"
        file_name = "../data/group2_lc.svg"
        svg_string = None
        with open(file_name, encoding='utf-8') as f:
            svg_string = f.read()
        return_objs = gen_control.parse_unknown_svg_visual_elements(svg_string, need_text = True, min_len = 1000)
        visual_objs, width, height = return_objs[0:3]

        width = int(float(width))
        height = int(float(height))

        control_point, visual_object, non_soup_visual_object = gen_control.get_control_point(visual_objs)  # convert to control point and visual object format

        with open("../data/testchart.json", 'w', encoding='utf-8') as f:
            json.dump({'control_point': control_point, 'visual_object': non_soup_visual_object}, f, indent=2, ensure_ascii=False)

        print('**'*42, "extract done")

    control_points_filename = "../data/control_point.json"
    control_points_filename = "../data/testchart.json"
    with open(control_points_filename, encoding='utf-8') as f:
        control_points = json.load(f)

    if get_tick:
        res2 = get_ticks_from_text(control_points["visual_object"], min_valid_num=3, show=True)
        # print(res2)
        print('-' * 42)
        res = get_ticks_v2(control_points['control_point'], control_points['visual_object'], min_valid_num=3, orishow=True, curshow=True)
        with open("../data/tick.json", 'w', encoding='utf-8') as f:
            json.dump(res, f, indent=2, ensure_ascii=False)
        if len(res) > 2:
            with open("../data/testchart2.json", 'w', encoding='utf-8') as f:
                json.dump({"control_point": res[2], "visual_object": res[3]}, f, indent=2, ensure_ascii=False)

    if get_donut:
        res = get_ticks(control_points['control_point'], control_points['visual_object'], min_valid_num=3, orishow=True, curshow=True)
        with open("../data/tick.json", 'w', encoding='utf-8') as f:
            json.dump(res, f, indent=2, ensure_ascii=False)
        with open("../data/testchart2.json", 'w', encoding='utf-8') as f:
            json.dump({"control_point": control_points['control_point'], "visual_object": control_points['visual_object']}, f, indent=2, ensure_ascii=False)
