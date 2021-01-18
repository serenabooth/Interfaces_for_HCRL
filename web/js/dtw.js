class DTW {
    /***
     * An implementation of dynamic time warping. Returns the DTW Cost Matrix.
     * Source: https://towardsdatascience.com/dynamic-time-warping-3933f25fcdd
     *
     * @param{array} s_traj
     * @param{array} t_traj
     * @param{number} window
     * @returns {*[]}
     */
    static dtw_accumulated_cost_matrix(s_traj, t_traj, window = 2) {
        let n = s_traj.length
        let m = t_traj.length
        let w = Math.max(window, Math.abs(n-m))

        let dtw_matrix = Array(n+1).fill().map(() => Array(m+1).fill(0))

        for (let i = 0; i < n+1; i++) {
            for (let j = 0; j < m+1; j++) {
                dtw_matrix[i][j] = Infinity
                dtw_matrix[0][0] = 0
            }
        }

        for (let i = 1; i < n+1; i++) {
            for (let j = Math.max(1, i-w); j < Math.min(m, i+w)+1; j++) {
                dtw_matrix[i][j] = 0
            }
        }

        for (let i = 1; i < n+1; i++) {
            for (let j = Math.max(1, i-w); j < Math.min(m, i+w)+1; j++) {
                let cost = Util.eucDistance(s_traj[i-1], t_traj[j-1])
                // take last min from a square box
                let last_min = Math.min(dtw_matrix[i-1][j], dtw_matrix[i][j-1], dtw_matrix[i-1][j-1])
                dtw_matrix[i][j] = cost + last_min
            }
        }

        return dtw_matrix
    }


    /***
     * Given the cumulative cost matrix, compute the DTW path mapping one trajectory to another.
     *
     * @param{Array} cost_matrix a 2D cumulative cost matrix for DTW
     * @param{Array} pos  the current position
     * @returns {*[]|[*, *][]} a list of lists, corresponding to the pathway *in reverse order*
     */
    static compute_dtw_path (cost_matrix, pos) {
        let x = pos[0]
        let y = pos[1]

        if (x == 0 && y == 0) {
            return []
        }

        let indices = []
        let costs = []
        if (x > 0 && y > 0) {
            indices.push([x-1, y-1])
        }
        if (x > 0) {
            indices.push([x-1,y])
        }
        if (y > 0) {
            indices.push([x,y-1])
        }

        let min_val = Math.min(cost_matrix[x-1][y-1], cost_matrix[x-1][y], cost_matrix[x][y-1])

        let index = null
        if (min_val == cost_matrix[x-1][y-1]) {
            index = 0
        }
        else if (min_val === cost_matrix[x-1][y]) {
            index = 1
        }
        else {
            index = 2
        }

        let ret_val = [indices[index]].concat(this.compute_dtw_path(cost_matrix, indices[index]))
        return ret_val

    }


    /***
     * Compute the cost and path for dynamic time warping one trajectory to another.
     * Returns the path of origin_traj mapped onto target_traj
     *
     * @param{Array} origin_traj
     * @param{Array} target_traj
     * @param{Number} window the number of neighbors from t_traj which can be mapped to a single entry of s_traj
     * @returns {{path: Uint8Array | any[] | Int16Array | Uint16Array | this | Uint8ClampedArray | Float32Array | Int32Array | Float64Array | Uint32Array | Int8Array | this | void, cost: *}}
     */
    static dtw(origin_traj, target_traj, window = 3) {
        let accumulated_cost_matrix = this.dtw_accumulated_cost_matrix(origin_traj, target_traj, window)
        let x_len = accumulated_cost_matrix.length
        let y_len = accumulated_cost_matrix[x_len - 1].length
        let total_cost = accumulated_cost_matrix[x_len-1][y_len-1]

        let coord_path = this.compute_dtw_path(accumulated_cost_matrix, [x_len-1, y_len-1]).reverse()

        let warped_path = []
        for (let i = 0; i < coord_path.length; i++) {
            warped_path.push(target_traj[coord_path[i][1]])
        }

        return {"cost": total_cost,
            "path": warped_path}

    }
}