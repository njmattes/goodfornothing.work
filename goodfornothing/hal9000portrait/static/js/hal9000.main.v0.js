(function() {
  'use strict';

  /**
   * HTML element that will be re-colored
   * @type {Object}
   */
  const hal_eye = d3.select('div');

  /**
   * Path to CSV file containing RGB values of pixels to re-draw
   * @type {string}
   */
  const CSV_URL = '/hal9000portrait/static/csv/hal_rows.csv';

  /**
   * Place holder for ID of timer
   * @type {number}
   */
  let timer;

  /**
   * Delay, in milliseconds, between color changes
   * @type {number}
   */
  let time = 0;

  /**
   * Changes background color of `hal_eye`
   * @param {Object} row - 'Pixel' object from JSON file
   * @param {string} row.color - CSS-compliant color specifier
   * @
   */
  const change_color = function change_color(row) {
    hal_eye.style('background-color', row.color);
  };

  /**
   * Called iteratively, every `time` milliseconds, to change color
   * of `hal_eye` for every pixel
   * @param {Object} json - Pixels represented in JSON as list of Objects
   * @param {number} i - Index of current pixel in json to draw
   * @param {number} n - Length of pixels in json
   */
  const repeat = function repeat(json, i, n) {
      change_color(json[i]);
      timer = setTimeout(
        repeat,
        time,
        json,
        (i + 1) % n,
        n
      );
    };

  /**
   * Bootstrap the animation. Load JSON data and call repeat().
   */
  d3.csv(CSV_URL, {
    headers: {
      'Content-type': 'application/json; charset=UTF-8'
    }}).then(json => {
      repeat(json, 0, json.length);
    });

})();