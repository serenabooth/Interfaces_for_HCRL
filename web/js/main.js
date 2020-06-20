
class Main {

  //set default parameters
    constructor() {

      //thesholds for x & theta (radians)
      //goes from (-val, +val)
      this.cartpole_thresholds = { x : 2.4,
                                    theta : 24 * Math.PI / 180, // = 0.41887902047863906

                                    //max velocity would span world in 1 timestep
                                    x_dot : 2*2.4,
                                    theta_dot : 2* 24 * Math.PI / 180
                                  }

      this.cartpole_display_args = {
                                  //height & width of an individual animation
                                  img_height: 100,
                                  img_width: 300,
                                  //will also display counterfactual future if true
                                  include_cfs: true,
                                  //number of timesteps to simulate into the future (and then animate)
                                  num_timesteps_to_simulate: 25,
                                  //parameters re: animation mechanics
                                  animation_args: {
                                    //https://svgjs.com/docs/3.0/animating/
                                    duration: 1000,
                                    delay : 0,
                                    when : 'now',
                                    swing: false,
                                    times: Number.MAX_SAFE_INTEGER,
                                    wait:1500,
                                  }
                                }
    }

    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {
      this.run_grid()
      this.run_sb()
    }

    /**
    code that was in serena's files
    **/
    run_sb() {
      var policy = new Linear_Policy(4)
      var cartpole = new CartPole(this.cartpole_thresholds)
      let state = cartpole.getState()
      console.log(state)
      policy.get_move(state)

      //note: timeline currently not working... need to fix
      UI_Blocks.timeline(cartpole,"#animation",window.run_data,1,false)
      UI_Blocks.timeline(cartpole,"#timeline",window.run_data)

    }


    run_grid() {

      /*
      var coach = new COACH(num_states = 4,num_actions = 4, trace_set = [0.99])
      console.log(coach)
      SM = coach.softmax_grad([0,1,2,3])
      */

      //choose a policy
      let whichPolicy = "Undulating"
      //policies from the dropbox paper
      let policies = {
        //NOTE: assumes tau of 0.02???
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
      }

      //display cartpoles
      this.createRandomGrid("#gridDiv", policies[whichPolicy])
      //this.createHandpickedGrid("#gridDiv", policies[whichPolicy])
      //this.createCanvas("#canvasDiv", cartpoles, policy)


      //text to describe grid
      let explanatoryText = `${whichPolicy}: [${policies[whichPolicy]}]`
      explanatoryText += "(Table rows: 1 = original, 2 = future, 3 = counterfactual)"
      $("#gridDiv .policy").text(explanatoryText)

      //timelines - not working
      //ui_blocks.timeline(viewer,"#animation",window.run_data,1,false)
      //ui_blocks.timeline(viewer,"#timeline",window.run_data)

    }

  /**
  Will create an SVG so we can place cartpole animations at arbitrary x,y positions
  **/
  createCanvas(domSelect, cartpoles, policy) {
    console.log("TODO")
  }

  /**
  Creates the grid given the set of cartpoles
  **/
  createGrid(domSelect, numRows,numCols, cartpoles, policy) {
    let cssVals = Array.from({length:numCols}).map(x => "auto")
    $(domSelect).css("grid-template-columns", cssVals.join(" "))

    UI_Blocks.state_grid(domSelect, numRows,numCols,cartpoles, this.cartpole_display_args, policy)

  }

  /**
  Creates cartpoles from handpicked states & create grid
  **/
  createHandpickedGrid(domSelect, policy=null) {

    let numCols = 5
    let numRows = 2

    //create human readable states
    let hand_picked_states = []
    hand_picked_states.push(["very left of center","still","upright","still"])
    hand_picked_states.push(["left of center","still","upright","still"])
    hand_picked_states.push(["center","still","upright","still"])
    hand_picked_states.push(["right of center","still","upright","still"])
    hand_picked_states.push(["very right of center","still","upright","still"])

    hand_picked_states.push(["center","going left fast","upright","still"])
    hand_picked_states.push(["center","going left","upright","still"])
    hand_picked_states.push(["center","still","upright","still"])
    hand_picked_states.push(["center","going right","upright","still"])
    hand_picked_states.push(["center","going right fast","upright","still"])
    // hand_picked_states.push(["center","still","upright","still"])
    // hand_picked_states.push(["center","still","upright","still"])

    //create the cartpole instances
    var cartpoles = []
    var i = 0
    for(let human_readable_state of hand_picked_states) {
      //instantiate cartpole
      let cp = new CartPole(this.cartpole_thresholds)
      cp.setTitle(human_readable_state.toString())

      //update the internal state to reflect defined states
      let state_vals_as_arr = cp.getStateArrFromHumanReadableStates(human_readable_state)
      cp.setState(state_vals_as_arr)

      cartpoles.push(cp)
    }

    this.createGrid(domSelect+" .grid-container", numRows,numCols,cartpoles, policy)
    $(domSelect+" .title").html("Handpicked Grid")

  }

  /**
  Creates a grid of randomly generated cartpoles
  **/
  createRandomGrid(domSelect, policy=null) {

    let numCols = 4
    let numRows = 2

    var cartpoles = []
    for(let i = 0; i < numCols*numRows; i++) {
      //create random state cartpoles
      let cp = new CartPole(this.cartpole_thresholds)
      cartpoles.push(cp)
    }

    this.createGrid(domSelect+" .grid-container", numRows,numCols,cartpoles,  policy)
    $(domSelect+" .title").html("Random Grid")
  }

}
