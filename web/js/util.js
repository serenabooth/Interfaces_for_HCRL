var all_cartpoles = {}
var all_user_responses = 0
var correct_user_responses = 0

// src: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);


/***
 * Wait for socket connection and then execute a function call
 *
 * @param{object} socket
 * @param{function} callback
 * @param{array} argument_list
 */
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

  /**
  * A helper function that ties an event handler to a file upload element
  * https://stackoverflow.com/questions/29393064/reading-in-a-local-csv-file-in-javascript
  *
  * @param uploaderDomId
  * @param handlerFunc
  * @param argObj
  **/
  static enableFileUploader(uploaderDomId, handlerFunc, argObj) {
    var fileInput = document.getElementById(uploaderDomId),

        readFile = function () {
            var reader = new FileReader();
            reader.onload = function (readerEvt) {
              //alert(readerEvt.target.fileName)
              if(handlerFunc != null)
                handlerFunc(reader.result, argObj)
            };

            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsBinaryString(fileInput.files[0]);
        };

    fileInput.addEventListener('change', readFile);
  }


  /***
   * Create a 2D array of dimension n*m
   *
   * @param{int} n
   * @param{int} m
   * @param{number} fill_val
   * @return {any[][]}
   */
  static gen_2d_array(n, m, fill_val = 0) {
    return Array(n).fill().map(() => Array(m).fill(fill_val));
  }

  /**
  * Create an empty svg placeholder
  *
  * @param {string} domSelector the div that'll contain the SVG
  * @param {number} img_width
  * @param {number} img_height
  **/
  static gen_empty_svg(domSelector, img_width, img_height) {
    return SVG().addTo(domSelector).size(img_width, img_height)
  }

  /**
  * Create n random cartpoles
  *
  * @param{int} n # of cartpoles
  * @param{object} cartpole_thresholds min & max of each state variable
  * @param{boolean} starting_state whether the states should be initialized close to 0 or not
  * @return{array} a list of n cartpoles
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
  *
  * @param{number} min - lower bound (inclusive)
  * @param{number} max - upper bound (exclusive)
  * @return{number} a random number between min and max
  */
  static genRandomFloat(min, max) {
      return Math.random() * (max - min) + min;
  }

  /***
   * Randomly select an element from an array
   *
   * @param{array} array
   * @return {*}
   */
  static getRandomElemFromArray(array) {
    const i = Math.floor(Math.random() * array.length);
    return array[i]
  }

  /***
   * Randomly select an element from a dictionary
   *
   * @param{Object} obj
   * @return {*}
   */
  static getRandomFieldFromObj(obj) {
    let key = Util.getRandomElemFromArray(Object.keys(obj))
    return obj[key]
  }

  /***
   * Truncates each float in the array and returns new array
   *
   * @param{array} floatArr
   * @param{number} numDecPlaces
   * @return {*}
   */
  static roundElems(floatArr, numDecPlaces) {
    let roundedArr = []
    for(let f of floatArr) {
      roundedArr.push(f.toFixed(numDecPlaces))
    }

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
   * @param {string} sort - how to order the array. "max" or "min"
   * @returns {[]} a list of indices
   */
  static find_indices_of_top_N(inp, count, sort="max") {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
      outp.push(i); // add index to output array
      if (outp.length > count) {
        if (sort == "max") {
          outp.sort(function(a, b) { return inp[b] - inp[a]; }); // descending sort the output array
        }
        else if (sort == "min") {
          outp.sort(function(a, b) { return inp[a] - inp[b]; }); // ascending sort the output array
        }
        outp.pop(); // remove the last index (index of smallest element in output array)
      }
    }
    return outp;
  }

  /***
   * Compute the euclidean distance between two vectors
   * Src: https://supunkavinda.blog/js-euclidean-distance
   *
   * @param{array} a
   * @param{array} b
   * @returns {number}
   */
  static eucDistance(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      console.log("Error: Euclidean Distance can only be computed on arrays")
    }
    return a.map((x, i) => Math.abs( x - b[i] ) ** 2) // square the difference
            .reduce((sum, now) => sum + now) // sum
        ** (1/2)
  }

  /***
   * A helper function to return the top N starting states,
   * based on how divergent policies are.
   *
   * @param {number} N - the number of starting states to find
   * @param {array} policies - a list of policies
   * @param {array} cartpole_thresholds
   * @param {object} cartpoleSim
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


  /***
   * Hash a string
   *
   * @param str
   * @return {number}
   */
  static hash(str) {
    return str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
  }

  /***
   * Generate a random color as a string for use in html "rgb(x,y,z)"
   *
   * @returns {string}
   */
  static getRandColor(){
    let rgb = [parseInt(Math.random() * 256),
      parseInt(Math.random() * 256),
      parseInt(Math.random() * 256)];
    return "rgb(" + rgb.join(",") + ")";
  }

}
