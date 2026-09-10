(function(size, number, timer, threshold, network, cg) {
  'use strict';

  const dpr = window.devicePixelRatio || 1;
  const wipe_threshold = 20;
  const value_maximum = 248;
  const value_range = 64;
  const padding_coefficient = 0;
  const padding = {
    top: size * padding_coefficient,
    right: size * padding_coefficient,
    bottom: size * padding_coefficient,
    left: size * padding_coefficient
  };
  const mode = {g: 'grey', c: 'color'}[cg];

  /********
   * Screen
   ********/

  const get_screen_width = function(padding) {
    /*
     Get width of entire screen
     */
    return Math.ceil(window.screen.width / size) -
        (padding.left + padding.right) / size;
  };

  const get_screen_height = function(padding) {
    /*
     Get height of entire screen
     */
    return Math.ceil(window.screen.height / size) -
        (padding.top + padding.bottom) / size;
  }

  const get_screen_area = function(width, height) {
    /*
     Get area of entire screen
     */
    return width * height
  }

  const get_ctx = function(width, height, size) {
    const canvas = d3
      .select('main')
      .append('canvas')
      .attr('width', width * size * dpr)
      .attr('height', height * size * dpr);
    const ctx = canvas.node().getContext('2d');
    ctx.LineCap = 'round';
    return ctx;
  }

  /*******
   * Array
   *******/

  const init_array = function(width, area) {
    /*
     Build array of pixels
     */
    return Array.from(Array(area).keys()).map(i => {return {
      x: i % width,  // i % width * size + size / 2,
      y: Math.floor(i / width),  // Math.floor(i / width) * size + size / 2,
      i: i,
      color: null,
      on: true
    }});
  };

  const shuffle_array = function(array) {
    /*
     Randomly shuffle the items in an Array
     */
    for (let i = array.length - 1; i > 0; --i) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const get_shuffled_idxs = function(n) {
    /*
     Get a randomly ordered array of the indexes of all pixels
     */
    const idxs = Array.from(Array(n).keys());
    return shuffle_array(idxs).map(i => { return {
      i: i, on: true
    }});
  };

  const reshuffle_idxs = function(idxs) {
    /*
     Get a randomly ordered array of the indexes of all pixels
     */
    shuffle_array(idxs);
  };

  const idxs_range = function(start, stop, step) {
    return Array.from({ length: (stop - start) / step + 1},
      (_, i) => start + (i * step));
  }

  const reset_pixel = function(pxl) {
    pxl.color = null;
    pxl.on = true;
    delete pxl.distance;
  }

  const reset_pixels = function() {
    pixels.forEach(p => reset_pixel(p))
  };

  /**********
   Operations
   **********/

  const get_nearby_pixels = function(pxl, pxls, n) {
    /*
     Retrieve the n pixels in the Array `pxls` that are closest to `pxl`
     (not including `pxl`) and have a color property.
     */

    const distance1 = function(p, q) {
      return Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2);
    }

    const distance2 = function(p, q) {
      return Math.sqrt(distance1(p, q));
    }

    let _pxls = pxls
      .filter((p) => p.color !== null)
      .filter((p) => p.i !== pxl.i)
      .sort((a, b) => distance1(a, pxl) - distance1(b, pxl))
      .slice(0, n);
    _pxls.forEach((p) => p.distance = 1 / distance2(p, pxl));
    return _pxls;

  };

  const get_average_color = function(pxls) {
    /*
     Blend the colors of the pixels nearest the target pixel.
     */
    let distance_sum = pxls.reduce((a, b) => a + b.distance, 0);
    pxls.forEach((x) => x.distance /= distance_sum)
    let colors = pxls.map(x => x.color.map(y => y * x.distance));
    return colors.reduce((a, b) => a.map((c, i) => c + (b[i] || 0)))
  };

  const get_random_color = function get_random_color() {
    /*
     Generate a random color.
     */
    if (mode === 'grey') {
      const value = value_maximum - Math.floor(Math.random() * value_range);
      return [value, value, value];
    }
    return [[200, 230], [230, 255], [220, 255]].map(
      minmax => minmax[0] - Math.floor(Math.random() * (minmax[1] - minmax[0]))
    )
    // return [0, 0, 0].map((x) => value_maximum - Math.floor(Math.random() * value_range))
  };

  const get_color = function(idx, pxl, area) {
    /*
     Get a color for a pixel. If the animation hasn't reached its threshold,
     generate a random color. Otherwise generate a color based on the nearby
     pixels.
     */
    if (idx > area / threshold) {
      const nearby_pixels = get_nearby_pixels(pxl, pixels, network);
      pxl.color = get_average_color(nearby_pixels);
    } else {
      pxl.color = get_random_color();
    }
    return pxl;
  }

  const tint_pixel = function tint_pixel(pxl) {
    /*
     Lighten a pixel's color.
     */
    pxl.color = pxl.color.reduce((a, b) => a + b, 0) >= 253 * 3
      ? [255, 255, 255]
      : pxl.color.map(x => x + (255 - x) ** .67);
    return pxl;
  };

  const prune_white_pixels = function(idxs) {
    /*
     Generate an Array of the indexes of all non-white pixels.
     */
    pixels.forEach(p => p.on = p.color.reduce((a, b) => a + b, 0) <= 253 * 3)
    // shuffled_idxs.forEach(o => o.on = )
    // return shuffle_array(pixels.filter(
    //   (p) => p.color.reduce((a, b) => a + b, 0) < 253 * 3
    // ).map((p) => p.i));
  }

  const fill_pixel = function(ctx, pxl) {
    /*
     Draw a pixel to the <canvas>
     */
    ctx.fillStyle = `rgba(${pxl.color.concat(1).join(',')})`;
    ctx.beginPath();
    ctx.rect(pxl.x * size * dpr, pxl.y * size * dpr, size * dpr, size * dpr);
    ctx.fill();
  };

  /*******
   Batches
   *******/

  const tint_batch = function(idx, amount, ctx, area) {
    const stop = idx + amount >= area ? area-1 : idx + amount;
    idxs_range(idx, stop, 1)
      .forEach(i => fill_pixel(ctx, tint_pixel(pixels.filter(p => p.on)[i])));
  }

  const draw_batch = function(idx, amount, ctx, area) {
    const stop = idx + amount >= area ? area-1 : idx + amount;
    idxs_range(idx, stop, 1)
      .forEach(i => fill_pixel(ctx, get_color(i, pixels[i], area)));
  };

  const wipe = function(counter, ctx, area_to_wipe, area) {
    if (area_to_wipe <= wipe_threshold) {
      reset_pixels();
      draw(0, ctx, area);
    } else {
      tint_batch(counter, number, ctx, area_to_wipe);
      prune_white_pixels();
      counter += number;
      if (counter >= area_to_wipe) {  // If current index in loop is >= indexes left to tint
        counter = 0;  // Start back at 0
      }
      setTimeout(wipe.bind({}, counter, ctx, pixels.filter(p => p.on).length, area), timer);
    }
  };

  const draw = function(counter, ctx, area) {
    if (counter >= area) {
      counter = 0;
      wipe(counter, ctx, area, area);
      return;
    }
    draw_batch(counter, number, ctx, area)
    counter += number;
    setTimeout(draw.bind({}, counter, ctx, area), timer);
  };

  const width = get_screen_width(padding);
  const height = get_screen_height(padding);
  const area = get_screen_area(width, height);
  const pixels = shuffle_array(init_array(width, area));
  const ctx = get_ctx(width, height, size);

  draw(0, ctx, area);

})(40, 5, timer, threshold, network, cg);