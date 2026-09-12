(function() {
  /**
   Good-for-nothing (pours no. 2) [2021]
   */

  'use strict';

  const timer = 300;
  const size = 40;
  let width = window.screen.width;
  let height = window.screen.height;

  /**
   * Padding surrounding artwork
   * @type {{top: number, left: number, bottom: number, right: number}}
   */
  width = Math.ceil(width / 2 / size) * 2;
  height = Math.ceil(height / 2 / size) * 2;

  /**
   * Add <canvas> to <main> with width and height attributes set to
   * fill the screen. Save context and set lineCap.
   */
  const scale = window.devicePixelRatio;
  const canvas = d3
    .select('main')
    .append('canvas')
    .attr('width', width * size * scale)
    .attr('height', height * size * scale)
    .attr('style', `height:${height * size}px;width:${width * size}px;`);
  const ctx = canvas.node().getContext('2d');
  ctx.scale(scale, scale);
  ctx.LineCap = 'round';

  // The probability of a pixel in the top row being non-empty
  const n0 = 0.02;

  // idx_s hold values 0 or 1 indicating the presence of a colored pixel.
  // arr_s hold color data from 0 to 255. (One idx and one arr for each channel.)
  // arb_s arrays hold the previous layers (for mixing).
  // math.zeros(n) creates a 1-D array
  // math.reshape(arr, (rows, cols)) reshapes the 1-D array as a 2-D array
  let idx_r = math.reshape(math.zeros(height * width), [height, width]);
  let idx_g = math.reshape(math.zeros(height * width), [height, width]);
  let idx_b = math.reshape(math.zeros(height * width), [height, width]);
  let arr_r = math.reshape(math.zeros(height * width), [height, width]);
  let arr_g = math.reshape(math.zeros(height * width), [height, width]);
  let arr_b = math.reshape(math.zeros(height * width), [height, width]);
  let arb_r = math.reshape(math.zeros(height * width), [height, width]);
  let arb_g = math.reshape(math.zeros(height * width), [height, width]);
  let arb_b = math.reshape(math.zeros(height * width), [height, width]);

  const get_previous_row = function get_previous_row(idxs, idx) {
    /**
     * Get previous row of indexes from the array (`idxs`) given the current index (`idx`)
     * @param {number[][]} idxs - (m, n) matrix of 0s and 1s
     * @param {number} idx - Index, n, of the current row of the matrix
     * @returns {number[][]}
     */
    return math.squeeze(
      math.subset(idxs, math.index(idx - 1, math.range(0, width)))
    );
  }

  const get_nonwhite_idxs = function get_nonwhite_idxs(previous) {
    /**
     * Given a row of pixels (`previous`) return the indices of the non-zero pixels.
     * @type {number[]} previous - The 0-based indexes of non-zero values in a row
     * @returns {number[]}
     */
    let non_white_idxs = [];
    math.forEach(
      previous,
      // NOTE: In the callback below, i is an array not an integer,
      function(d, i) { if (d > 0) { non_white_idxs.push(i[0]); } });
    return non_white_idxs
  }

  const new_pixel_probability = function new_pixel_probability(idx) {
    /**
     * The probability of a pixel in a new row being empty or not.
     * This probability is 100% at the top of the screen, and decreases logarithmically
     * to 50% at the bottom of the screen.
     * @param {number} idx - 0-based index of the row
     * @returns {number[]}
     */
    const probability = .5 ** (idx / height);
    return [probability, 1 - probability]
  };

  const mean_without_zeros = function mean_without_zeros(arr) {
    /**
     * Calculate the mean of the columns of a matrix ignoring zero values.
     * This is a bad implementation of np.nanmean()
     * @returns {number} The mean of the TKTKK
     */
    const filter = arr.filter(d => d !== 0);
    if (filter.length === 0) {
      return 0;
    }
    const sum = filter.reduce((a, b) => a + b);
    return sum / filter.length;
  }

  const get_hues = function get_hues(arr, idx, idxs, arb) {
    /**
     * Determine the hues for a single channel of a single row.
     * Note that the idx argument must be >= 1.
     * @param {number[]} arr - TKTKTK
     * @param {number} arr - TKTKTK
     * @param {number[]} arr - TKTKTK
     * @param {number[]} arr - TKTKTK
     * @returns {}
     */
    
    let row = math.subset(arr, math.index(idx-1, math.range(0, width)));

    // Create three stacked rows. One has the channel value in the pixel above,
    // one the pixel to the left, the other to the right.
    let hues = math.concat(
      // The pixels above
      row.reshape([1, width]),
      // The pixels to the left
      math.map(row, function(d, i, m) {
        // If this is the first cell, get the pixel on the right edge
        // NOTE: Is this right? should it wrap around the canvas?
        return i[1] > 0
          ? math.subset(m, math.index(i[0], i[1]-1))
          : math.subset(m, math.index(i[0], width-1))
      }).reshape([1, width]),
      // The pixels to the right
      math.map(row, function(d, i, m) {
        // If this is the last cell, get the first pixel
        // NOTE: Is this right? should it wrap around the canvas?
        return i[1] === width - 1
          ? math.subset(m, math.index(i[0], 0))
          : math.subset(m, math.index(i[0], i[1]+1))
      }).reshape([1, width]),
      0
    );

    // For each pixel, average the three channel values above
    hues = math.apply(hues, 0, mean_without_zeros)

    // For each pixel randomly move the channel by 2
    hues = math.map(hues, function(d) {
      return d === 0
        ? 0
        : d + math.pickRandom([0, 5])
    });

    // I think this is turning off a small amount of random pixels in the row.
    arr.subset(
      math.index(idx, math.range(0, width)),
      math.dotMultiply(
        hues,
        math.squeeze(math.subset(idxs, math.index(idx, math.range(0, width))))
      )
    )

    return hues;

  };

  const paint_first_row = function paint_first_row(ridx, idxs, arr) {
    /**
     * Create the first row.
     */
    console.log(ridx, idxs, arr)
    let mask = math.zeros(width);
    while (math.sum(mask) === 0) {
      mask = math.random([width]);
      math.forEach(mask, function(d, i, arr) { arr[i] = d < n0 ? 1 : 0; });
    }
    idxs.subset(ridx, mask);
    let hues = math.dotMultiply(
      math.subset(idxs, ridx),
      math.randomInt([1, width], 0, 191));

    arr.subset(ridx, hues);

    return hues;

  };

  const fill_pxl = function fill_pxl(rgb, xy) {
    /**
     * Paint a pixel on the <canvas>
     * @param {number[]} rgb - A 3-tuple of RGB values
     * @param {number[]} xy - A 2-tuple containing the indices of the cells.
     * @returns {null}
     */
    // ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
    ctx.fillStyle = rgb;
    ctx.beginPath();
    ctx.rect(xy[0] * size, xy[1] * size, size, size);
    ctx.fill();
  };

  const make_row = function make_row(idx, idxs, arr, arb) {
    /**
     * Create idxs and arrs for a single row and paint it.
     * If it's the first row, call `paint_first_row()`. Otherwise,
     * - Get the indexes in the previous row that are painted
     * - Randomly walk those pixels left or right
     * - Add new painted pixels to the row with a fixed probability
     *
     * @param {number} idx - 0-based index of the row to create
     * @param {number[][]} idxs - {0,1} boolean determines if a pixel is drawn
     * @param {number[][]} arr - MxN matrix of values (0–255) for a single RGB channel
     * @param {number[][]} arb - TKTKTK
     * @returns {}
     */

    const row_idx = math.index(idx, math.range(0, width));
    const new_pxl_prob = new_pixel_probability(idx);

    if (idx === 0) {

      return paint_first_row(row_idx, idxs, arr);

    } else {

      let previous = get_previous_row(idxs, idx);
      let non_white_idxs = get_nonwhite_idxs(previous);

      // Random walk as the pixels descend
      let movement = math.randomInt([non_white_idxs.length], -2, 2);
      let new_idxs = math.add(non_white_idxs, movement);

      // Clamp pixels to row with
      // TODO! Refactor this into old pours code
      new_idxs = math.map(new_idxs, function (d) {
        return d >= width
          ? width - 1
          : d < 0
            ? 0
            : d;
      });

      if (new_idxs.length > 0) {
        idxs.subset(
          math.index(idx, math.squeeze(new_idxs)),
          math.squeeze(math.ones(new_idxs.length)));
      }

      let new_row = math.map(
        math.subset(idxs, row_idx),
        function (d, i, m) {
          return d === 0 ? math.pickRandom([0, 1], new_pxl_prob) : d;
        });

      idxs.subset(row_idx, new_row);

      return get_hues(arr, idx, idxs, arb);

    }

  };

  const blend_row = function blend_row(idx, hues) {

    const r_idx = math.index(idx, math.range(0, width));

    for (let j = 0; j < width; ++j) {

      const jidx = math.index(idx, j);

      // Create d3.rgb() objects for the color being painted (`over_color`)
      // and the color already in the cell (`under_color`)
      let under_color = d3.rgb(
        255 - arb_r.subset(jidx),
        255 - arb_g.subset(jidx),
        255 - arb_b.subset(jidx),
      );
      let over_color = d3.rgb(
        255 - arr_r.subset(jidx),
        255 - arr_g.subset(jidx),
        255 - arr_b.subset(jidx),
      );

      // Convert the d3.rgb() objects to HSL
      const under_color_hsl = d3.hsl(over_color);
      const over_color_hsl = d3.hsl(under_color);

      //  Approximate opacity from lightness
      under_color.opacity = (1 - under_color_hsl.l);
      over_color.opacity = (1 - over_color_hsl.l);

      // Assume the new color is the same as the under color
      // NOTE: Why are we adding an empty string? Why isn't this
      // an else condition in the following block?
      let new_color = under_color + '';

      // If the new color isn't white, interpolate the half way
      // point between the two colors, and then darken it
      // NOTE: again with the string coercion at the end of the value
      if (over_color.r + over_color.g + over_color.b < 255 * 3) {
        new_color = d3.lab(d3.interpolateLab(
          over_color,
          under_color
        )(.5)).darker((1 - under_color_hsl.l) * 10) + '';
      }

      fill_pxl(new_color, [j, idx]);

    }

    arb_r.subset(r_idx, math.subset(arr_r, r_idx));
    arb_g.subset(r_idx, math.subset(arr_g, r_idx));
    arb_b.subset(r_idx, math.subset(arr_b, r_idx));

  };

  const draw = function draw(t, idx) {
    /**
     * Bootstraps the drawing. Iterates through each channel. Creates a row
     * for each channel. Then calls itself again. When it fills the height,
     * it starts over at 0.
     * @param {number} t - length of time between each row being drawn
     * @param {number} idx - 0-based index of the row currently being drawn
     * @returns {null}
     */

    // let hues = math.reshape(math.zeros(height * width * 3), [height, width, 3]);
    let hues = math.matrix([]);

    let empty_channels = 0;

    // Make arrays of red, green, and blue values for each cell in the row
    for (let [idxs, arr, arb] of [
      [idx_r, arr_r, arb_r], [idx_g, arr_g, arb_g], [idx_b, arr_b, arb_b]
    ]) {

      // hues = math.concat(hues, make_row(idx, idxs, arr, arb));
      make_row(idx, idxs, arr, arb);

    }

    blend_row(idx, hues);

    ++idx;

    if (idx === height) {
      idx = 0;
      idx_r = math.reshape(math.zeros(height * width), [height, width]);
      idx_g = math.reshape(math.zeros(height * width), [height, width]);
      idx_b = math.reshape(math.zeros(height * width), [height, width]);
    }

    setTimeout(draw.bind({}, t, idx), timer);

  }

  draw(timer, 0);

})();
