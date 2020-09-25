var all_cartpoles = {}

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


  //truncates each float in the array and returns new array
  static roundElems(floatArr, numDecPlaces) {
    let roundedArr = []
    for(let f of floatArr)
      roundedArr.push(f.toFixed(numDecPlaces))
    return roundedArr
  }


  /**
  convert array representation of state into obj

  @param {array} state_as_arr list of state var values
  @param {array} state_var_list list of state var names
  **/
  static stateArrToObj(state_as_arr, state_var_list) {

    let stateAsObj = {}

    for(let i = 0; i < state_var_list.length; i++) {
      let state_var_name = state_var_list[i]
      stateAsObj[state_var_name] = state_as_arr[i]
    }

    return stateAsObj
  }

  /**
  convert obj representation of state into arr

  TODO: stop using object representations...

  @param {array} state_as_obj state var vals in obj form
  @param {array} state_var_list list of state var names
  **/
  static stateObjToArr(state_as_obj, state_var_list) {
    let state_as_arr = []

    for(let i = 0; i < state_var_list.length; i++) {
      let state_var_name = state_var_list[i]
      state_as_arr.push(state_as_obj[state_var_name])
    }
    return state_as_arr
  }

  /***
  A helper function to create a linspace over an interval

  For example, given params (-2.4, 2.4, 2, true), the resulting arr is [-0.8,0.8]
  Given (-2.4, 2.4, 2, false), the resulting arr is [-2.4, -0.8, 0.8, 2.4]

  @param {float} low
  @param {float} high end point of interval
  @param {int} num_intervals number of segments to construct
  @param {bool} exclude_edges whether to include low and high points
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
