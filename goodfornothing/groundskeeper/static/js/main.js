(function (x) {
  'use strict';

  // const WIDTH = 32;
  const WIDTH = screen.width;
  const HEIGHT = 128;
  const PIXEL = 4;
  let time = 100;
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
    return Array(HEIGHT+2).fill(21);
  };

  const random_column = function random_column(data) {
    let col = data.init;
    matrix.shift();
    matrix.push(col);
  };

  const bootstrap = function bootstrap() {
    for (let i = 0; i < WIDTH / PIXEL; ++i) {
      matrix.push(empty_column());
    }
    matrix.shift();
    matrix.push(empty_column());
  };

  const draw_matrix = function draw_matrix(colors) {
    for (let i = 0; i < matrix.length; ++i) {
      for (let j = 1; j < matrix[i].length - 1; ++j) {
        draw_pixel(i, j, colors[matrix[i][j]])
      }
    }
  };

  const add_column = function add_column(data) {
    let col = [];
    let last_idx = matrix.length - 1;
    let probability = new Array(64).fill(0);
    for (let i = 0; i < HEIGHT; ++i) {
      let e = data.e[matrix[last_idx][i]];  // Array(64)
      let se = 1;
      let ne = 1;
      if (i === 0) {
        se = new Array(64).fill(0);
      } else {
        se = data.se[matrix[last_idx][i-1]];
      }
      if (i === HEIGHT - 1) {
        ne = new Array(64).fill(0);
      } else {
        ne = data.ne[matrix[last_idx][i+1]];
      }
      let divisor =
        e.reduce((a, b) => a + b, 0) +
        se.reduce((a, b) => a + b, 0) +
        ne.reduce((a, b) => a + b, 0) +
        data.v[i].reduce((a, b) => a + b, 0)
      for (let j = 0; j < probability.length; ++j) {  // Array(64)
        let dividend = (
          1.3 * e[j] +
          1.3  * se[j] +
          1.3  * ne[j] +
          0.10 * data.v[i][j]
        )
        if (j === 0) {
          probability[j] = dividend / divisor;
        } else {
          probability[j] = dividend / divisor + probability[j-1];
        }
      }
      col[i] = probability.findIndex(function(n) {
        return n > Math.random();
      });
    }

    matrix.shift();
    matrix.push(col);
  };

  const repeat = function repeat(data) {

    add_column(data);
    draw_matrix(data.colors);

    timer = setTimeout(
      function() { repeat(data); },
      time,
    );

  };

  Promise.all(
    [d3.json('/groundskeeper/static/json/corot.json')]
  ).then(function(data) {
    console.log(data);
    bootstrap();
    random_column(data[0]);
    draw_matrix(data[0].colors);
    repeat(data[0]);
  });


})();
// })(COLORS, HORIZ, VERT);