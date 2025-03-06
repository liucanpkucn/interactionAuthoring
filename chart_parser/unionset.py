class DisjointSet(object):

    def __init__(self):
        self.leader = {} # maps a member to the group's leader
        self.group = {} # maps a group leader to the group (which is a set)

    def add(self, a, b):
        leadera = self.leader.get(a)
        leaderb = self.leader.get(b)
        if leadera is not None:
            if leaderb is not None:
                if leadera == leaderb: return # nothing to do
                groupa = self.group[leadera]
                groupb = self.group[leaderb]
                if len(groupa) < len(groupb):
                    a, leadera, groupa, b, leaderb, groupb = b, leaderb, groupb, a, leadera, groupa
                groupa |= groupb
                del self.group[leaderb]
                for k in groupb:
                    self.leader[k] = leadera
            else:
                self.group[leadera].add(b)
                self.leader[b] = leadera
        else:
            if leaderb is not None:
                self.group[leaderb].add(a)
                self.leader[a] = leaderb
            else:
                self.leader[a] = self.leader[b] = a
                self.group[a] = set([a, b])

# data = """T1 T2
# T3 T4
# T5 T1
# T3 T6
# T7 T8
# T3 T7
# T9 TA
# T1 T9"""
# # data is chosen to demonstrate each of 5 paths in the code
# from pprint import pprint as pp

# data = [
#     [1, 2],
#     [3, 4],
#     [6, 7],
#     [2, 3],
#     [1, 4],
#     [1, 2]
# ]


# ds = DisjointSet()
# for line in data:
#     x = line[0]
#     y = line[1]
#     ds.add(x, y)
#     # print (x, y)

# print(ds.group)