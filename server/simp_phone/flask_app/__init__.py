import logging

from flask import Flask
from flask import request

from ..wsgi_util.middlewares import LoggingMiddleware

def create_app(
        log_filename=None
        ):
    app = Flask(__name__)

    app.logger.setLevel(logging.INFO)

    if log_filename is not None:
        _handler = logging.FileHandler(log_filename)
        _handler.setLevel(logging.INFO)
        _handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        app.logger.addHandler(_handler)

    from .views.frontend import frontend
    app.register_blueprint(frontend)
    from .routes.plivo_urls import plivo_urls
    app.register_blueprint(plivo_urls, url_prefix='/plivourls')

    app.wsgi_app = LoggingMiddleware(app.wsgi_app, logger=app.logger)

    return app
