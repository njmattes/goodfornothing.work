#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template


walldrawing = Blueprint(
    'walldrawings', __name__, url_prefix='/walldrawing',
    static_folder='static', template_folder='templates', )


@walldrawing.route('/no1')
@walldrawing.route('/2019')
def walldrawing_2019():
    return render_template(
        'walldrawing.2019.html'
    )


@walldrawing.route('/6114a')
def walldrawing_6114a():
    return render_template(
        'walldrawing.6114a.html'
    )
