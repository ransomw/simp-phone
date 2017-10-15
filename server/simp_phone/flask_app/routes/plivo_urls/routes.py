from flask import request
from flask import make_response
from flask import current_app
from webargs import fields
from webargs.flaskparser import use_args
import plivoxml

from . import plivo_urls

def _conv_p_res(p_res):
    res = make_response(p_res.to_xml())
    res.headers['Content-Type'] = 'text/xml'
    return res


_answer_args = {
    'caller_id': fields.Str(),
    'sip_username': fields.Str(),
    'CallerName': fields.Str(),
    'To': fields.Str(),
    'ForwardTo': fields.Str(),
    'DisableCall': fields.Str(),
}

@plivo_urls.route('/answer', methods=['POST'])
@use_args(_answer_args)
def answer(args):
    if args.get('caller_id', None) is None:
        current_app.logger.warn("missing caller_id arg (url param)")
    if args.get('sip_username', None) is None:
        current_app.logger.warn("missing sip_username arg (url param)")
    current_app.logger.info("plivo answer url args:\n" + str(args))
    p_res = plivoxml.Response()
    to_key = ('ForwardTo' if 'ForwardTo' in args else 'To')
    if to_key not in args:
        p_res.addHangup()
        return _conv_p_res(p_res)
    dial = p_res.addDial(
        callerId=args.get('caller_id', ''),
        callerName=args.get('CallerName', ''),
        )
    if args[to_key][:4] == 'sip:':
        # unused, according to logs
        dial.addUser(args[to_key])
    elif (args[to_key] == args.get('caller_id', None) and
              args.get('sip_username', None) is not None):
        current_app.logger.info(
            "call from: " + args.get('CallerName', '') + '\n')
        dial.addUser('sip:' + args['sip_username'] + '@phone.plivo.com')
    else:
        dial.addNumber(args[to_key])
    return _conv_p_res(p_res)


_hangup_args = {
}

@plivo_urls.route('/hangup', methods=['POST'])
@use_args(_hangup_args)
def hangup(args):
    p_res = plivoxml.Response()
    p_res.addHangup()
    return _conv_p_res(p_res)
