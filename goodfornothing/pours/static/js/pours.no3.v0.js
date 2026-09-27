(function() {
  /**
   Good-for-nothing (pours no. 2) [2021]
   */

  'use strict';

  const      TIMER = 100;
  const       SIZE = 4;
  let        WIDTH = window.screen.width;
  let       HEIGHT = window.screen.height;
  const  DARK_MULT = 6;  // When colors mix they also darken.
  const DARK_RANGE = 3;  // Colors randomly darken to create variety.
  const     PROB_0 = 0.02;  // The probability of a pixel in the top row being non-empty



  /**
   * Padding surrounding artwork
   * @type {{top: number, left: number, bottom: number, right: number}}
   */
  WIDTH = Math.ceil(WIDTH / 2 / SIZE) * 2;
  HEIGHT = Math.ceil(HEIGHT / 2 / SIZE) * 2;

  /**
   * Add <canvas> to <main> with width and height attributes set to
   * fill the screen. Save context and set lineCap.
   */
  const scale = window.devicePixelRatio;
  const canvas = d3
    .select('main')
    .append('canvas')
    .attr('width', WIDTH * SIZE * scale)
    .attr('height', HEIGHT * SIZE * scale)
    .attr('style', `height:${HEIGHT * SIZE}px;width:${WIDTH * SIZE}px;`);
  const ctx = canvas.node().getContext('2d');
  ctx.scale(scale, scale);
  ctx.LineCap = 'round';

  // idx_s hold values 0 or 1 indicating the presence of a colored pixel.
  // arr_s hold color data from 0 to 255. (One idx and one arr for each channel.)
  // arb_s arrays hold the previous layers (for mixing).
  // math.zeros(n) creates a 1-D array
  // math.reshape(arr, (rows, cols)) reshapes the 1-D array as a 2-D array
  let idx_r = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let idx_g = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let idx_b = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arr_r = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arr_g = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arr_b = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arb_r = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arb_g = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  let arb_b = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);

  const get_previous_row = function get_previous_row(idxs, idx) {
    /**
     * Get previous row of indexes from the array (`idxs`) given the current index (`idx`)
     * @param {number[][]} idxs - (m, n) matrix of 0s and 1s
     * @param {number} idx - Index, n, of the current row of the matrix
     * @returns {number[][]}
     */
    return math.squeeze(
      math.subset(idxs, math.index(idx - 1, math.range(0, WIDTH)))
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

  const get_new_pixel_probability = function new_pixel_probability(idx) {
    /**
     * The probability of a pixel in a new row being empty or not.
     * This probability is 100% at the top of the screen, and decreases logarithmically
     * to 50% at the bottom of the screen.
     * @param {number} idx - 0-based index of the row
     * @returns {number[]}
     */
      // TODO: Adjust this probability
    const probability = .75 ** (idx / HEIGHT);
    return [probability, 1 - probability]
  };

  const get_mean_without_zeros = function mean_without_zeros(arr) {
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

  const get_hues = function get_hues(channel, m, filled, arb, label) {
    /**
     * Determine the hues for a single channel of a single row.
     * Note that the idx argument must be >= 1.
     * @param {number[][]} channel - TKTKTK
     * @param {number} m - TKTKTK
     * @param {number[][]} filled - TKTKTK
     * @param {number[][]} arb - TKTKTK
     * @returns {}
     */
    
    let previous_row = math.subset(channel, math.index(m-1, math.range(0, WIDTH)));

    // Create three stacked rows. One has the channel value in the pixel above,
    // one the pixel above to the left, the other above to the right.
    let hues = math.concat(
      // The pixels above
      previous_row.reshape([1, WIDTH]),
      // The pixels to the left
      math.map(previous_row, function(d, i, m) {
        // If this is the first cell, get the pixel on the right edge
        // NOTE: Is this right? should it wrap around the canvas?
        return i[1] > 0
          ? math.subset(m, math.index(i[0], i[1]-1))
          : 0
      }).reshape([1, WIDTH]),
      // The pixels to the right
      math.map(previous_row, function(d, i, m) {
        // If this is the last cell, get the first pixel
        // NOTE: Is this right? should it wrap around the canvas?
        return i[1] === WIDTH - 1
          ? 0
          : math.subset(m, math.index(i[0], i[1]+1))
      }).reshape([1, WIDTH]),
      0
    );

    // For each pixel, average the three channel values above
    hues = math.apply(hues, 0, get_mean_without_zeros)
    if (label === 'R') {
      console.debug(m, 'prev_row', previous_row)
      console.debug(m, 'hues', hues)
    }

    // If pixel is 0 or 255 leave it be. Otherwise randomly lighten it between 0 and 5.
    // TODO: IS this what causes the drips to stop?
    hues = math.map(hues, function(d) {
      return d === 0
        ? 0
        : d === 255
          ? 255
          : d > 255 - DARK_RANGE
            ? d + math.pickRandom([0, 255 - d])
            : d + math.pickRandom([0, DARK_RANGE])
    });
    if (label === 'R') {
      console.debug(m, 'hues 2', hues)
    }


    // Multiply the calculated hues by the boolean filled matrix (unfilled 0 cells
    // will equal 0 and not be filled). Processes the channel array in place---the
    // return value is moot.
    channel.subset(
      math.index(m, math.range(0, WIDTH)),
      math.dotMultiply(
        hues,
        math.squeeze(math.subset(filled, math.index(m, math.range(0, WIDTH))))
      )
    )

    return hues;

  };

  const paint_first_row = function paint_first_row(row_idx, filled, channel) {
    /**
     * Create the first row.
     */
    // Create an empty row
    let mask = math.zeros(WIDTH);

    // While the row is empty (ensure that it doesn;t remain empty), fill
    // random cells based on probability PROB_0
    while (math.sum(mask) === 0) {
      mask = math.random([WIDTH]);
      math.forEach(mask, function(d, i, arr) {
        arr[i] = d < PROB_0 ? 1 : 0; });
    }

    // Replace the first row in the filled array
    filled.subset(row_idx, mask);

    // Create hues for the filled cells and add them to the channel matrix
    let hues = math.dotMultiply(
      math.subset(filled, row_idx),
      math.randomInt([1, WIDTH], 0, 191));
    channel.subset(row_idx, hues);

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
    ctx.rect(xy[0] * SIZE, xy[1] * SIZE, SIZE, SIZE);
    ctx.fill();
  };

  const make_row = function make_row(m, filled, channel, uchannel, label) {
    /**
     * Create idxs and arrs for a single row and paint it.
     * If it's the first row, call `paint_first_row()`. Otherwise,
     * - Get the indexes in the previous row that are painted
     * - Randomly walk those pixels left or right
     * - Add new painted pixels to the row with a fixed probability
     *
     * @param {number} m - 0-based index of the row to create
     * @param {number[][]} filled - {0,1} boolean determines if a pixel is drawn
     * @param {number[][]} channel - MxN matrix of values (0–255) for a single RGB channel
     * @param {number[][]} uchannel - MxN matrix of the current values of the screen, used for blending
     * @returns {}
     */

    const row_idxs = math.index(m, math.range(0, WIDTH));
    const new_pxl_prob = get_new_pixel_probability(m);

    if (m === 0) {

      return paint_first_row(row_idxs, filled, channel);

    } else {
      let previous_filled = get_previous_row(filled, m);
      let previous_idxs = get_nonwhite_idxs(previous_filled);

      // For every nonzero (painted) pixel in the previous row, Move it -2, -2, 0, 1, or 2 positions
      // horizontally
      let movement = math.randomInt([previous_idxs.length], -2, 2);
      let new_idxs = math.add(previous_idxs, movement);

      // Clamp pixels to row with
      // TODO! Refactor this into old pours code
      new_idxs = math.map(new_idxs, function (d) {
        return d >= WIDTH
          ? WIDTH - 1
          : d < 0
            ? 0
            : d;
      });

      // If there are new indexes (created by the random walk above) to be colored in the row,
      // then add 1s in their positions in the filled matrix.
      if (new_idxs.length > 0) {
        filled.subset(
          math.index(m, math.squeeze(new_idxs)),
          math.squeeze(math.ones(new_idxs.length)));
      }

      // There's a certain probability that an empty pixel in the new row will be filled.
      // TODO: Why do so many pixels get filled but not drawn? Should make this more
      //  intelligent and pick only pixels adjacent to already filled pixels.
      //  (Yes, this is what's happening because in get_hues() the hue for each cel is
      //  the average of the three cells above
      let new_row = math.map(
        math.subset(filled, row_idxs),
        function (d, i, m) {
          return d === 0 ? math.pickRandom([0, 1], new_pxl_prob) : d;
        });

      filled.subset(row_idxs, new_row);

      return get_hues(channel, m, filled, uchannel, label);

    }

  };

  const blend_row = function blend_row(m, hues) {

    const row_idx = math.index(m, math.range(0, WIDTH));

    for (let j = 0; j < WIDTH; ++j) {

      const jidx = math.index(m, j);

      // Create d3.rgb() objects for the color being painted (`over_color`)
      // and the color already in the cell (`under_color`)
      // TODO: If these aren't passed as args and are treated as globals ...
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
      // TODO: Does this value need to be added to the matrix? I think it's
      //  only being passed to fill_pxl().
      if (over_color.r + over_color.g + over_color.b < 255 * 3) {
        new_color = d3.lab(d3.interpolateLab(
          over_color,
          under_color
        )(.5)).darker((1 - under_color_hsl.l) * DARK_MULT);
      }

      math.subset(arr_r, jidx, d3.rgb(new_color).r);
      math.subset(arr_g, jidx, d3.rgb(new_color).g);
      math.subset(arr_b, jidx, d3.rgb(new_color).b);

      fill_pxl(new_color + '', [j, m]);

    }

    // arb_r.subset(row_idx, math.subset(arr_r, row_idx));
    // arb_g.subset(row_idx, math.subset(arr_g, row_idx));
    // arb_b.subset(row_idx, math.subset(arr_b, row_idx));

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
    for (let [idxs, arr, arb, label] of [
      [idx_r, arr_r, arb_r,  'R'], [idx_g, arr_g, arb_g, 'G'], [idx_b, arr_b, arb_b, 'B']
    ]) {

      hues = make_row(idx, idxs, arr, arb, label);
      empty_channels += math.sum(idxs)
    }

    if (hues === false) {
      idx = HEIGHT;
    } else {
      blend_row(idx, hues);
      ++idx;
    }



    if (idx === HEIGHT || empty_channels === 0) {
      idx = 0;
      idx_r = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
      idx_g = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
      idx_b = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
    }

    // else { setTimeout(draw.bind({}, t, idx), timer); }
    setTimeout(draw.bind({}, t, idx), TIMER);

  }

  draw(TIMER, 0);

})();
