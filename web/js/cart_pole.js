//https://github.com/tensorflow/tfjs-examples/blob/master/cart-pole/cart_pole.js

/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Implementation based on: http://incompleteideas.net/book/code/pole.c
 */

/**
 * Cart-pole system simulator.
 *
 * In the control-theory sense, there are four state variables in this system:
 *
 *   - x: The 1D location of the cart.
 *   - x_dot: The velocity of the cart.
 *   - theta: The angle of the pole (in radians). A value of 0 corresponds to
 *     a vertical position.
 *   - theta_dot: The angular velocity of the pole.
 *
 * The system is controlled through a single action:
 *
 *   - leftward or rightward force.
 */
class CartPole {
  /**
   * Constructor of CartPole.
   */

    constructor(cartpole_thresholds, state_as_arr = null) {

    // Constants that characterize the system.
    this.gravity = 9.8;
    this.massCart = 1.0;
    this.massPole = 0.1;
    this.totalMass = this.massCart + this.massPole;
    //this.cartWidth = 0.2;
    //this.cartHeight = 0.1;
    this.length = 0.5;
    this.poleMoment = this.massPole * this.length;
    this.forceMag = 10.0;

    // Seconds between state updates.
    this.tau = 0.02;

    //list of states in this sim
    this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]
    // Threshold values, beyond which a simulation will be marked as failed.
    this.cartpole_thresholds = cartpole_thresholds

    //actions as consts
    this.MOVE_LEFT = 0
    this.MOVE_RIGHT = 1

    this.viewer = new Cartpole_Viewer(this)

    if(state_as_arr == null)
      this.setRandomState();
    else
      this.setState(state_as_arr)

  }

  /**
  returns cartpole state
  **/
  getState(asArr = true) {
    //TODO: give option to return as object

    let state = [this.x, this.x_dot,this.theta,this.theta_dot ]

    if(!asArr)
      state = Util.stateArrToObj(state, this.state_var_list)

    return state

  }



  /**
  calculate the action given the state & policy

  @policy: an array of floats. If null, the choose random action
  @state_as_arr: an array of numbers. if null, then get own state
  **/
  getAction(policy = null, state_as_arr = null) {

    if(state_as_arr == null)
      state_as_arr = this.getState()

    var bool = (policy == null) ? (Math.random() < 0.5) : (math.dot(policy,state_as_arr) < 0)
    if(bool)
      return this.MOVE_LEFT
    else
      return this.MOVE_RIGHT
  }

  /**
  Get the opposite action
  **/
  getCounterFactualAction(curr_action) {
    let cf_action = (curr_action == this.MOVE_LEFT) ? this.MOVE_RIGHT : this.MOVE_LEFT
    return cf_action
  }

  /**
  get min and max values of a particular stateVar

  @stateArr: an array of arrays
  @policy: an array of floats. If null, the choose random action
  **/
  getMinMax(stateVar) {
    return [-this.cartpole_thresholds[stateVar],this.cartpole_thresholds[stateVar]]
  }

  /**
  TODO: fix and make better
  **/
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

  /**
  generates single random state
  **/
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
  generates requested states from high-level descriptions
  **/
  getSpecificState(x_name,x_dot_name,theta_name,theta_dot_name) {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    let x = 0;
    let x_dot = 0;
    let theta = 0;
    let theta_dot = 0;

    switch(x_name) {
      case "left of center":
        x = -this.cartpole_thresholds.x/2;
      case "right of center":
        x = this.cartpole_thresholds.x/2;
      case "very left of center":
        x = -this.cartpole_thresholds.x;
      case "very right of center":
        x = this.cartpole_thresholds.x;
      case "center":
        x = 0;
    }
    //let x = Math.random() - 0.5;
    // Cart velocity.
    switch(x_dot_name) {
      case "going left":
        x_dot = -this.cartpole_thresholds.x_dot/2;
      case "going right":
        x_dot = this.cartpole_thresholds.x_dot/2;
      case "going left fast":
        x_dot = -this.cartpole_thresholds.x_dot/2;
      case "going right fast":
        x_dot = this.cartpole_thresholds.x_dot/2;
      case "still":
        x_dot = 0;
    }
    //let x_dot = (Math.random() - 0.5) * 1;
    // Pole angle, radians.
    switch(theta_name) {
      case "leaning left":
        theta = -this.cartpole_thresholds.theta/2;
      case "leaning right":
        theta = this.cartpole_thresholds.theta/2;
      case "upright":
        theta = 0;
    }
    //let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);
    // Pole angle velocity.
    switch(theta_dot_name) {
      case "rotating left":
        theta_dot = -this.cartpole_thresholds.theta_dot/2;
      case "rotating right":
        theta_dot = this.cartpole_thresholds.theta_dot/2;
      case "still":
        theta_dot = 0;
    }
    //let theta_dot =  (Math.random() - 0.5) * 0.5;

    return [x,x_dot, theta, theta_dot];
  }


  /**
   * Determine whether this simulation is done.
   *
   * A simulation is done when `x` (position of the cart) goes out of bound
   * or when `theta` (angle of the pole) goes out of bound.
   *
   * @returns {bool} Whether the simulation is done.
   */
  isDone() {
    return this.x < -this.cartpole_thresholds["x"] || this.x > this.cartpole_thresholds["x"] ||
        this.theta < -this.cartpole_thresholds["theta"] || this.theta > this.cartpole_thresholds["theta"];
  }

  /**
  check whether the cart state is degenerate

  @return null if state was *not* degenerate. Otherwise return fixed state_as_obj
  **/
  fixDegenerate(state_as_obj = null) {

    let hadToFix = false
    let fixedState = {}

    if(state_as_obj == null)
      state_as_obj = this.getState(false)

    //check to see if any state vars have exceeded threshold
    for(let i = 0; i < this.state_var_list.length; i++) {
      let state_var_name = this.state_var_list[i]
      let state_var_val = state_as_obj[state_var_name]
      let state_var_threshold = this.cartpole_thresholds[state_var_name]

      //if there is no threshold defined, then keep orig value
      if(!(state_var_name in this.cartpole_thresholds)) {
        fixedState[state_var_name] = state_var_val
        continue
      }

      //fix value if needed
      if(Math.abs(state_var_val) > state_var_threshold) {
        hadToFix = true
        state_var_val = state_var_val < -state_var_threshold ? -state_var_threshold : state_var_threshold
      }
      fixedState[state_var_name] = state_var_val
    }

    return hadToFix ? fixedState : null
  }

  /**
  set cartpole state from array of state values
  **/
  setState(state_as_arr) {
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
   * Set the state of the cart-pole system randomly.
   */
  setRandomState() {
    let stateArr = this.genRandomState()
    this.setState(stateArr)
  }

  /**
   * Set the state of the cart-pole system according to an argument.
   */
  setState(stateArr) {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    this.x = stateArr[0]
    // Cart velocity.
    this.x_dot = stateArr[1]
    // Pole angle, radians.
    this.theta = stateArr[2]
    // Pole angle velocity.
    this.theta_dot =  stateArr[3]
  }

  /**
   * Get current state as a tf.Tensor of shape [1, 4].
  getStateTensor() {
    return tf.tensor2d([[this.x, this.x_dot, this.theta, this.theta_dot]]);
  }
  */


  /**
  simulates the next time step(s) of the cartpole
  does not update internal state of the sim

  TODO: ceil/floor when we create a degenerate case (i.e. exceeding thresholds)
  TODO: create a user note that we have created a degenerate case

  @param {float} action if null, then no force applied. Else right-force for positive number and left-force for negative
  @param {int} timesteps number of timesteps to simulate (# secs depends on this.tau)
  @return obj {
      "next" : the state after the next timestep
      "future" : state beyond 1 timestep, assuming the same velocity
      "degenerate" : true if next and/or future states are degenerate (go beyond thresholds)
  }
  **/
  simulate(action, timesteps = 1) {

    if(action == null)
      var force = 0
    else
      var force = action > 0 ? this.forceMag : -this.forceMag;

    const cosTheta = Math.cos(this.theta);
    const sinTheta = Math.sin(this.theta);

    const temp =
        (force + this.poleMoment * this.theta_dot * this.theta_dot * sinTheta) /
        this.totalMass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
        (this.length *
         (4 / 3 - this.massPole * cosTheta * cosTheta / this.totalMass));
    const xAcc = temp - this.poleMoment * thetaAcc * cosTheta / this.totalMass;

    // Update the four state variables, using Euler's method.
    //update for 1 timestep
    let x = this.x + (this.tau * this.x_dot);
    let theta = this.theta + (this.tau * this.theta_dot);
    //update the velocity from the action
    let x_dot = this.x_dot + (this.tau * xAcc);
    let theta_dot = this.theta_dot + (this.tau * thetaAcc);

    let next_timestep_state_obj = {
      "x" : x,
      "x_dot" : x_dot,
      "theta" : theta,
      "theta_dot" : theta_dot
    }

    let beyond_state_obj = {...next_timestep_state_obj}

    //simulate forward the rest of the steps
    if(timesteps > 1) {
      x += (timesteps-1)*(this.tau * x_dot);
      theta += (timesteps-1)*(this.tau * theta_dot);
      beyond_state_obj.x = x
      beyond_state_obj.theta = theta
    }

    //if either of these go beyond thresholds, then cap at thresholds
    let next_needed_fixing = this.fixDegenerate(next_timestep_state_obj)
    let beyond_needed_fixing = this.fixDegenerate(beyond_state_obj)

    /*
    console.log("next")
    console.log(next_timestep_state_obj)
    console.log(next_needed_fixing)

    console.log("beyond")
    console.log(beyond_state_obj)
    console.log(beyond_needed_fixing)
    */

    return {
      "next" : next_needed_fixing == null ? next_timestep_state_obj : next_needed_fixing,
      "future" : beyond_needed_fixing == null ? beyond_state_obj : beyond_needed_fixing,
      "degenerate" : (next_needed_fixing != null) ||  (beyond_needed_fixing != null)
    }
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

    if(!Array.isArray(state))
      state = Util.stateObjToArr(state, this.state_var_list)

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

  /**
   * Update the cart-pole system using an action.

   * @param {number} action Only the sign of `action` matters.
   *   A value > 0 leads to a rightward force of a fixed magnitude.
   *   A value <= 0 leads to a leftward force of the same fixed magnitude.
   */
  update(action) {

    next = this.simulate(action)

    this.x = next.x
    this.x_dot = next.x_dot
    this.theta = next.theta
    this.theta_dot = next.theta_dot

    return this.isDone();
  }

}
