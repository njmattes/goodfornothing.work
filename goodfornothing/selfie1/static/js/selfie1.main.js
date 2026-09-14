(function() {
  /**
   Good-for-nothing (Selfie #1) [2019]
   */

  'use strict';

  /**
   * Path to JSON file containing RGB values of pixels to re-draw
   * @type {string}
   */
  const JSON_URL = '/selfie1/static/json/tiananmen_selfie_400x300_2.json';

  /**
   * Width of image in pixels
   * @type {number}
   */
  const WIDTH = 400;

  /**
   * Height of image in pixels
   * @type {number}
   */
  const HEIGHT = 300;

  /**
   * Size of pixels to draw
   * @type {number}
   */
  const PIXEL = 2;

  /**
   * Placeholder for animation delay in milliseconds
   * @type {number}
   */
  let time;

  /**
   * Placeholder for ID of timer
   * @type {number}
   */
  let timer;
  let n;

  /**
   * Canvas context for drawing image
   * @type {ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | CanvasRenderingContext2D | RenderingContext | OffscreenRenderingContext | OffscreenCanvasRenderingContext2D}
   */
  const context = d3.select('main')
    .append('canvas')
    .attr('width', WIDTH * PIXEL)
    .attr('height', HEIGHT * PIXEL)
    .node()
    .getContext('2d');

  /**
   *
   * @param x
   * @param y
   * @param rgb
   */
  const draw_pixel = function draw_pixel(x, y, rgb) {
    context.beginPath();
    context.rect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
    context.fillStyle='rgb('+rgb.join(',')+')';
    context.fill();
    context.closePath();
  };

  const draw_pixels = function draw_pixels(json, i) {

    let pixels = json.a[json.idx[i]].concat(json.b[json.idx[i]]);

    for (let p = 0; p < pixels.length; ++p) {
      let pixel = pixels[p];
      draw_pixel(pixel[1], pixel[0], pixel[2]);
    }

  };

  const repeat = function repeat(json, i) {

    draw_pixels(json, i);

    timer = setTimeout(
      repeat,
      time,
      json,
      (i + 1) % n
    );

  };

  d3.json(JSON_URL, {
    headers: {

      'Content-type': 'application/json; charset=UTF-8'

    }}).then(json => {

      n = json.idx.length;
      time = json.idx[1] / 30;
      repeat(json, 0);

  });

})();
