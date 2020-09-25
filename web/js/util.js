/**
Static utility functions
**/
class Util {

  /**
  @param {string} domSelector the div that'll contain the SVG
  **/
  static gen_empty_svg(domSelector, img_width, img_height) {
    return SVG().addTo(domSelector).size(img_width, img_height)
  }

  /**
  @param {int} n # of cartpoles
  @param {object} cartpole_thresholds min & max of each state variable
  **/
  static gen_rand_cartpoles(n, cartpole_thresholds) {
    var cartpoles = []
    for(let i = 0; i < n; i++) {
      //create random state cartpoles
      let cp = new CartPole(cartpole_thresholds)
      cartpoles.push(cp)
    }
    return cartpoles
  }
  /**
   * Returns a random number between min (inclusive) and max (exclusive)
   * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
   */
  static genRandomFloat(min, max) {
      return Math.random() * (max - min) + min;
  }

  static getRandomElemFromArray(array) {
    const i = Math.floor(Math.random() * array.length);
    return array[i]
  }

  static getRandomFieldFromObj(obj) {
    let key = Util.getRandomElemFromArray(Object.keys(obj))
    return obj[key]
  }

  //truncates each float in the array and returns new array
  static roundElems(floatArr, numDecPlaces) {
    let roundedArr = []
    for(let f of floatArr)
      roundedArr.push(f.toFixed(numDecPlaces))
    return roundedArr
  }


}
