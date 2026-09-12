#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
from math import floor
import numpy as np
from flask import Blueprint, render_template, session, Response


mod = Blueprint('no2', __name__,
                url_prefix='/no2',
                static_folder='static',
                template_folder='templates',
                )


@mod.route('/')
def index():
    return render_template(
        'no2.html',
    )
