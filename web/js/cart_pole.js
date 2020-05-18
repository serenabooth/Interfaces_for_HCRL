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


    //list of states in this sim
    this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]
    // Threshold values, beyond which a simulation will be marked as failed.
    this.cartpole_thresholds = cartpole_thresholds

    //actions as consts
    this.MOVE_LEFT = 0
    this.MOVE_RIGHT = 1

    this.setRandomState();
  }

  /**
  calculate the action given the state & policy

  @state_as_arr: an array of numbers
  @policy: an array of floats. If null, the choose random action
  **/
  getAction(state_as_arr,policy = null) {

    var bool = (policy == null) ? (Math.random() < 0.5) : (math.dot(policy,state_as_arr) < 0)
    if(bool)
      return this.MOVE_LEFT
    else
      return this.MOVE_RIGHT
  }

  /**
  calculate an action for each state in the list

  @param {array} stateArr an array of arrays
  @param {array} policy an array of floats. If null, the choose random action
  **/
  getActions(stateArr, policy = null) {
    var actions = []

    for(let state of stateArr) {
      let action = this.getAction(state,policy)
      actions.push(action)
    }

    return actions
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
  generates an array random states
  **/
  getRandomStates(numStates) {
    var randomStates = []
    for(let i = 0; i < numStates; i++) {
      randomStates.push( this.getRandomState())
    }
    return randomStates
  }

  /**
  generates single random state
  **/
  getRandomState() {
    // The control-theory state variables of the cart-pole system.
    // Cart position, meters.
    let x = Math.random() - 0.5;
    // Cart velocity.
    let x_dot = (Math.random() - 0.5) * 1;
    // Pole angle, radians.
    let theta = (Math.random() - 0.5) * 2 * (6 / 360 * 2 * Math.PI);
    // Pole angle velocity.
    let theta_dot =  (Math.random() - 0.5) * 0.5;

    return [x,x_dot, theta, theta_dot]
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
        (force + this.poleMoment * this.theta_dot * this.theta_dot * sinTheta) /
        this.totalMass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
        (this.length *
         (4 / 3 - this.massPole * cosTheta * cosTheta / this.totalMass));
    const xAcc = temp - this.poleMoment * thetaAcc * cosTheta / this.totalMass;

    // Update the four state variables, using Euler's metohd.
    this.x += this.tau * this.x_dot;
    this.x_dot += this.tau * xAcc;
    this.theta += this.tau * this.theta_dot;
    this.theta_dot += this.tau * thetaAcc;

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
    return this.x < -this.cartpole_thresholds["x"] || this.x > this.cartpole_thresholds["x"] ||
        this.theta < -this.cartpole_thresholds["theta"] || this.theta > this.cartpole_thresholds["theta"];
  }
}
