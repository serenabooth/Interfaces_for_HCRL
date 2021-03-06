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
class CartPoleSim {

    constructor(cartpole_thresholds) {

      //list of states in this sim
      this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]

      // Threshold values, beyond which a simulation will be marked as failed.
      this.cartpole_thresholds = cartpole_thresholds


      //====< BEGIN Cartpole Contants >======//

      // Constants that characterize the system.
      this.gravity = 9.8;
      // Seconds between state updates.
      this.tau = 0.02;
      //magnitude of force applied
      this.forceMag = 10.0

      //====< END Cartpole Contants >======//
    }


    /**
    returns true if the particular variable has exceeded the threshold

    @param{array} state_as_arr
    @param{string} state_var_name
    **/
    exceedsThreshold(state_as_arr, state_var_name) {
      let state_var_threshold = this.cartpole_thresholds[state_var_name]
      let i = this.state_var_list.indexOf(state_var_name)

      return (i < 0) ? true : Math.abs(state_as_arr[i]) > state_var_threshold
    }

    /**
    check whether the cart state is degenerate

    @return null if state was *not* degenerate. Otherwise return fixed state_as_obj
    **/
    fixDegenerate(cartpole_state) {

      let hadToFix = false
      let fixedState = {}

      //check to see if any state vars have exceeded threshold
      for(let i = 0; i < this.state_var_list.length; i++) {
        let state_var_name = this.state_var_list[i]

        //if there is no threshold defined, then keep orig value
        fixedState[state_var_name] = cartpole_state[i]
        if(!(state_var_name in this.cartpole_thresholds))
          continue

        //fix value if needed (i.e. limit to threshold)
        let state_var_threshold = this.cartpole_thresholds[state_var_name]
        if (Math.abs(cartpole_state[i]) > state_var_threshold) {
          hadToFix = true
          fixedState[state_var_name] = state_var_val < -state_var_threshold ? -state_var_threshold : state_var_threshold
        }
      }

      return hadToFix ? fixedState : null
    }


    /**
    Get the opposite action
    **/
    getCounterFactualAction(curr_action) {
      let cf_action = (curr_action == MOVE_LEFT) ? MOVE_RIGHT : MOVE_LEFT
      return cf_action
    }


    /**
     * Determine whether this simulation is done.
     *
     * A simulation is done when `x` (position of the cart) goes out of bound
     * or when `theta` (angle of the pole) goes out of bound.
     *
     * @returns {bool} Whether the simulation is done.
     */
    isDone(cartpole) {
      let cartpoleState = Array.isArray(cartpole) ? cartpole : cartpole.getState()
      return this.exceedsThreshold(cartpoleState, "x") || this.exceedsThreshold(cartpoleState, "theta")
    }

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
  simulate_single_timestep_private(cartpole, action) {

    //if action is null, then force is also 0. Otherwise LEFT = -1 and RIGHT = 1
    var force = action * this.forceMag

    const cosTheta = Math.cos(cartpole.theta);
    const sinTheta = Math.sin(cartpole.theta);

    const temp =
        (force + cartpole.poleMoment * cartpole.theta_dot * cartpole.theta_dot * sinTheta) /
        cartpole.totalMass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
        (cartpole.length *
         (4 / 3 - cartpole.massPole * cosTheta * cosTheta / cartpole.totalMass));
    const xAcc = temp - cartpole.poleMoment * thetaAcc * cosTheta / cartpole.totalMass;

    // Update the four state variables, using Euler's method.
    //update for 1 timestep
    let x = cartpole.x + (this.tau * cartpole.x_dot);
    let theta = cartpole.theta + (this.tau * cartpole.theta_dot);
    //update the velocity from the action
    let x_dot = cartpole.x_dot + (this.tau * xAcc);
    let theta_dot = cartpole.theta_dot + (this.tau * thetaAcc);

    return [x, x_dot, theta, theta_dot]
  }

  /**
  Given the current state of the cartpole, will simulate for

   @param{object} cartpole
   @param{object} policy
   @param{number} maxTimesteps
   @param{number} numStepsToCoast
  **/
  simulation_from_policy(cartpole, policy, maxTimesteps, numStepsToCoast = 0) {

      //simuation with policy being applied
      for(let i = 0; i < maxTimesteps; i++) {

        //get action from policy
        let action = policy.get_action(cartpole.getState())

        //simulate next timestep
        let next_state = this.simulate_single_timestep_private(cartpole, action)
        cartpole.addSimTimestep(next_state,action)

        //check to see whether cartpole survived
        if(this.isDone(cartpole)) {
            break;
        }

      }

      //coast for a few steps
      while(!this.isDone(cartpole) && numStepsToCoast > 0) {
        let next_state = this.simulate_single_timestep_private(cartpole, null)
        cartpole.addSimTimestep(next_state,null)
        numStepsToCoast--
      }

      return cartpole.getSimTrace()
  }

  /**
  Given the current state of the cartpole, will simulate for
  **/
  simulation_from_action_sequence(cartpole, action_sequence, numStepsToCoast = 0) {
      //simuation with policy being applied
      for(let i = 0; i < action_sequence.length; i++) {

        //get action from policy
        let action = action_sequence[i]
        if (action == 0) {
          action = MOVE_LEFT
        }
        else {
          action = MOVE_RIGHT
        }

        //simulate next timestep
        let next_state = this.simulate_single_timestep_private(cartpole, action)
        cartpole.addSimTimestep(next_state,action)

        //check to see whether cartpole survived
        if(this.isDone(cartpole))
          break;

      }

      //coast for a few steps
      while(!this.isDone(cartpole) && numStepsToCoast > 0) {
        let next_state = this.simulate_single_timestep_private(cartpole, null)
        cartpole.addSimTimestep(next_state,null)
        numStepsToCoast--
      }

      return cartpole.getSimTrace()
  }

}
