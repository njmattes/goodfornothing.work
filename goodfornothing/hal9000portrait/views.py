#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Blueprint, render_template


mod = Blueprint('hal9000portrait', __name__,
                url_prefix='/hal9000portrait',
                static_folder='static',
                template_folder='templates',
                )


@mod.route('/')
def index():
    return render_template(
        'hal9000.html'
    )
