#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template, request


pixilated = Blueprint(
    'pixilated', __name__, url_prefix='/pixilated',
    static_folder='static', template_folder='templates', )


@pixilated.route('/api')
def api():
    return render_template(
        'pixilated.no1.html',
        size=request.args.get('size') or 20,
        sides=request.args.get('sides') or 4,
        fg=request.args.get('user') or '0, 0, 0',
        bg=request.args.get('bg') or '255, 255, 255',
        opacity=request.args.get('opacity') or .05,
        time=request.args.get('time') or 300,
    )

@pixilated.route('/')
@pixilated.route('/no1')
def no1():
    return render_template(
        'pixilated.no1.html',
    )

@pixilated.route('/no2')
def no2():
    return render_template(
        'pixilated.no2.html',
    )

@pixilated.route('/no3')
def no3():
    return render_template(
        'pixilated.no3.html',
    )
