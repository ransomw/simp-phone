import sys
from functools import partial

from test_simp_phone.util_load_tests import load_tests_from_classes

from .base import FlaskRoutesTestsBase

class FrontendTests(FlaskRoutesTestsBase):

    def test_answer_url_exists(self):
        res = self.c.post('/plivourls/answer')
        self.assertEqual(res.status_code, 200)


load_tests = partial(load_tests_from_classes, sys.modules[__name__], [
    FrontendTests,
])
