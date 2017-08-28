from werkzeug.wrappers import Request

def format_environ(environ):
    request = Request(
        environ,
        # don't modify `environ`
        shallow=True,
        )
    return '\n'.join([
        ' '.join([
            request.method,
            request.url,
        ]),
        '----',
    ] + [
        ':'.join([name, val]) for (name, val)
        in request.headers.items()
    ] + [
        '----',
    ])
