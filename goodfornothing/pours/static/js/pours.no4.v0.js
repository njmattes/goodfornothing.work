(function() {
  /**
   Good-for-nothing (pours no. 2) [2021]
   */

  'use strict';

  const      TIMER = 100;
  const       SIZE = 16;
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

  // FILLED hold values 0 or 1 indicating the presence of a colored pixel.
  // CHANNELS hold color data from 0 to 255. (One idx and one arr for each channel.)
  // UCHANNELS arrays hold the previous layers (for mixing).
  let FILLED = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
  const N_CHAN = 4;
  let CHANNELS = math.reshape(
    math.zeros(HEIGHT * WIDTH * N_CHAN),
    [HEIGHT, WIDTH, N_CHAN]);
  let UCHANNELS = math.matrix(math.matrixFromColumns(
    math.ones(WIDTH * HEIGHT),
    math.zeros(WIDTH * HEIGHT),
    math.zeros(WIDTH * HEIGHT),
    math.ones(WIDTH * HEIGHT),
  )).reshape([HEIGHT, WIDTH, N_CHAN]);

  const WIDTH_IDX = math.range(0, WIDTH);
  const CHAN_IDX = math.range(0, N_CHAN);

  const get_previous_row = function get_previous_row(matrix, idx) {
    /**
     * Get previous row of indexes from the array (`idxs`) given the current index (`idx`)
     * @param {number[][]} matrix - (m, n) matrix
     * @param {number} idx - Index, n, of the current row of the matrix
     * @returns {number[][]}
     */
    return math.squeeze(
      math.subset(matrix, math.index(idx - 1, math.range(0, WIDTH)))
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
    // console.debug(filter)
    if (filter.length === 0) {
      return 0;
    }
    const sum = filter.reduce((a, b) => a + b);
    return sum / filter.length;
  }

  const get_hues = function get_hues(channel, m) {
    /**
     * Determine the hues for a single channel of a single row.
     * Note that the idx argument must be >= 1.
     * @param {number[][]} channel - TKTKTK
     * @param {number} m - TKTKTK
     * @param {number[][]} filled - TKTKTK
     * @param {number[][]} arb - TKTKTK
     * @returns {}
     */
    
    let previous_row = CHANNELS.subset(math.index(m-1, WIDTH_IDX, CHAN_IDX));
    previous_row = math.reshape(previous_row, [1, WIDTH, N_CHAN, 1]);
    // Create three stacked rows. One has the channel value in the pixel above,
    // one the pixel above to the left, the other above to the right.
    let hues = math.concat(
      math.concat(
        math.matrix([[[[0], [0], [0], [0]]]]),
        previous_row.subset(math.index(0, math.range(0, WIDTH-1), CHAN_IDX, 0)),
        1
      ),
      previous_row.reshape([1, WIDTH, N_CHAN, 1]),
      math.concat(
        previous_row.subset(math.index(0, math.range(1, WIDTH), CHAN_IDX, 0)),
        math.matrix([[[[0], [0], [0], [0]]]]),
        1
      ),
      3
    ).reshape([WIDTH, N_CHAN, 3])
    // For each pixel, average the three channel values above
    hues = math.apply(hues, 2, get_mean_without_zeros)
    // If pixel is 0 or 255 leave it be. Otherwise randomly lighten it between 0 and 5.
    hues = math.map(hues, function(d) {
      return d === 0
        ? 0
        : d === 255
          ? 255
          : d > 255 - DARK_RANGE
            ? d + math.pickRandom([0, 255 - d])
            : d + math.pickRandom([0, DARK_RANGE])
    });

    let mask = math.squeeze(math.subset(FILLED, math.index(m, math.range(0, WIDTH)))).reshape([WIDTH, 1])
    mask = math.concat(mask, mask, mask, mask, 1)
    // Multiply the calculated hues by the boolean filled matrix (unfilled 0 cells
    // will equal 0 and not be filled). Processes the channel array in place---the
    // return value is moot.
    CHANNELS.subset(
      math.index(m, WIDTH_IDX, CHAN_IDX),
      math.dotMultiply(hues, mask).reshape([1, WIDTH, N_CHAN])
    )

    return hues;

  };

  const make_row = function make_row(m, filled, channel, uchannel) {
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

    const row_idxs = math.index(m, WIDTH_IDX);
    const row_chan_idxs = math.index(m, WIDTH_IDX, CHAN_IDX);
    const new_pxl_prob = get_new_pixel_probability(m);

    if (m === 0) {

      return paint_first_row(row_idxs, filled, channel, row_chan_idxs);

    } else {
      let previous_filled = get_previous_row(FILLED, m);
      let previous_idxs = get_nonwhite_idxs(previous_filled);

      // For every nonzero (painted) pixel in the previous row, Move it -2, -2, 0, 1, or 2 positions
      // horizontally
      let movement = math.randomInt([previous_idxs.length], -1, 2);
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

      return get_hues(channel, m, filled, uchannel);

    }

  };

  const paint_first_row = function paint_first_row(row_idx, filled, channel, row_chan_idx) {
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
    FILLED.subset(row_idx, mask);

    // Create hues for the filled cells and add them to the channel matrix
    let row_mask = math.matrix(math.matrixFromRows(
      math.subset(FILLED, row_idx),
      math.subset(FILLED, row_idx),
      math.subset(FILLED, row_idx),
      math.subset(FILLED, row_idx),
    ));
    let row_hues = math.matrix(math.matrixFromRows(
      math.random([1, WIDTH], .8, 1),
      math.random([1, WIDTH], .35, .4),
      math.random([1, WIDTH], 0, 360),
      math.ones(WIDTH),
    ));
    row_mask = math.transpose(row_mask)
    row_hues = math.transpose(row_hues)
    let hues = math.dotMultiply(
      row_mask, row_hues);
    CHANNELS.subset(row_chan_idx, hues);
    return hues;

  };

  const blend_row = function blend_row(m, hues) {

    const row_idx = math.index(m, WIDTH_IDX, CHAN_IDX);

    for (let j = 0; j < WIDTH; ++j) {

      const jidx = math.index(m, j, CHAN_IDX);

      let under_color = math.squeeze(UCHANNELS.subset(jidx));
      let over_color = math.squeeze(CHANNELS.subset(jidx));

      // If luminosity is 1 the under color is white. Replace its
      // hue and chroma with that of the over color
      if (under_color.get([0]) === 1) {
        under_color.set([1], over_color.get([1]))
        under_color.set([2], over_color.get([2]))
      }

      // Set the new color to the value of the undercolor (assume
      // that most pixels in the over color will be empty).
      let new_color = under_color;

      // IF the over color isn't empty, average the over and
      // under colors to find the new color.
      if (over_color.get([3]) !== 0) {
        new_color = math.divide(
          math.add(under_color, over_color), 2
        );
        new_color.set([0], math.max(0, new_color.get([0]) - math.random(0, .007)));
      }

      // console.debug('new_color:', new_color);
      math.subset(CHANNELS, jidx, new_color);

      fill_pxl(new_color, [j, m]);

    }

    UCHANNELS.subset(row_idx, CHANNELS.subset(row_idx));
    // arb_r.subset(row_idx, math.subset(arr_r, row_idx));
    // arb_g.subset(row_idx, math.subset(arr_g, row_idx));
    // arb_b.subset(row_idx, math.subset(arr_b, row_idx));

  };

  const fill_pxl = function fill_pxl(oklch, xy) {
    /**
     * Paint a pixel on the <canvas>
     * @param {number[]} rgb - A 3-tuple of RGB values
     * @param {number[]} xy - A 2-tuple containing the indices of the cells.
     * @returns {null}
     */
    const l = oklch.get([0])
    const c = oklch.get([1])
    const h = oklch.get([2])
    const a = oklch.get([3])
    ctx.fillStyle = `oklch(${l} ${c} ${h} / ${a})`;
    ctx.beginPath();
    ctx.rect(xy[0] * SIZE, xy[1] * SIZE, SIZE, SIZE);
    ctx.fill();
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
    hues = make_row(idx, FILLED, CHANNELS, UCHANNELS);
    empty_channels += math.sum(FILLED)

    if (hues === false) {
      idx = HEIGHT;
    } else {
      blend_row(idx, hues);
      ++idx;
    }



    if (idx === HEIGHT || empty_channels === 0) {
      idx = 0;
      FILLED = math.reshape(math.zeros(HEIGHT * WIDTH), [HEIGHT, WIDTH]);
    }

    // else { setTimeout(draw.bind({}, t, idx), timer); }
    setTimeout(draw.bind({}, t, idx), TIMER);

  }

  draw(TIMER, 0);

})();
