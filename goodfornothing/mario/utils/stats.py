#!/usr/bin/env python
# -*- coding: utf-8 -*-
from datetime import datetime
import numpy as np
from PIL import Image
# from marios.smb2 import MARIO as MARIO2
from marios.dk import MARIO as MARIODK
from marios.dk import COLORS
from neighbors import neighbors


def get_prob_of_pixel_in_rank(arr, find):
    return np.where(arr == find)[0].shape[0] / arr.shape[0]


def get_unique_colors(arr):
    return np.unique(arr)


def get_probability_matrix1(arr):
    height, width = arr.shape
    colors = len(get_unique_colors(arr))
    vert = dict()
    horiz = dict()
    tmp_position_probs = np.zeros((height, width, colors))
    matrix_probs = np.zeros((3, 3, colors, colors))  # 3 by 3 by color depth by color depth

    idxs = np.unique(arr)
    for i in range(height):
        # get probability of pixels at a certain height
        vert[i] = {c: get_prob_of_pixel_in_rank(arr[i], c)
                   for c in np.unique(arr)}
        for j in range(width):
            if i == 0:
                # get probability of pixels at a certain pan
                horiz[j] = {c: get_prob_of_pixel_in_rank(arr[:, j], c)
                            for c in np.unique(arr)}
            tmp_position_probs[i, j, arr[i, j]] += 1

            # Get 3x3 index
            idxs = np.array([i, j]) + neighbors
            # Remove indexes outside image
            idxs = idxs[np.all(idxs >= 0, axis=1) * (idxs[:, 1] < width) * (idxs[:, 0] < height)]

            for m, n in idxs:
                matrix_probs[m-i, n-j, arr[m, n], arr[i, j]] += 1

    position_probs = np.zeros((height, width, colors))
    print(tmp_position_probs[7:11, 6])
    for i in range(height):
        for j in range(width):
            row = tmp_position_probs[i, :].sum(axis=0)
            col = tmp_position_probs[:, j].sum(axis=0)
            prb = (row / row.sum()) * (col / col.sum())
            prb = prb ** 10
            position_probs[i, j] = prb / prb.sum()

    print(position_probs[7:11, 6])
    return position_probs, matrix_probs


def get_probability_matrix(arr):
    height, width = arr.shape
    colors = len(get_unique_colors(arr))
    vert = dict()
    horiz = dict()
    tmp_position_probs = np.zeros((height, width, colors))
    matrix_probs = np.zeros((3, 3, colors, colors))  # 3 by 3 by color depth by color depth

    idxs = np.unique(arr)
    for i in range(height):
        # get probability of pixels at a certain height
        vert[i] = {c: get_prob_of_pixel_in_rank(arr[i], c)
                   for c in np.unique(arr)}
        for j in range(width):
            if i == 0:
                # get probability of pixels at a certain pan
                horiz[j] = {c: get_prob_of_pixel_in_rank(arr[:, j], c)
                            for c in np.unique(arr)}
            tmp_position_probs[i, j, arr[i, j]] += 1

            # Get 3x3 index
            idxs = np.array([i, j]) + neighbors
            # Remove indexes outside image
            idxs = idxs[np.all(idxs >= 0, axis=1) * (idxs[:, 1] < width) * (idxs[:, 0] < height)]

            for m, n in idxs:
                matrix_probs[m-i, n-j, arr[m, n], arr[i, j]] += 1

    position_probs = np.zeros((height, width, colors))

    for i in range(height):
        for j in range(width):
            if i == 0 or i == height - 1:
                position_probs[i, j] = np.array([0, 0, 0, 1])
            elif j == 0 or j == width - 1:
                position_probs[i, j] = np.array([0, 0, 0, 1])
            else:
                prb = tmp_position_probs[i-1:i+2, j-1:j+2] *\
                      np.array([[1, 4, 1], [4, 16, 4], [1, 4, 1]])[..., np.newaxis]
                      # np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]])[..., np.newaxis]
                prb = prb.sum(axis=0).sum(axis=0)
                position_probs[i, j] = prb / prb.sum()

    return position_probs, matrix_probs


def pick_idx_from_rnd_arr(arr):
    if arr.sum() != 1:
        arr = arr / arr.sum()

    x = np.random.random()
    idx = 0
    cumsum = arr[idx]

    while cumsum < x:
        cumsum += arr[idx+1]
        idx += 1

    return idx


def stats_to_json(arr):
    import json
    height, width = arr.shape
    colors = len(get_unique_colors(arr))
    position_probs, matrix_probs = get_probability_matrix(arr)
    with open('stats.json', 'w') as f:
        f.write(
            json.dumps(dict(
                position_probs=position_probs.tolist(),
                matrix_probs=matrix_probs.tolist(),
            ), indent=2)
        )


def make_random_mario(arr):
    # Pass in the original Mario as an array. Get its height and width.
    height, width = arr.shape
    # Get the number of colors in the original.
    colors = len(get_unique_colors(arr))
    # Get the probabilities
    position_probs, matrix_probs = get_probability_matrix(arr)

    # Make a new array with the same size, filled with 99s
    new_arr = np.ones((height, width), dtype=int) * 99

    # Cycle through each pixel in the new array in random order
    rand_idxs = [x for x in range(height*width)]
    rand_idxs.sort(key=lambda x: np.random.random())

    for k in rand_idxs:

        # Get the row and column indexes
        i = int(np.floor(k / width))
        j = int(np.mod(k, width))
        # Make an empty array to hold the probability of each color
        prob = np.ones(colors)

        # Get the indexes of the neighbors
        idxs = np.array([i, j]) + neighbors
        idxs = idxs[np.all(idxs >= 0, axis=1) * (idxs[:, 1] < width) * (
                idxs[:, 0] < height)]

        for m, n in idxs:
            # print(m, n)
            if arr[m, n] != 99:
                p = matrix_probs[m - i, n - j, arr[i, j]]
                prob += p / np.sum(p)

        prob *= position_probs[i, j]
        new_arr[i, j] = pick_idx_from_rnd_arr(prob)

    return new_arr


def make_image(arr):
    arr = make_random_mario(arr)
    # img = make_large_image(arr)
    img = make_card_back_image(arr)
    img.save('../output/card_back/MARIO-dk-{}.png'.format(datetime.now()))
    # img.show()


def make_small_image(arr):
    shp = tuple(reversed(arr.shape))

    img = Image.new('RGB', shp, 'white')  # Cr
    # eate a new black image
    pixels = img.load()  # Create the pixel map
    for i in range(shp[0]):  # For every pixel:
        for j in range(shp[1]):
            pxl = COLORS[arr[j][i]]  # Set the colour accordingly
            pixels[i, j] = pxl


def make_large_image(arr):
    scale = 10
    shp = np.array(tuple(reversed(arr.shape))) * scale
    shp = tuple(shp)

    img = Image.new('RGB', shp, 'white')  # Create a new black image
    pixels = img.load()  # Create the pixel map
    for i in range(shp[0]):    # For every pixel:
        for j in range(shp[1]):
            ii = int(np.floor(i/scale))
            jj = int(np.floor(j/scale))
            pxl = COLORS[arr[jj][ii]]  # Set the colour accordingly
            pixels[i, j] = pxl

    return img


def make_card_back_image(arr):
    scale = 35
    shp = np.array(tuple(reversed(arr.shape)))
    canvas = shp + np.array([10, 6])
    canvas *= scale
    canvas = tuple(canvas)
    shp *= scale
    shp = tuple(shp)

    img = Image.new('RGB', canvas, 'white')  # Create a new black image
    pixels = img.load()  # Create the pixel map
    for i in range(shp[0]):    # For every pixel:
        for j in range(shp[1]):
            ii = int(np.floor(i/scale))
            jj = int(np.floor(j/scale))
            pxl = COLORS[arr[jj][ii]]  # Set the colour accordingly
            pixels[5*scale+i, 3*scale+j] = pxl

    return img


if __name__ == '__main__':
    # print(get_probability_matrix(MARIO2))
    # print(get_unique_colors(MARIO2))
    # print(make_random_mario(MARIO2))
    # for i in range(127):
    #     make_image(MARIODK)
    stats_to_json(MARIODK)
