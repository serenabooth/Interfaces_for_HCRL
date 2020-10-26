var all_cartpoles = {}
var all_user_responses = 0
var correct_user_responses = 0

function waitForSocketConnection(socket, callback, argument_list){
    setTimeout(
        function () {
            if (socket.readyState == 1) {
                    callback(argument_list);
            } else {
                console.log("wait for connection...")
                waitForSocketConnection(socket, callback, argument_list);
            }
        }, 5); // wait 5 milisecond for the connection...
}

/**
Static utility functions
**/
class Util {

  // a global variable for sharing websocket communcations

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
  static gen_rand_cartpoles(n, cartpole_thresholds, starting_state=false) {
    var cartpoles = []
    for(let i = 0; i < n; i++) {
      //create random state cartpoles
      let cp = new CartPole(cartpole_thresholds, null, null, starting_state)
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

  /***
  A helper function to create a linspace over an interval

  For example, given params (-2.4, 2.4, 2, true), the resulting arr is [-0.8,0.8]
  Given (-2.4, 2.4, 2, false), the resulting arr is [-2.4, -0.8, 0.8, 2.4]

  @param {number} low
  @param {number} high end point of interval
  @param {int} num_intervals number of segments to construct
  @param {boolean} exclude_edges whether to include low and high points
  ***/
  static linspace(low, high, num_intervals, exclude_edges = true) {
    var arr = [];
    var step = (high - low) / (num_intervals - 1);

    for (var i = 0; i < num_intervals; i++) {
      if (exclude_edges && (i == 0 || i == num_intervals - 1)) {
        // if exclude_edges is true, skip first and last values
      }
      else {
        arr.push(low + (step * i));
      }
    }
    console.log(arr)
    return arr;
  }

}
