#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template


mod = Blueprint(
    'groundskeeper', __name__, url_prefix='/groundskeeper',
    static_folder='static', template_folder='templates', )


@mod.route('/')
def groundskeeper():
    return render_template(
        'groundskeeper/index.html'
    )
