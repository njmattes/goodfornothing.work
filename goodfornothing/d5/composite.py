#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime
import numpy as np
from PIL import Image
from new_channel import D5Channel


class D5CMYKComposite(object):
    def __init__(self, width, height, resolution=300):
        self.height = height
        self.width = width
        self.resolution = resolution

    def make_channels(self):
        height = self.height * self.resolution
        width = self.width * self.resolution

        w, h = np.array([width, height], dtype=int)
        # w, h = np.array([1612, 2550], dtype=np.int)
        channel = D5Channel(w, h, 'C')
        channel.n0 = .001
        arr = channel.make_channel()
        image_c = Image.fromarray(arr, mode='L')
        arr = channel.make_channel()
        image_m = Image.fromarray(arr, mode='L')
        arr = channel.make_channel()
        image_y = Image.fromarray(arr, mode='L')
        arr = channel.make_channel()
        image_k = Image.fromarray(arr, mode='L')

    def save_image(self):
        image_k.save('out_g.jpg', 'JPEG')

        image = Image.merge(mode='CMYK',
                            bands=[image_c, image_m, image_y, image_k])

        image.save(
            '{:%y%m%d-%H%M%S}-0-001-gfn-out-cmyk.jpg'.format(datetime.now()),
            'JPEG')