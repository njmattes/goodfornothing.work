(function (x) {
  'use strict';

  // const WIDTH = 32;
  const WIDTH = screen.width;
  const HEIGHT = 12;
  const PIXEL = 2;
  let time = 20;
  let timer;
  let matrix = [];

  const body = d3.select('body');
  const canvas = body.append('canvas');

  const get_width = function get_dims() {
    // return body.node().offsetWidth;
    return WIDTH;
  };

  body.on('resize', function() {
    canvas
      .attr('width', get_width())
      .attr('height', HEIGHT * PIXEL)
  });

  const context = canvas
    .attr('width', get_width())
    .attr('height', HEIGHT * PIXEL)
    .node()
    .getContext('2d');

  const draw_pixel = function draw_pixel(x, y, rgb) {
    context.beginPath();
    context.rect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
    context.fillStyle='rgb('+rgb.join(',')+')';
    context.fill();
    context.closePath();
  };

  const empty_column = function empty_column() {
    return Array(HEIGHT+2).fill(5);
  };

  const random_column = function empty_column() {
    return INIT[Math.floor(Math.random() * INIT.length)];
  };

  const bootstrap = function bootstrap() {
    for (let i = 0; i < WIDTH / PIXEL; ++i) {
      matrix.push(empty_column());
    }
    matrix.shift();
    matrix.push(empty_column());
  };

  const draw_matrix = function draw_matrix() {
    for (let i = 0; i < matrix.length; ++i) {
      for (let j = 1; j < matrix[i].length - 1; ++j) {
        draw_pixel(i, j, COLORS[matrix[i][j]])
      }
    }
  };

  const add_column = function add_column() {
    let col = [];
    let last_idx = matrix.length - 1;
    for (let i = 1; i < HEIGHT+1; ++i) {
      let h_arr = HORIZ[matrix[last_idx][i-1]][matrix[last_idx][i]][matrix[last_idx][i+1]];
      if (typeof(h_arr) === 'undefined') {
        col[i-1] = matrix[last_idx][i];
      } else {
        col[i-1] = h_arr[Math.floor(Math.random() * h_arr.length)];
      }
    }
    col.splice(0, 0, col[0]);
    col.push(col[col.length-1]);
    matrix.shift();
    matrix.push(col);
  };

  const repeat = function repeat() {

    add_column();
    draw_matrix();

    timer = setTimeout(
      repeat,
      time,
    );

  };

  bootstrap();
  draw_matrix();
  repeat();

})(COLORS, HORIZ, VERT);