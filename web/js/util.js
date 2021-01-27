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

  static genRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  /**
  Given an array of carpoles that have simulation tracces, get max sim length
  **/
  static getMaxSimTime(cartpoleArray, trace_id = null) {
    let maxTime = 0
    for (var i = 0; i < cartpoleArray.length; i++) {
      let simTrace = cartpoleArray[i].getSimTrace(trace_id)
      maxTime = Math.max(maxTime, simTrace.state_history.length)
    }
    return maxTime
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

  /***
   * A helper function to find the indices of top values in an array.
   *
   * @param {array} inp - an input array
   * @param {number} count - the number of indices to find
   * @returns {[]} a list of indices
   */
  static find_indices_of_top_N(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
      outp.push(i); // add index to output array
      if (outp.length > count) {
        outp.sort(function(a, b) { return inp[b] - inp[a]; }); // descending sort the output array
        outp.pop(); // remove the last index (index of smallest element in output array)
      }
    }
    return outp;
  }

  /***
   * Get a cartesian product of states covering the state space
   *
   * @param {number} N - the interval spacing
   * @param {object} cartpole_thresholds
   * @returns {[]} a cartesian product list of states covering the space
   */
  static get_cartesian_space(N, cartpole_thresholds) {
    let x_samples = Util.linspace(-cartpole_thresholds.x, cartpole_thresholds.x, N, true)
    let x_dot_samples = Util.linspace(-cartpole_thresholds.x_dot, cartpole_thresholds.x_dot, N, true)
    let theta_samples = Util.linspace(-cartpole_thresholds.theta, cartpole_thresholds.theta, N, true)
    let theta_dot_samples = Util.linspace(-cartpole_thresholds.theta_dot, cartpole_thresholds.theta_dot, N, true)

    return cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
  }


  /***
   * A helper function to return the top N starting states,
   * based on how divergent policies are.
   *
   * @param {number} N - the number of starting states to find
   * @param {array} policies - a list of policies
   * @param
   * @returns {[]} a list of states
   */
  static get_top_N_divergent_starting_states(N, policies, cartpole_thresholds, cartpoleSim) {
    let action_steps_0, action_steps_1, diff_score;
    let tmp_cp = Util.gen_rand_cartpoles(1, cartpole_thresholds)[0];

    let set_of_states =  Util.get_cartesian_space(8, cartpole_thresholds);
    let diff_scores = []


    for (let state_idx in set_of_states) {
      tmp_cp.reset(set_of_states[state_idx])
      cartpoleSim.simulation_from_policy(tmp_cp, policies[0].get_params(), 200, 0)
      action_steps_0 = [...tmp_cp.action_history]

      tmp_cp.reset(set_of_states[state_idx])
      cartpoleSim.simulation_from_policy(tmp_cp, policies[1].get_params(), 200, 0)
      action_steps_1 = [...tmp_cp.action_history]

      diff_score = 0
      for (var i = 0; i < Math.min(action_steps_0.length, action_steps_1.length); i++) {
        if (action_steps_0[i] != action_steps_1[i]) {
          diff_score += 1
        }
      }
      diff_scores.push(diff_score)
    }

    let top_N = Util.find_indices_of_top_N(diff_scores, N)
    let ret_states = []
    for (let idx in top_N) {
      ret_states.push(set_of_states[top_N[idx]])
    }

    return ret_states
  }


  static hash(str) {
    return str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
  }

}
