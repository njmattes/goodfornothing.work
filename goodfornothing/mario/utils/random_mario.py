import numpy as np
from PIL import Image


class RandomMario(object):
    def __init__(self, mario_arr, color_arr):
        self._mario_arr = mario_arr
        self._color_arr = color_arr
        self._shape = self._mario_arr.shape
        self._colors_n = None
        self._tmp_position_probabilities = None
        self._position_probabilities = None
        self._matrix_probabilities = None

    @property
    def mario_arr(self):
        return self._mario_arr

    @property
    def color_arr(self):
        return self._color_arr

    @property
    def shape(self):
        return self._shape

    @property
    def height(self):
        return self.shape[0]

    @property
    def colors_n(self):
        if self._colors_n is None:
            self._colors_n = len(self.get_unique_colors(self.mario_arr))
        return self._colors_n

    @property
    def width(self):
        return self.shape[1]

    @property
    def neighbors(self):
        return np.array([
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1],
        ])

    @property
    def tmp_position_probabilities(self):
        if self._tmp_position_probabilities is None:
            self._tmp_position_probabilities = self.get_tmp_position_probabilities()
        return self._tmp_position_probabilities

    @property
    def matrix_probabilities(self):
        """A 3 by 3 by 4 by 4 matrix (self.neighbors by self.colors_n by self.colors_n)
        For any pixel, p[i, j], This matrix returns a probability distribution P that p
        will be TKTKTKTK

        MATRIX[neighbor[m], neighbor[n], C

        """
        if self._matrix_probabilities is None:
            self._matrix_probabilities = self.get_matrix_probabilities()
        return self._matrix_probabilities

    @property
    def position_probabilities(self):
        if self._position_probabilities is None:
            self._position_probabilities = self.get_tmp_position_probabilities()
        return self._position_probabilities

    @staticmethod
    def get_unique_colors(arr):
        return np.unique(arr)

    @staticmethod
    def get_prob_of_pixel_in_rank(arr, find):
        return np.where(arr == find)[0].shape[0] / arr.shape[0]

    @staticmethod
    def pick_idx_from_rnd_arr(arr):
        if arr.sum() != 1:
            arr = arr / arr.sum()

        x = np.random.random()
        idx = 0
        cumsum = arr[idx]

        while cumsum < x:
            cumsum += arr[idx + 1]
            idx += 1

        return idx

    def make_image(self, arr, scale=1):
        shp = np.array(tuple(reversed(arr.shape))) * scale
        shp = tuple(shp)
        img = Image.new('RGB', shp, 'white')  # Create a new black image
        pixels = img.load()  # Create the pixel map
        for i in range(shp[0]):  # For every pixel:
            for j in range(shp[1]):
                ii = int(np.floor(i / scale))
                jj = int(np.floor(j / scale))
                pxl = self.color_arr[arr[jj][ii]]  # Set the colour accordingly
                pixels[i, j] = pxl
        return img

    def get_tmp_position_probabilities(self):
        tmp_position_probabilities = np.zeros((self.height, self.width, self.colors_n))
        for i in range(self.height):
            for j in range(self.width):
                tmp_position_probabilities[i, j, self.mario_arr[i, j]] += 1
        return tmp_position_probabilities

    def get_matrix_probabilities(self):
        matrix_probabilities = np.zeros((3, 3, self.colors_n, self.colors_n))  # 3 by 3 by color depth by color depth
        for i in range(self.height):
            for j in range(self.width):
                # Get 3x3 index
                idxs = np.array([i, j]) + self.neighbors
                # Remove indexes outside image
                idxs = idxs[np.all(idxs >= 0, axis=1) * (idxs[:, 1] < self.width) * (idxs[:, 0] < self.height)]
                for m, n in idxs:
                    matrix_probabilities[m - i, n - j, self.mario_arr[m, n], self.mario_arr[i, j]] += 1
        return matrix_probabilities

    def get_position_probabilities(self):
        position_probabilities = np.zeros((self.height, self.width, self.colors_n))
        for i in range(self.height):
            for j in range(self.width):
                if i == 0 or i == self.height - 1:
                    position_probabilities[i, j] = np.array([0, 0, 0, 1])
                elif j == 0 or j == self.width - 1:
                    position_probabilities[i, j] = np.array([0, 0, 0, 1])
                else:
                    prb = self.tmp_position_probabilities[i - 1:i + 2, j - 1:j + 2] * \
                          np.array([[1, 4, 1], [4, 16, 4], [1, 4, 1]])[..., np.newaxis]
                    # np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]])[..., np.newaxis]
                    prb = prb.sum(axis=0).sum(axis=0)
                    position_probabilities[i, j] = prb / prb.sum()
        return position_probabilities

    def make_random_mario(self):
        # Make a new array with the same size, filled with 99s
        new_arr = np.ones(self.shape, dtype=int) * 99

        # Cycle through each pixel in the new array in random order
        rand_idxs = [x for x in range(self.height * self.width)]
        rand_idxs.sort(key=lambda x: np.random.random())

        for k in rand_idxs:

            # Get the row and column indexes
            i = int(np.floor(k / self.width))
            j = int(np.mod(k, self.width))
            # Make an empty array to hold the probability of each color
            prob = np.ones(self.colors_n)

            # Get the indexes of the neighbors
            idxs = np.array([i, j]) + self.neighbors
            idxs = idxs[np.all(idxs >= 0, axis=1) * (idxs[:, 1] < self.width) * (
                    idxs[:, 0] < self.height)]

            for m, n in idxs:
                # print(m, n)
                if self.mario_arr[m, n] != 99:
                    p = self.matrix_probabilities[m - i, n - j, self.mario_arr[i, j]]
                    prob += p / np.sum(p)

            prob *= self.position_probabilities[i, j]
            new_arr[i, j] = self.pick_idx_from_rnd_arr(prob)

        return new_arr


if __name__ == '__main__':
    import json
    from marios.dk import MARIO
    from marios.dk import COLORS
    random_mario = RandomMario(MARIO, COLORS)
    print(random_mario.matrix_probabilities)
    with open('foo.json', 'w') as f:
        json.dump(obj={'probs': random_mario.matrix_probabilities.tolist()}, fp=f)


