#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
from math import floor
import numpy as np
from flask import Blueprint, render_template


mod = Blueprint('mario', __name__,
                url_prefix='/working-class-italian-gentleman',
                static_folder='static',
                template_folder='templates',
                )


@mod.route('/no1a')
def index():
    return render_template(
        # 'index.html',
        'working-class-italian-gentleman-no1a.html',
    )


@mod.route('/no2')
def no2():
    return render_template(
        # 'index.html',
        'working-class-italian-gentleman-no2.html',
    )
