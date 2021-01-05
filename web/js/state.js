class State {

    /**
     * Generate a random state.
     * This sets the control-theory state variables of the cart-pole system.
     *
     * @param array cartpole_thresholds
     * @param boolean starting_state
     */
    static genRandomState(cartpole_thresholds, starting_state = false, astype = 'array') {
        let x, x_dot, theta, theta_dot;

        // if starting state, values are all close to 0
        if (starting_state) {
            [x, x_dot, theta, theta_dot] = this.randomStartingState();
        }
        // if not a starting state, values must be within cartpole thresholds
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

        // return an array if specified; else return a dict.
        if (astype == "array") {
            return [x, x_dot, theta, theta_dot]
        }
        return {"x":x,
                "x_dot":x_dot,
                "theta":theta,
                "theta_dot":theta_dot}
    }

    /**
     * Generate a random starting state
     * All values initialized within (-0.05, 0.05)
     *
     * @return {array} an array of all 4 cartpole parameters: x, x_dot, theta, theta_dot
     */
    static randomStartingState() {
        let x, x_dot, theta, theta_dot;

        x = Util.genRandomFloat(-0.05, 0.05)
        x_dot = Util.genRandomFloat(-0.05, 0.05)
        theta = Util.genRandomFloat(-0.05, 0.05)
        theta_dot = Util.genRandomFloat(-0.05, 0.05)

        return [x, x_dot, theta, theta_dot]
    }

    /**
     * Convert a state dictionary to an array
     *
     * @param state_dict
     * @returns {array} an array of all 4 cartpole parameters: x, x_dot, theta, theta_dot
     */
    static convertStateToArr(state_dict) {
        if (state_dict == undefined) {
            console.log("State is undefined; cannot convert to array format")
        }
        if (!'x' in state_dict || !'x_dot' in state_dict || !'theta' in state_dict || !'theta_dot' in state_dict) {
            console.log("State dictionary is missing some properties")
        }
        return [state_dict["x"], state_dict["x_dot"], state_dict["theta"], state_dict["theta_dot"]]
    }

    /***
     * Get a cartesian product of states covering the state space
     *
     * @param {number} N - the interval spacing
     * @param {object} cartpole_thresholds
     * @returns {[]} a cartesian product list of states covering the space; states are arrays
     */
    static get_cartesian_state_space_cover(N, cartpole_thresholds) {
        let x_samples = Util.linspace(-cartpole_thresholds.x, cartpole_thresholds.x, N, true)
        let x_dot_samples = Util.linspace(-cartpole_thresholds.x_dot, cartpole_thresholds.x_dot, N, true)
        let theta_samples = Util.linspace(-cartpole_thresholds.theta, cartpole_thresholds.theta, N, true)
        let theta_dot_samples = Util.linspace(-cartpole_thresholds.theta_dot, cartpole_thresholds.theta_dot, N, true)

        return cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    }
}