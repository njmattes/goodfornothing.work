#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template, request


pixilated = Blueprint(
    'pixilated', __name__, url_prefix='/pixilated',
    static_folder='static', template_folder='templates', )


@pixilated.route('/')
def index():
    return render_template(
        'pixilated.no1.html',
        size=request.args.get('size') or 20,
        sides=request.args.get('sides') or 4,
        fg=request.args.get('user') or '0, 0, 0',
        bg=request.args.get('bg') or '255, 255, 255',
        opacity=request.args.get('opacity') or .05,
        time=request.args.get('time') or 300,
    )
