
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


    this.viewer = new Cartpole_Viewer(this)
    this.id = CartPole.id++
    this.title = title ? title : ""

    if(state_as_arr == null)
      state_as_arr = CartPole.genRandomState(this.cartpole_thresholds)

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
   * Set the state of the cart-pole system randomly.
   */
  static genRandomState(cartpole_thresholds) {

    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    //let x = Math.random() - 0.5;  was in original code...
    let x = Util.genRandomFloat(-cartpole_thresholds["x"]/2,cartpole_thresholds["x"]/2)
    // Cart velocity.
    let x_dot = (Math.random() - 0.5) * 1;

    // Pole angle, radians.
    //let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);   was in original code...
    let theta  = Util.genRandomFloat(-cartpole_thresholds["theta"]/2,cartpole_thresholds["theta"]/2)

    // Pole angle velocity.
    let theta_dot =  (Math.random() - 0.5) * 0.5;

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
     * Get current state as a tf.Tensor of shape [1, 4].
    getStateTensor() {
      return tf.tensor2d([[this.x, this.x_dot, this.theta, this.theta_dot]]);
    }
    */

    reset(new_state_as_arr = null) {
      var initState = (new_state_as_arr == null) ? CartPole.genRandomState(this.cartpole_thresholds) : new_state_as_arr
      this.setState_privateMethod(initState)
      this.state_history = [initState]
      this.action_history = []
    }

  /**
   * Set the starting state of the cart-pole system randomly.
   */
  setStartingState() {
    let stateArr = this.genStartingState()
    this.setState(stateArr)
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
