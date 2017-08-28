import unittest

from simp_phone.flask_app import create_app

class FlaskRoutesTestsBase(unittest.TestCase):

    def setUp(self):
        app = create_app()
        self.c = app.test_client()
