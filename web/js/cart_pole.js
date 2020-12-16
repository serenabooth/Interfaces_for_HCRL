
class CartPole {

  static id = 0
  /**
   * Constructor of CartPole.
   */
  constructor(cartpole_thresholds, state_as_arr = null, title = null, is_starting_state = false, color = null) {

//https://mlpack.org/doc/mlpack-git/doxygen/classmlpack_1_1rl_1_1CartPole.html

    this.color = color;

    //cart characteristics©
    this.massCart = 1.0;
    this.massPole = 0.1;
    this.totalMass = this.massCart + this.massPole;
    this.length = 0.5;
    this.poleMoment = this.massPole * this.length;

    // The control-theory state variables of the cart-pole system.

    //list of states in this sim
    this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]
    this.cartpole_thresholds = cartpole_thresholds

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


    this.viewer = new Cartpole_Viewer(cartpole_thresholds)
    this.id = CartPole.id++
    this.title = title ? title : ""

    if(state_as_arr == null)
      state_as_arr = CartPole.genRandomState(this.cartpole_thresholds)

    this.setState_privateMethod(state_as_arr)

    //save init state
    this.state_history = [state_as_arr]

    this.past_traces = {}
}

  //===========< BEGIN Static Methods >================//

  /*
   * Create a random policy
   */
  static generateRandomPolicy() {
    let policy = []
    for(let i = 0; i < 4; i++)
      //random number from [-1,1]
      policy.push((Math.random() * 2) - 1)
    return policy
  }

  /**
   * Set the state of the cart-pole system randomly.
   * This sets the control-theory state variables of the cart-pole system.
   * @param array cartpole_thresholds
   * @param boolean starting_state
   */
  static genRandomState(cartpole_thresholds, starting_state = false) {
    let x, x_dot, theta, theta_dot;

    if (starting_state) {
      x = Util.genRandomFloat(-0.05, 0.05)
      x_dot = Util.genRandomFloat(-0.05, 0.05)
      theta = Util.genRandomFloat(-0.05, 0.05)
      theta_dot = Util.genRandomFloat(-0.05, 0.05)
    }
    else {
      // Cart position, meters.
      //let x = Math.random() - 0.5;  was in original code...
      x = Util.genRandomFloat(-cartpole_thresholds["x"]/2,cartpole_thresholds["x"]/2)
      // Cart velocity.
      x_dot = (Math.random() - 0.5) * 1;

      // Pole angle, radians.
      //let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);   was in original code...
      theta  = Util.genRandomFloat(-cartpole_thresholds["theta"]/2,cartpole_thresholds["theta"]/2)

      // Pole angle velocity.
      theta_dot =  (Math.random() - 0.5) * 0.5;
    }

    return [x,x_dot, theta, theta_dot]
  }

  //===========< END Static Methods >================//

  /**
  Adds a state to the simulation trace
  **/
  addSimTimestep(state_as_arr, action) {
      this.setState_privateMethod(state_as_arr)
      this.state_history.push(state_as_arr)
      this.action_history.push(action)
  }

  /**
  returns cartpole state
  **/
  getState() {
    return  [this.x, this.x_dot,this.theta,this.theta_dot ]
  }

  /**
   returns cartpole state
   **/
  getStartingState() {
    return this.state_history[0]
  }


  /**
  returns current sim trace data
  **/
  getSimTrace(trace_id = null) {
    if (trace_id == null) {
      return {
        action_history : this.action_history,
        state_history : this.state_history,
      }
    }
    else {
      return {
        action_history: this.past_traces[trace_id]["action_history"],
        state_history: this.past_traces[trace_id]["state_history"],
      }
    }

  }

  getTitle() {
    return this.title
  }

  save_trace(trace_id) {
    this.past_traces[trace_id] = {"state_history": [...this.state_history],
                                  "action_history": [...this.action_history],}
  }
  /**
   * Reset cartpole, including state and action traces
   *
   * @param{array or obj} new_state_as_arr initial state, if specified
   */
  reset(new_state_as_arr = null) {

    var initState = (new_state_as_arr == null) ? CartPole.genRandomState(this.cartpole_thresholds) : new_state_as_arr
    this.setState_privateMethod(initState)
    this.state_history = [initState]
    this.action_history = []
  }

  /**
   * Set the state of the cart-pole system according to an argument.
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



  setTitle(title) {
    this.title = title
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
