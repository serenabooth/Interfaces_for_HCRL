class Linear_Policy {

  /***
   * Construct a new Linear Policy
   *
   * @param cartpole_thresholds
   * @param{int} n_weights
   * @param{boolean} weights_are_random
   * @param{boolean} good_performance
   */
  constructor(cartpole_thresholds, n_weights, weights_are_random=true, good_performance=false) {
    this.cartpole_thresholds = cartpole_thresholds
    this.num_weights = n_weights

    if (weights_are_random) {
      this.generate_random_weights();
      // ensure the policy has acceptable performance
      if (good_performance) {
        while (!this.has_acceptable_performance()) {
          this.generate_random_weights()
        }
      }
    }
    else {
      this.weights = new Array(n_weights).fill(0.0);
    }

    //actions as consts
    this.MOVE_LEFT = -1
    this.MOVE_RIGHT = 1
  }

  /***
   * Generate new random weights
   */
  generate_random_weights() {
    this.weights = []
    for (var i = 0; i < this.num_weights; i++) {
      this.weights.push(Math.random())
    }
  }

  /***
   * Return the weights
   */
  get_params() {
    return this.weights
  }

  /***
   * Check the policy from a random starting position;
   * ensure that it reaches sufficiently many steps.
   *
   * @return{boolean} true if policy survives 100 steps from a common starting point
   */
  has_acceptable_performance() {

    let starting_state = State.genRandomState(this.cartpole_thresholds,  true, 'array')
    let cartpoleSim = new CartPoleSim(this.cartpole_thresholds)
    let cp = new CartPole(this.cartpole_thresholds, starting_state)

    let num_steps = 200
    cartpoleSim.simulation_from_policy(cp, this, num_steps)

    if (cp.state_history.length < num_steps) {
      return false
    }
    console.log("acceptable")
    return true
  }

  /***
   * Compute the action based on the state and policy
   *
   * @param state
   * @returns {number}
   */
  get_action(state){
    if (state == undefined) {
      console.log("State is undefined; cannot compute action")
    }
    if ("x" in state && "x_dot" in state && "theta" in state && "theta_dot" in state) {
      state = State.convertStateToArr(state)
    }

    // let state_array = [state.x, state.x_dot, state.theta, state.theta_dot];
    let move = math.dot(this.weights, state);
    return ((move < 0) ? this.MOVE_LEFT : this.MOVE_RIGHT)
  }

}
