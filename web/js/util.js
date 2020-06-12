/**
Static utility functions
**/
class Util {

  /**
   * Returns a random number between min (inclusive) and max (exclusive)
   * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
   */
  static genRandomFloat(min, max) {
      return Math.random() * (max - min) + min;
  }


  //truncates each float in the array and returns new array
  static roundElems(floatArr, numDecPlaces) {
    let roundedArr = []
    for(let f of floatArr)
      roundedArr.push(f.toFixed(numDecPlaces))
    return roundedArr
  }


  /**
  convert array representation of state into obj

  @param {array} state_as_arr list of state var values
  @param {array} state_var_list list of state var names
  **/
  static stateArrToObj(state_as_arr, state_var_list) {

    let stateAsObj = {}

    for(let i = 0; i < state_var_list.length; i++) {
      let state_var_name = state_var_list[i]
      stateAsObj[state_var_name] = state_as_arr[i]
    }

    return stateAsObj
  }

  /**
  convert obj representation of state into arr

  TODO: stop using object representations...

  @param {array} state_as_obj state var vals in obj form
  @param {array} state_var_list list of state var names
  **/
  static stateObjToArr(state_as_obj, state_var_list) {
    let state_as_arr = []

    for(let i = 0; i < state_var_list.length; i++) {
      let state_var_name = state_var_list[i]
      state_as_arr.push(state_as_obj[state_var_name])
    }
    return state_as_arr
  }

}