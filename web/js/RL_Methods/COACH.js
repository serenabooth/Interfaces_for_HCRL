class COACH {

    constructor(num_states, num_actions, trace_set) {
        this.weights = tf.zeros([num_states, num_actions]);
        this.trace_set = trace_set;
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
        let SM = tf.reshape(tf.tensor(s), [-1, 1])
        let dot_SM = tf.matMul(SM, SM, false, true)
        let jacobian = tf.sub(diagflat_s, dot_SM)

        diagflat_s.dispose()
        SM.dispose()
        dot_SM.dispose()

        return jacobian
    }

    softmax(arr) {
        const C = Math.max(arr);
        const d = arr.map((y) => Math.exp(y - C)).reduce((a, b) => a + b);
        return arr.map((value, index) => { 
            return Math.exp(value - C) / d;
        })
    }

    COACH(domain,
          num_episodes = 10,
          trace_set = [0.99],
          learning_rate = 0.05) {


    }



}
