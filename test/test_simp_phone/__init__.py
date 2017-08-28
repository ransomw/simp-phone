from functools import partial

from test_simp_phone.util_load_tests import load_tests_from_modules

from . import flask_routes

load_tests = partial(load_tests_from_modules, [
    flask_routes,
])
