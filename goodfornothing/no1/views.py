#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
from math import floor
import numpy as np
from flask import Blueprint, render_template


mod = Blueprint('no1', __name__,
                url_prefix='/no1',
                static_folder='static',
                template_folder='templates',
                )


@mod.route('/')
@mod.route('/color/<cg>')
@mod.route('/color/<cg>/<int:size>')
@mod.route('/color/<cg>/<int:size>/<int:number>')
@mod.route('/color/<cg>/<int:size>/<int:number>/<int:timer>')
@mod.route('/color/<cg>/<int:size>/<int:number>/<int:timer>/<int:threshold>')
@mod.route('/color/<cg>/<int:size>/<int:number>/<int:timer>/<int:threshold>/'
           '<int:network>')
@mod.route('/color/<cg>/size/<int:size>/number/<int:number>/timer/<int:timer>/'
           'threshold/<int:threshold>/network/<int:network>')
def index(cg='g', size=20, number=10, timer=20, threshold=30, network=3):
    return render_template(
        'no1.html',
        size=size,
        number=number,
        timer=timer,
        threshold=threshold,
        network=network,
        cg=cg,
    )
