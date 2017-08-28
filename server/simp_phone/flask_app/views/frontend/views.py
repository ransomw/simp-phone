from flask import render_template

from . import frontend


@frontend.route('/', methods=['GET'])
def home():
    return render_template('simp_phone/home.html')
