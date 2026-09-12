#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template


selfie1 = Blueprint(
    'selfie1', __name__, url_prefix='/selfie1',
    static_folder='static', template_folder='templates', )


@selfie1.route('/')
def index():
    return render_template(
        'selfie1.html'
    )
