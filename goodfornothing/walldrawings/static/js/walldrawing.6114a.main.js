(function() {
  'use strict';

  const JSON_PATH = '/walldrawing/static/json/6114a/venice_6114_serial.json';
  const WALL_DIR = '/walldrawing/static/jpg/6114a/serial_walls/';
  const TIMER = 100;

  let n;

  const wall = d3.select('main');

  const replace_image = function replace_image(walls, i) {
    d3.selectAll('.wall').style('display', 'none');
    d3.select(`.wall-${i}`).style('display', 'block');
    i = i > n ? 0 : i + 1;
    setTimeout(replace_image.bind({}, walls, i), TIMER);
  };

  const add_images = function add_images(walls, n) {
    for (let i = 0; i < n; ++i) {
      wall
        .append('img')
        .attr('class', `wall wall-${i}`)
        .attr('src', WALL_DIR + walls[i % n])
        .style('display', 'none');
    }
  }

  const init = async function init() {
    let json = await d3.json(JSON_PATH,
      {headers: {'Content-type': 'application/json; charset=UTF-8'}});
    if (json.walls) {
      n = json.walls.length;
      add_images(json.walls, n);
      replace_image(json.walls, 0);
    }
  };

  init();

})();