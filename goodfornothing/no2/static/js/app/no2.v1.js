(function() {
  /**
   Good-for-nothing (no. 2) [2021]
   */

  'use strict';

  const t = 100;
  const timer = 10;
  const size = 40;

  let width = window.screen.width;
  let height = window.screen.height;

  /**
   * Padding multiplier
   * @type {number}
   */
  const padding_m = 0;

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
    .attr('height', height * size * scale);
  const ctx = canvas.node().getContext('2d');
  ctx.scale(scale, scale);
  ctx.LineCap = 'round';

  d3.json(`/no2/static/js/app/no2_exp1.5.json`, {
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }}).then(json => {

      const sea = math.matrix(json.sea);
      const sky = math.matrix(json.sky);
      const colors = math.matrix(json.colors);
      const vert = math.matrix(json.vert);

      // Draw single row of the lightest color at the top edge
      let sky_hue_idx = argmax(math.apply(colors, 1, math.sum))
      let sky_plane = math.multiply(math.ones(width), sky_hue_idx);
      // Draw single row of the darkest color at the bottom edge
      let sea_hue_idx = argmin(math.apply(colors, 1, math.sum))
      let sea_plane = math.multiply(math.ones(width), sea_hue_idx);
      // Generate a matrix to hold all the pixels, with the light top
      // edge, dark bottom edge, and all other cells equal to 0
      let picture_plane = math.reshape(math.concat(
        sky_plane,
        math.zeros(width * (height - 2)),
        sea_plane
      ), [height, width]);

      for (let j = 0; j < width; ++j) {
        fill_pxl(get_rgb_from_idx(sky_hue_idx, colors),
          [j, 0]);
        fill_pxl(get_rgb_from_idx(sea_hue_idx, colors),
          [j, height-1]);
      }

      let redraw_counter = 0;
      const redraw_cycle = 10 * 1000;
      const redraw_shift = .33;
      let v_probs_exp_f = v_probs_exp1;
      let exp = .5;

      const draw = function draw(t) {
        // Draw sky and sea

        // For each row in the top and bottom halves
        for (let i = 1; i < height/2; ++i) {

          let sea_idxs = math.subset(picture_plane,
            math.index(height - i, math.range(0, width)));
          let sky_idxs = math.subset(picture_plane,
            math.index(i - 1, math.range(0, width)));
          let sea_v_probs = math.flatten(math.subset(vert,
            math.index(
              Math.floor((height - i - 1) / height * 10),
              math.range(0, 16))));
          let sky_v_probs = math.flatten(math.subset(vert,
            math.index(
              Math.floor(i / height * 10),
              math.range(0, 16))));

          for (let j = 0; j < width; ++j) {

            let a = j - 1, b = j , c = j + 1;
            if (j === 0) {
              a = b;
            } else if (j === width - 1) {
              c = b;
            }

            for (const [obj, idxs, v_probs, plane_offset]
              of [[sea, sea_idxs, sea_v_probs, height - 1 - 2 * i],
                  [sky, sky_idxs, sky_v_probs, 0]]) {
              let slice = math.index(
                math.subset(idxs, math.index(0, a)),
                math.subset(idxs, math.index(0, b)),
                math.subset(idxs, math.index(0, c)),
                math.range(0, 16)
              )
              let probability = math.flatten(math.subset(obj, slice));
              // let v_probability = math.dotPow(v_probs, .5)
              // v_probability = math.dotDivide(v_probability, math.sum(v_probability))
              // probability = math.dotMultiply(probability, v_probability);
              // probability = math.dotMultiply(probability, 1 / math.sum(probability));
              let hue_idx = get_hue_idx(probability);
              picture_plane = math.subset(
                picture_plane,
                math.index(i + plane_offset, j),
                hue_idx);
              fill_pxl(
                get_rgb_from_idx(hue_idx, colors),
                [j, Math.ceil(i + plane_offset)]);

            }
          }
        }
      }

      const redraw = function redraw(t) {
        let idx = Math.floor(Math.random() * width * (height - 2));
        let i = Math.floor(idx / width) + 1;
        let j = idx % width;
        let v_probs = math.flatten(math.subset(vert,
            math.index(
              Math.floor(i / height * 10),
              math.range(0, 16))));
        let b = j,
          a = j > 0 ? j - 1 : j,
          c = j < width - 1 ? j + 1 : j;
        let y = i + 1;
        let probability = sea;
        if (i < height / 2) {
          y = i - 1;
          probability = sky;
        }
        let slice = math.index(
          math.subset(picture_plane, math.index(y, a)),
          math.subset(picture_plane, math.index(y, b)),
          math.subset(picture_plane, math.index(y, c)),
          math.range(0, 16)
        )

        probability = math.flatten(math.subset(probability, slice));
        let v_probability = v_probs_exp_f(v_probs, exp);
        v_probability = math.add(v_probability, .001)
        v_probability = math.dotDivide(v_probability, math.sum(v_probability))
        probability = math.dotMultiply(probability, v_probability);
        probability = math.dotMultiply(probability, 1 / math.sum(probability));

        let hue_idx = get_hue_idx(probability);
        picture_plane = math.subset(
          picture_plane,
          math.index(i, j),
          hue_idx);
        fill_pxl(
          get_rgb_from_idx(hue_idx, colors),
          [j, i]);
        ++redraw_counter;
        if (redraw_counter * timer > redraw_cycle) {
          redraw_counter = 0;
          v_probs_exp_f = v_probs_exp1;
          exp = .5;
        }
        if (redraw_counter * timer > redraw_cycle * redraw_shift) {
          v_probs_exp_f = v_probs_exp2;
          exp = .9;
        }
        setTimeout(redraw.bind({}, t), timer);
      };

      draw();
      redraw(timer)

    });

  const fill_pxl = function fill_pxl(rgb, xy) {
    ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
    ctx.beginPath();
    ctx.rect(xy[0] * size, xy[1] * size, size, size);
    ctx.fill();
  };

  const get_idx = function get_idx(a, b, c, d, e) {
    return a*16**5 + b*16**4 + c*16**3 + d*16**2 + e*16;
  };

  const get_hue_idx = function get_hue_idx(probability) {
    let rnd = Math.random();
    return argmax(reciprocal(math.subtract(cumsum(probability), rnd)));
  }

  const get_rgb_from_idx = function get_rgb_from_idx(hue_idx, colors) {
    return math.flatten(
      math.subset(colors, math.index(hue_idx, math.range(0, 3)))).toArray();
  }

  const cumsum = function cumsum(arr) {
    return math.map(arr, function (x, i, a) {
      return math.sum(math.subset(a, math.index(math.range(0, i[0]+1))));
    })
  }

  const reciprocal = function reciprocal(arr) {
    return math.map(arr, function (x, i, a) {
      return 1 / x;
    })
  }

  const argmax = function argmax(arr) {
    return arr.toArray().indexOf(math.max(arr))
  }

  const argmin = function argmin(arr) {
    return arr.toArray().indexOf(math.min(arr))
  }

  const v_probs_exp1 = function v_probs_exp1(v_probs, exp) {
    return math.dotPow(v_probs, exp);
  }

  const v_probs_exp2 = function v_probs_exp2(v_probs, exp) {
    return math.dotPow(exp, math.subtract(1, v_probs));
  }

})();
