from functools import partial

from test_simp_phone.util_load_tests import load_tests_from_modules

from . import frontend
from . import plivo_urls

load_tests = partial(load_tests_from_modules, [
    frontend,
    plivo_urls,
])



