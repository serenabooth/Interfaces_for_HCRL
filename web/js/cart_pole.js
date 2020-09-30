
class CartPole {

  static id = 0
  /**
   * Constructor of CartPole.
   */
  constructor(cartpole_thresholds, state_as_arr = null, title = null, is_starting_state = false) {

//https://mlpack.org/doc/mlpack-git/doxygen/classmlpack_1_1rl_1_1CartPole.html

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


    this.viewer = new Cartpole_Viewer(this)
    this.id = CartPole.id++
    this.title = title ? title : ""

    if(state_as_arr == null)
      state_as_arr = this.genRandomState()

    this.setState_privateMethod(state_as_arr)

    //save init state
    this.state_history = [state_as_arr]
}

  //===========< BEGIN Static Methods >================//

  static generateRandomPolicy() {
    let policy = []
    for(let i = 0; i < 4; i++)
      //random number from [-1,1]
      policy.push((Math.random() * 2) - 1)
    return policy

  }
  /**
  generates requested states from high-level descriptions
  **/
  static getStateArrFromHumanReadableStates(human_readable_state, cartpole_thresholds) {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    let x_name = human_readable_state[0]
    let x_dot_name = human_readable_state[1]
    let theta_name = human_readable_state[2]
    let theta_dot_name = human_readable_state[3]

    let x = 0;
    let x_dot = 0;
    let theta = 0;
    let theta_dot = 0;

    switch(x_name) {
      case "left of center":
        x = -cartpole_thresholds.x/2; break
      case "right of center":
        x = cartpole_thresholds.x/2; break
      case "very left of center":
        x = -cartpole_thresholds.x; break
      case "very right of center":
        x = cartpole_thresholds.x; break
      case "center":
        x = 0; break;
      default :
        console.log("x_name not recognized: ",x_name)
    }
    //let x = Math.random() - 0.5;
    // Cart velocity.
    switch(x_dot_name) {
      case "going left":
        x_dot = -cartpole_thresholds.x_dot/2; break
      case "going right":
        x_dot = cartpole_thresholds.x_dot/2; break
      case "going left fast":
        x_dot = -cartpole_thresholds.x_dot/2; break
      case "going right fast":
        x_dot = cartpole_thresholds.x_dot/2; break
      case "still":
        x_dot = 0; break
      default:
        console.log("x_dot not recognized: ",x_dot)
    }

    //let x_dot = (Math.random() - 0.5) * 1;
    // Pole angle, radians.
    switch(theta_name) {
      case "leaning left":
        theta = -cartpole_thresholds.theta/2; break
      case "leaning right":
        theta = cartpole_thresholds.theta/2; break
      case "upright":
        theta = 0; break
      default:
        console.log("theta not recognized: ",theta)

    }
    //let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);
    // Pole angle velocity.
    switch(theta_dot_name) {
      case "rotating left":
        theta_dot = -cartpole_thresholds.theta_dot/2; break
      case "rotating right":
        theta_dot = cartpole_thresholds.theta_dot/2; break
      case "still":
        theta_dot = 0; break
      default:
        console.log("theta_dot not recognized: ",theta_dot)
    }
    //let theta_dot =  (Math.random() - 0.5) * 0.5;

    return [x,x_dot, theta, theta_dot];
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
    let state = [this.x, this.x_dot,this.theta,this.theta_dot ]
    return state
  }

  /**
  returns current sim trace data
  **/
  getSimTrace() {
    return {
      action_history : this.action_history,
      state_history : this.state_history,
      maxT : this.state_history.length
    }
  }

  getTitle() {
    return this.title
  }

  /**
   * Set the state of the cart-pole system randomly.
   */
  genRandomState() {

    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    //let x = Math.random() - 0.5;  was in original code...
    let x = Util.genRandomFloat(-this.cartpole_thresholds["x"]/2,this.cartpole_thresholds["x"]/2)
    // Cart velocity.
    let x_dot = (Math.random() - 0.5) * 1;

    // Pole angle, radians.
    //let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);   was in original code...
    let theta  = Util.genRandomFloat(-this.cartpole_thresholds["theta"]/2,this.cartpole_thresholds["theta"]/2)

    // Pole angle velocity.
    let theta_dot =  (Math.random() - 0.5) * 0.5;

    return [x,x_dot, theta, theta_dot]
  }

  /**
   * Set the starting state of the cart-pole system randomly.
   */
  setStartingState() {
    let stateArr = this.genStartingState()
    this.setState(stateArr)
  }

  /**
   * Reset after entering a degenerate state or restarting.
   */
  reset() {
    this.setStartingState()
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



  /**
   * Get current state as a tf.Tensor of shape [1, 4].
  getStateTensor() {
    return tf.tensor2d([[this.x, this.x_dot, this.theta, this.theta_dot]]);
  }
  */

  reset(new_state_as_arr = null) {
    var initState = (new_state_as_arr == null) ? this.genRandomState() : new_state_as_arr
    this.setState_privateMethod(initState)
    this.state_history = [initState]
    this.action_history = []
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

/*

/**
get min and max values of a particular stateVar

@stateArr: an array of arrays
@policy: an array of floats. If null, the choose random action
@returns {array} a 2 element array containing the min & max threshold of a state variable
**
getMinMax(stateVar) {
  return [-this.cartpole_thresholds[stateVar],this.cartpole_thresholds[stateVar]]
}

/**
TODO: fix and make better
**
getOrderedStates(stateVar1, stateVar1NumIncs, stateVar2, stateVar2NumIncs) {//, stateVar1Range = null, stateVar2Range = null) {
  var orderedStates = []

  let state1Range = this.getMinMax(stateVar1)
  let state2Range = this.getMinMax(stateVar2)

  let state1Inc = (state1Range[1] - state1Range[0])/(stateVar1NumIncs)
  let state2Inc = (state2Range[1] - state2Range[0])/(stateVar2NumIncs)
  let x_dot = this.cartpole_thresholds["x_dot"]/4
  let theta_dot = this.cartpole_thresholds["theta_dot"]/4

  for(var i = state1Range[0]; i < state1Range[1]; i+=state1Inc)
    for(var j = state2Range[0]; j < state2Range[1]; j+=state2Inc) {
      orderedStates.push([i,x_dot,j,theta_dot])
    }

    console.log(orderedStates)
  return orderedStates
}

*/

}
