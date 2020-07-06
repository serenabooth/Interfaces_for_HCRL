class COACH {

    constructor(num_states, num_actions, trace_set) {
        this.weights = tf.zeros([num_states, num_actions]);
        this.trace_set = trace_set;

        console.log(this.weights)
        this.eligibility_traces = {};

        for (var i = 0; i < this.trace_set.length; i++) {
          this.eligibility_traces[this.trace_set[i]] = tf.zeros([num_states, num_actions]);
        }
    }

    randargmax(arr) {
      // TODO
    }

    diagonalize_array(arr) {
        let matrix = []
        let inner_matrix = []
        for (var i = 0; i < arr.length; i++){
            inner_matrix = []
            for (var j = 0; j < arr.length; j++){
                if (i == j) {
                    inner_matrix.push(arr[i])
                }
                else {
                    inner_matrix.push(0)
                }
            }
            matrix.push(inner_matrix)
        }
        return matrix
    }

    softmax_grad(s) {
        let diagflat_s = tf.tensor(this.diagonalize_array(s))
        console.log(diagflat_s)
        let SM = tf.reshape(tf.tensor(s), [-1, 1])
        let dot_SM = tf.matMul(SM, SM, false, true)
        let jacobian = tf.sub(diagflat_s, dot_SM)

        // diagflat_s.dispose()
        // SM.dispose()
        // dot_SM.dispose()

        console.log('jacobian')
        jacobian.print()
        return jacobian.data()

    }

    // softmax(arr) {
    //     const C = Math.max(arr);
    //     const d = arr.map((y) => Math.exp(y - C)).reduce((a, b) => a + b);
    //     return arr.map((value, index) => {
    //         return Math.exp(value - C) / d;
    //     })
    // }

    pickOne(pool) {
        var key = 0;
        var selector = Math.random();
        while (selector > 0) {
            selector -= pool[key];
            key++;
        }
        // Because the selector was decremented before key was
        // incremented we need to decrement the key to get the
        // element that actually exited the loop.
        key--;
        console.log(key)
        // Using splice to return a copy of the element.
        return key;
    }

    get_proposed_action(state) {
        let action_weights = tf.softmax((tf.tensor(state).dot(this.weights)))
        // let action_weights_array = action_weights.data()
        // console.log(action_weights_array)
        // console.log(this.pickOne(action_weights_array))
        action_weights.dispose()
        // action = np.random.choice(n_action, p=action_weights)
        //
        // // # compute gradient
        console.log("here")

        let dsoftmax = this.softmax_grad(action_weights.arraySync())//[action]
          // let dlog = dsoftmax / action_weights[action]

        // console.log(dlog)
        // grad = state[None,:].T.dot(dlog[None,:])
    }

    train(domain,
          num_episodes = 10,
          trace_set = [0.99],
          learning_rate = 0.05) {
          // TODO
    }

    evaluate(domain,
          num_episodes = 10,
          trace_set = [0.99],
          learning_rate = 0.05) {
          // TODO
    }



}
