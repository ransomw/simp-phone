from flask import Blueprint

frontend = Blueprint(
    'frontend', __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/frontend',
    )

from . import views

__all__ = [
    'frontend',
]
