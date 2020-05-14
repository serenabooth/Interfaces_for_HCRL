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
 *   - xDot: The velocity of the cart.
 *   - theta: The angle of the pole (in radians). A value of 0 corresponds to
 *     a vertical position.
 *   - thetaDot: The angular velocity of the pole.
 *
 * The system is controlled through a single action:
 *
 *   - leftward or rightward force.
 */
class CartPole {
  /**
   * Constructor of CartPole.
   */
  constructor(cartpole_thresholds) {
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
    this.tau = 0.02;  // Seconds between state updates.

    // Threshold values, beyond which a simulation will be marked as failed.
    this.xThreshold = cartpole_thresholds["x"]  //2.4;
    this.thetaThreshold = cartpole_thresholds["theta"]//12 / 360 * 2 * Math.PI;
    this.xdotThreshold = cartpole_thresholds["x_dot"]
    this.thetaDotThreshold = cartpole_thresholds["theta_dot"]

    this.MOVE_LEFT = 0
    this.MOVE_RIGHT = 1

    this.setRandomState();
  }

  getMinMax(stateVar) {
      switch(stateVar) {
        case "x" : return [-this.xThreshold, this.xThreshold]
        case "xDot" : return [-this.thetaThreshold, this.thetaThreshold]
        case "theta" : return [-this.thetaThreshold, this.thetaThreshold]
        case "thetaDot" : return [-this.thetaDotThreshold, this.thetaDotThreshold]
      }
  }

  //calculate the action given the state & policy
  getAction(state_as_arr,policy) {
    if(math.dot(policy,state_as_arr) < 0)
      return this.MOVE_LEFT
    else
      return this.MOVE_RIGHT
  }

  //calculate a list of actions given a list of states
  getActions(stateArr, policy) {
    var actions = []

    for(let state of stateArr)
      actions.push(this.getAction(state,policy))
      
    return actions
  }

/**
TODO: fix and make better
**/
  //x, xDot, theta, thetaDot
  getOrderedStates(stateVar1, stateVar1NumIncs, stateVar2, stateVar2NumIncs) {//, stateVar1Range = null, stateVar2Range = null) {
    var orderedStates = []

    this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]
    let state1Range = this.getMinMax(stateVar1)
    let state2Range = this.getMinMax(stateVar2)

    let state1Inc = (state1Range[1] - state1Range[0])/(stateVar1NumIncs)
    let state2Inc = (state2Range[1] - state2Range[0])/(stateVar2NumIncs)
    let xDotThreshold = this.xdotThreshold/4
    let thetaDotThreshold = this.thetaDotThreshold/4

    for(var i = state1Range[0]; i < state1Range[1]; i+=state1Inc)
      for(var j = state2Range[0]; j < state2Range[1]; j+=state2Inc) {
        orderedStates.push([i,xDotThreshold,j,thetaDotThreshold])
      }

      console.log(orderedStates)
    return orderedStates
  }

  getRandomStates(numStates) {
    var randomStates = []
    for(let i = 0; i < numStates; i++) {
      randomStates.push( this.getRandomState())
    }
    return randomStates
  }

  getRandomState() {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    let x = Math.random() - 0.5;
    // Cart velocity.
    let xDot = (Math.random() - 0.5) * 1;
    // Pole angle, radians.
    let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);
    // Pole angle velocity.
    let thetaDot =  (Math.random() - 0.5) * 0.5;

    return [x,xDot, theta, thetaDot]
  }
  /**
   * Set the state of the cart-pole system randomly.
   */
  setRandomState() {

    let stateArr = this.getRandomState()
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    this.x = stateArr[0]
    // Cart velocity.
    this.xDot = stateArr[1]
    // Pole angle, radians.
    this.theta = stateArr[2]
    // Pole angle velocity.
    this.thetaDot =  stateArr[3]
  }


  /**
   * Get current state as a tf.Tensor of shape [1, 4].
  getStateTensor() {
    return tf.tensor2d([[this.x, this.xDot, this.theta, this.thetaDot]]);
  }
  */

  /**
   * Update the cart-pole system using an action.
   * @param {number} action Only the sign of `action` matters.
   *   A value > 0 leads to a rightward force of a fixed magnitude.
   *   A value <= 0 leads to a leftward force of the same fixed magnitude.
   */
  update(action) {
    const force = action > 0 ? this.forceMag : -this.forceMag;

    const cosTheta = Math.cos(this.theta);
    const sinTheta = Math.sin(this.theta);

    const temp =
        (force + this.poleMoment * this.thetaDot * this.thetaDot * sinTheta) /
        this.totalMass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
        (this.length *
         (4 / 3 - this.massPole * cosTheta * cosTheta / this.totalMass));
    const xAcc = temp - this.poleMoment * thetaAcc * cosTheta / this.totalMass;

    // Update the four state variables, using Euler's metohd.
    this.x += this.tau * this.xDot;
    this.xDot += this.tau * xAcc;
    this.theta += this.tau * this.thetaDot;
    this.thetaDot += this.tau * thetaAcc;

    return this.isDone();
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
    return this.x < -this.xThreshold || this.x > this.xThreshold ||
        this.theta < -this.thetaThreshold || this.theta > this.thetaThreshold;
  }
}
