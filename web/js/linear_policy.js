class Linear_Policy {

  constructor(n_weights) {
    this.weights = new Array(n_weights).fill(0.0);
    console.log(this.weights);
  }

  get_move(state){
    var state_array = [state.x, state.x_dot, state.theta, state.theta_dot]
    var dotprod = math.dot(this.weights, state);
    console.log("Hello")
    console.log(dotprod)
  }

}
