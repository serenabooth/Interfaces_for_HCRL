class NWunsch {

    /***
     * Needleman-Wunsch linear alignment of two arrays
     * WTFPL license
     * Source: 2015 Huan Truong - htruong@tnhh.net
     *
     * @param a
     * @param b
     * @return {*}
     */
    static align(a, b) {
        let current = [];
        let lookback = [];

        // standard initializations
        let nw_match = 1;
        let nw_mismatch = -1;
        let nw_indel = -1;

        for (let j = 0; j < b.length + 1; j++) {
            current[j] = j * nw_indel;
        }

        for (let i = 1; i < a.length + 1; i++) {
            for (let j = 0; j < b.length + 1; j++) {
                lookback[j] = current[j];
            }
            current[0] = i * nw_indel;
            for (let j = 1; j < b.length + 1; j++) {
                if (a[i - 1] === b[j - 1]) {
                    current[j] = lookback[j - 1] + nw_match;
                } else {
                    current[j] = Math.max(lookback[j - 1] + nw_mismatch,
                        Math.max(lookback[j] + nw_indel,
                            current[j - 1] + nw_indel));
                }
            }
        }

        return current[b.length];
    }

}