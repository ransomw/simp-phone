from .environ import format_environ

class LoggingMiddleware(object):
    """ WSGI logging middleware """

    def __init__(self, app, logger):
        self._logger = logger
        self._app = app

    def __call__(self, environ, start_response):
        self._logger.info('\n' + format_environ(environ) + '\n')
        return self._app(environ, start_response)
