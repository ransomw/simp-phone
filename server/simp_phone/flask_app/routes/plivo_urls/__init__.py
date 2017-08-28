from flask import current_app
from flask import request
from flask import Blueprint

plivo_urls = Blueprint(
    'plivo_urls', __name__)

@plivo_urls.before_request
def log_raw_request_body():
    """
    get_data modifies the underlying WSGI environ, so
    such logging need be within werkzeugified layers
    """
    MAX_CONTENT_LEN = 2500
    body_str = (
        request.get_data(as_text=True, parse_form_data=True)
        if (request.content_length is None or
            request.content_length < MAX_CONTENT_LEN)
        else ("<request content exceeding " +
                  str(MAX_CONTENT_LEN) + ">"))
    current_app.logger.info(body_str)


from . import routes

__all__ = [
    'plivo_urls',
]
