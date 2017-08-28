import sys
from functools import partial

from bs4 import BeautifulSoup as BS

from test_simp_phone.util_load_tests import load_tests_from_classes

from .base import FlaskRoutesTestsBase

def _get_page_asset_urls(str_html):
    soup = BS(str_html, 'html.parser')
    return [
        t.attrs['src'] for t in soup.find_all('script')
    ] + [
        t.attrs['href'] for t in soup.find_all('link')
        if 'stylesheet' in t.attrs['rel']
    ]


class FrontendTests(FlaskRoutesTestsBase):

    def test_get_page_home(self):
        res_page = self.c.get('/')
        self.assertEqual(res_page.status_code, 200)
        for asset_url in _get_page_asset_urls(
                res_page.data.decode('utf-8')):
            res_asset = self.c.get('/')
            self.assertEqual(res_asset.status_code, 200)


load_tests = partial(load_tests_from_classes, sys.modules[__name__], [
    FrontendTests,
])
