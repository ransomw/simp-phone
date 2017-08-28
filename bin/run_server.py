#! /usr/bin/env python

import argparse
import os.path

from simp_phone.flask_app import create_app

def parseArgs():
    """ parse script arguments """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-p', '--port', dest='port',
        type=int,
        default=5000,
        help=("the port number for the async server"),
    )
    parser.add_argument(
        '-l', '--log', dest='log_filename',
        type=str,
        default=os.path.join('log', 'server.log'),
        help=("path to log file"),
    )
    return parser.parse_args()


if __name__ == '__main__':
    args = parseArgs()
    create_app(
        log_filename=args.log_filename,
        ).run(host='0.0.0.0', port=args.port,)
