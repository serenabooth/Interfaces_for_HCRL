class Linear_Policy {

  constructor(n_weights, random_weights=false) {
    this.weights = []
    if (random_weights) {
      for (var i = 0; i < n_weights; i++) {
        this.weights.push(Math.random())
      }
    }
    else {
      this.weights = new Array(n_weights).fill(0.0);
    }
    console.log(this.weights);
  }

  get_params() {
    return this.weights
  }

  get_move(state){
    var state_array = [state.x, state.x_dot, state.theta, state.theta_dot]
    var dotprod = math.dot(this.weights, state);
    console.log("Hello")
    console.log(dotprod)
  }

}
