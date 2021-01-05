
class CartPole {

  static id = 0
  /**
   * Constructor of CartPole.
   * Cite: https://mlpack.org/doc/mlpack-git/doxygen/classmlpack_1_1rl_1_1CartPole.html
   *
   * @param{array} cartpole_thresholds - properties of the cartpole object
   * @param{array} state_as_arr - an initialization state.
   * @param{string} title - a string which describes the instance
   * @param{boolean} random_starting_state - whether a random state should be a starting state
   * @param{string} color
   */
  constructor(cartpole_thresholds,
              state_as_arr = null,
              title = null,
              random_starting_state = false,
              color = null) {

    // initialize properties from parameters
    this.cartpole_thresholds = cartpole_thresholds
    if(state_as_arr == null) {
      state_as_arr = State.genRandomState(this.cartpole_thresholds, random_starting_state, 'array')
    }
    this.setState_privateMethod(state_as_arr)
    this.title = title ? title : ""
    this.color = color;

    //cart characteristics©
    this.massCart = 1.0;
    this.massPole = 0.1;
    this.totalMass = this.massCart + this.massPole;
    this.length = 0.5;
    this.poleMoment = this.massPole * this.length;

    //list of states in this sim
    this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]

    // Cart position, meters.
    this.x = 0
    // Cart velocity.
    this.x_dot = 0
    // Pole angle, radians.
    this.theta = 0
    // Pole angle velocity.
    this.theta_dot = 0

    //keeps history of simulated states
    this.state_history = []
    this.action_history = []
    // store multiple traces
    this.past_traces = {}

    this.viewer = new Cartpole_Viewer(cartpole_thresholds)
    this.id = CartPole.id++

    //save init state
    this.state_history = [state_as_arr]

  }

  /**
  * Adds a state to the simulation trace
  *
  * @param{array} state_as_arr - a state
  * @param{number} action - -1 for left, 1 for right
  **/
  addSimTimestep(state_as_arr, action) {
      this.setState_privateMethod(state_as_arr)
      this.state_history.push(state_as_arr)
      this.action_history.push(action)
  }

  /**
  * Returns the current cartpole state
  *
  * @return{array} state
  **/
  getState() {
    return  [this.x, this.x_dot, this.theta, this.theta_dot]
  }

  /**
  * Returns the starting state
  *
  * @return{array} state
  * **/
  getStartingState() {
    return this.state_history[0]
  }


  /**
  * Returns current sim trace data
  *
  * @param{string} trace_id - an id for locating a particular simulation trace
  **/
  getSimTrace(trace_id = null) {
    // use the trace_id if specified
    if (trace_id == null) {
      return {
        action_history : this.action_history,
        state_history : this.state_history,
      }
    }
    //otherwise, return the current trace
    return {
      action_history: this.past_traces[trace_id]["action_history"],
      state_history: this.past_traces[trace_id]["state_history"],
    }

  }

  /**
   * Save the current trace to the history of past_traces
   *
   * @param{string} trace_id
   */
  save_trace(trace_id) {
    this.past_traces[trace_id] = {"state_history": [...this.state_history],
                                  "action_history": [...this.action_history],}
  }

  /**
   * Reset cartpole, including state and action traces
   *
   * @param{array} new_state_as_arr - initial state, if specified
   */
  reset(new_state_as_arr = null) {
    var initState = (new_state_as_arr == null) ? CartPole.genRandomState(this.cartpole_thresholds) : new_state_as_arr
    this.setState_privateMethod(initState)
    this.state_history = [initState]
    this.action_history = []
  }

  /**
   * Set the state of the cart-pole system according to an argument.
   *
   * @param{array} state_as_arr - an array representation of the state
   */
  setState_privateMethod(state_as_arr) {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    this.x = state_as_arr[0]
    // Cart velocity.
    this.x_dot = state_as_arr[1]
    // Pole angle, radians.
    this.theta = state_as_arr[2]
    // Pole angle velocity.
    this.theta_dot =  state_as_arr[3]
  }


  /***
   * Set the title of the cartpole
   *
   * @param{string} title
   */
  setTitle(title) {
    this.title = title
  }

  /***
   * Get title of the cartpole
   *
   * @returns {null|string}
   */
  getTitle() {
    return this.title
  }


  /**
   *  generate reader-friendly view of state values
   *
   * @param {array or obj} state any cartpole state. If null, then use own state
   * @return string version of state
   */
  toString(state = null, asTableRow=false, additionalColVals = []) {

    if (state == null) {
      state = this.getState()
    }

    //round decimal places for display
    let roundedStateVals = Util.roundElems(state,2)

    if(asTableRow) {
      let cols = `<td>${roundedStateVals[0]}</td><td>${roundedStateVals[1]}</td><td>${roundedStateVals[2]}</td><td>${roundedStateVals[3]}</td>`
      for (let colVal of additionalColVals)
        cols+=`<td>${colVal}</td>`
      return `<tr>${cols}<tr>`
    }
    else
      return `x: (${roundedStateVals[0]},${roundedStateVals[1]}), th: (${roundedStateVals[2]},${roundedStateVals[3]})`
  }

}
