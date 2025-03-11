# -*- coding: utf-8 -*-
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import json
import os
# enable_pretty_logging()
import logging
# from sentence_generator.sentence_generator import generate_sentence_by
import sys

from uuid import uuid5, UUID
import torch

from tornado.options import define, options

sys.path.append('./chart_parser')

from chart_parser.reverse_engineering import get_constraints_with_data

import datetime

logger = logging.getLogger(__name__)
define("port", default=8897, help = "run on the given port", type = int)

# the path to server html, js, css files
# client_file_root_path = os.path.join(os.path.split(__file__)[0],'../data_collect_system')
# client_file_root_path = os.path.abspath(client_file_root_path)

# show_file_root_path = os.path.join(os.path.split(__file__)[0], '../show_system')
# show_file_root_path = os.path.abspath(show_file_root_path)

static_path = os.path.join('./web_page')
static_path = os.path.abspath(static_path)

def set_header_all(handler):
    handler.set_header("Access-Control-Allow-Origin", "*")
    handler.set_header("Access-Control-Allow-Headers", "x-requested-with")
    handler.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    return

class uploadChart(tornado.web.RequestHandler):

    def set_default_headers(self):
        set_header_all(self)

    def post(self):
        postdata = json.loads(self.get_body_argument('svg'))
        svg_string = postdata["svg_string"]
        base64image = postdata["base64image"][len('data:image/png;base64,'):]
        now = datetime.datetime.now()  # 获取当前日期和时间
        formatted = now.strftime('%Y%m%d_%H%M')  # 将日期和时间格式化为字符串
        # file_uuid = str(uuid5(UUID(int=0), f'{postdata["filename"]}-{formatted}'))
        file_uuid = f'{postdata["filename"].replace(".svg", "")}-{formatted}'

        with open(f'chart_parser/tmp/{postdata["filename"]}', "w") as f:
            f.write(svg_string)

        chart_json = get_constraints_with_data(svg_string)
        return_obj = {}
        return_obj['result'] = chart_json
        self.write(return_obj)
        self.finish()

        
        with open(f'web_page/chosen_json/{postdata["filename"][:-4]}.json', 'w') as f:
            json.dump(chart_json, f, indent = 2)
        
        with open(f'web_page/chosen_svg/{postdata["filename"][:-4]}.svg', 'w') as f:
            f.write(svg_string)

class Application(tornado.web.Application):
    def __init__ (self):
        handlers = [
            (r'/uploadChart', uploadChart),
            (r'/(.*)', tornado.web.StaticFileHandler, {'path': static_path, 'default_filename': 'index.html'}), # fetch client file
        ]

        settings = {
            'static_path': static_path,
            'debug': True
        }
        tornado.web.Application.__init__(self, handlers, **settings)


if __name__ == '__main__':
    tornado.options.parse_command_line()
    print('server running at http://localhost:%d ...'%(tornado.options.options.port))
    
    app = Application()
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
