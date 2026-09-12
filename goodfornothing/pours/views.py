#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template


mod = Blueprint('pours', __name__,
                url_prefix='/pours',
                static_folder='static',
                template_folder='templates',
                )


@mod.route('/')
@mod.route('/1')
def index():
    return render_template(
        'pours.no1.html',
    )


@mod.route('/2')
def no2():
    return render_template(
        'pours.no2.html',
    )
