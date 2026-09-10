#!/usr/bin/env python
# -*- coding: utf-8 -*-
import numpy as np


class D5Channel(object):
    def __init__(self, width, height, channel_name):
        self._width = width
        self._height = height
        self._channel_name = channel_name
        self._n0 = .001
        self.idxs = np.zeros((height, width))
        self._array = np.zeros((height, width))

    @property
    def width(self):
        return self._width

    @property
    def height(self):
        return self._height

    @property
    def channel_name(self):
        return self._channel_name

    @property
    def array(self):
        """Array of all pixels in the channel.

        :return:
        :rtype: np.array
        """
        return self._array

    @property
    def n0(self):
        """Density of new pixels in the initial row.

        :return: Density of new pixels in the initial row.
        :rtype: float
        """
        return self._n0

    @n0.setter
    def n0(self, value):
        self._n0 = value

    def new_pixel_probability(self, idx):
        probs = [
            [.5 ** (idx / self.height / 4),
             1 - .5 ** (idx / self.height / 4)],
            [1 - .5 ** (idx / self.height / 4),
             .5 ** (idx / self.height / 4)],
            [.5 ** (idx / self.height / 1),
             1 - .5 ** (idx / self.height / 1)],
            [.9, .1],
            [.5 ** (idx / self.height / .1),
             1 - .5 ** (idx / self.height / .1)],
            [.33 ** (idx / self.height / .1),
             1 - .33 ** (idx / self.height / .1)],
            [.1 ** (idx / self.height / .1),
             1 - .1 ** (idx / self.height / .1)],
            [.001 ** (idx / self.height),
             1 - .001 ** (idx / self.height)],
        ]
        # return probs[2]
        return probs[0]

    def initial_row(self):
        """Build an initial row of randomly spaced pixels. The row contains
        only Boolean values for which pixels or colored vs. empty. It does
        not contain color or value information.

        :return: Row of pixels
        :rtype: np.array
        """
        mask = np.random.random(self.width)
        mask[mask < self.n0] = 1
        mask[mask < 1] = 0
        self.idxs[0] = mask

    def new_row(self, idx):
        """Build a row of pixels based on the previous row, Each pixel in the
        previous row will make a random walk. The row contains
        only Boolean values for which pixels or colored vs. empty. It does
        not contain color or value information.

        For each empty pixel in the row, there is a probability that a new
        pixel will appear. This is determined by `self.new_pixel_probability()`
        and can be varied by row index (e.g. so more new pixels appear on
        later rows).

        :param idx: Index of row that is being built
        :type idx: int
        :return: Row of pixels
        :rtype: np.array
        """
        previous = self.idxs[idx-1]
        # print('previous:', previous)
        non_white_idxs = np.where(previous > 0)[0]
        # print('non_wht_indxs:', non_white_idxs)
        movement = np.random.choice([-1, 0, 1], len(non_white_idxs))
        # print('movement:', movement)
        new_idxs = non_white_idxs + movement
        # print('new_idxs:', new_idxs)
        new_idxs[new_idxs >= self.width] = self.width - 1
        # print('new_idxs:', new_idxs)
        new_idxs[new_idxs < 0] = 0
        # print('new_idxs:', new_idxs)
        # print('self.idxs[idx, :]:', self.idxs[idx, :])
        self.idxs[idx, new_idxs] = 1
        # print('self.idxs[idx, :]:', self.idxs[idx, :])
        self.idxs[idx, self.idxs[idx] == 0] = np.random.choice(
            [0, 1], len(self.idxs[idx, self.idxs[idx] == 0]),
            p=self.new_pixel_probability(idx)
        )
        # print('self.idxs[i-1, :]:', self.idxs[idx-1, :])
        # print('self.idxs[idx, :]:', self.idxs[idx, :])

    def color(self):
        self.array[0] = self.idxs[0] * np.random.randint(0, 255, self.width)
        for i in range(1, self.height):
            hues = np.vstack((
                self.array[i-1],
                np.roll(self.array[i-1], 1),
                np.roll(self.array[i-1], -1),
            ))
            hues[hues == 0] = np.nan
            hues = np.nanmean(hues, axis=0)
            hues += np.random.choice([-2, 2], self.width)
            self.array[i] = hues * self.idxs[i]

    def make_idxs(self):
        self.initial_row()
        for i in range(1, self.height):
            self.new_row(i)

    def make_channel(self):
        self.idxs = np.zeros((self.height, self.width))
        self._array = np.zeros((self.height, self.width))
        self.make_idxs()
        self.color()
        return np.uint8(np.flip(self.array, axis=0))


if __name__ == '__main__':
    from PIL import Image
    from datetime import datetime

    resolution = 300
    height = 44 * resolution / 2
    width = 60 * resolution / 2

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

    image_k.save('out_g.jpg', 'JPEG')

    image = Image.merge(mode='CMYK', bands=[image_c, image_m, image_y, image_k])

    image.save('{:%y%m%d-%H%M%S}-0-001-gfn-out-cmyk.jpg'.format(datetime.now()), 'JPEG')

    # image = Image.merge(mode='RGB', bands=[image_c, image_m, image_y])
    # image.save('out.png', 'PNG')
