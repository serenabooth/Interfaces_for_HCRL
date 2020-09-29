
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

                                  timestepDelayMS : 100,   //20 is simulation standard at 50fps

                                  //will also display counterfactual future if true
                                  //include_cfs: true,
                                  maxTimesteps: 1000,
                                }

        this.cartpoleSim = new CartPoleSim(this.cartpole_thresholds)

    }

    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {

      //this.sandbox_eg()
      //this.sandbox_sb()
      this.sandbox_sc()

    }


    /**
    Elena's run sandbox
    **/
    sandbox_eg() {

      let whichPolicy = "Undulating"
      //policies from the dropbox paper
      let policies = {
        //NOTE: assumes tau of 0.02???
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
      }

      let explanatoryText = `${whichPolicy}: [${policies[whichPolicy]}]`

      this.handpickedStates( "#corkboardDiv", 900,900, policies[whichPolicy],explanatoryText )


    }
    /**
    Serena's run sandbox
    **/
    sandbox_sb() {

      /*
      var coach = new COACH(num_states = 4,num_actions = 4, trace_set = [0.99])
      console.log(coach)
      SM = coach.softmax_grad([0,1,2,3])
      */

      var policy = new Linear_Policy(4)
      var cartpole = new CartPole(this.cartpole_thresholds)
      let state = cartpole.getState()
      console.log(state)
      policy.get_move(state)

      //note: timeline currently not working... need to fix
      UI_Blocks.timeline(cartpole,"#animation",window.run_data,1,false)
      UI_Blocks.timeline(cartpole,"#timeline",window.run_data)

    }

    /**
    Sarah's run sandbox
    **/
    sandbox_sc() {

      //choose a policy
      let whichPolicy = "Undulating"
      //policies from the dropbox paper
      let policies = {
        //NOTE: assumes tau of 0.02???
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926],
        "Random" : CartPole.generateRandomPolicy(),
      }

      //this.createRandomSimulatedGrid(simrun_params_list)


      //console.log(cartpole.state_history)
      //console.log(cartpole.action_history)

      //let explanatoryText = `${whichPolicy}: [${policies[whichPolicy]}]`
      //this.createRandomCorkboard( "#corkboardDiv", 900,900, policies[whichPolicy],explanatoryText )

      //display cartpoles
      this.createRandomGrid("#gridDiv", policies)

      //timelines - not working
      //ui_blocks.timeline(viewer,"#animation",window.run_data,1,false)
      //ui_blocks.timeline(viewer,"#timeline",window.run_data)

    }

//===========< BEGIN Helper Functions >=============//

  /**
  Creates cartpoles from handpicked states & create grid
  **/
  handpickedStates(domSelect, corkboard_length, corkboard_width, policy, explanatoryText, asGrid = false) {

    $(domSelect+" .title").html("Handpicked Corkboard")

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


    //create the cartpole instances from the hand-picked states
    var cartpoles = []
    var cartpole_positions = []

    var i = 0
    for(let human_readable_state of hand_picked_states) {

      //instantiate cartpole & add to the list
      let state_vals_as_arr = CartPole.getStateArrFromHumanReadableStates(human_readable_state, this.cartpole_thresholds)

      //update the internal state to reflect defined states
      let cp = new CartPoleOld(this.cartpole_thresholds, state_vals_as_arr)
      cp.setTitle(human_readable_state.toString())
      cartpoles.push(cp)

      //set position of animation on the corkboard
      let cp_pos = {
        'x' : i * 50,
        'y' : i * 100
      }
      i++
      cartpole_positions.push(cp_pos)

    }

    //change the default display parameters
    this.cartpole_display_args.img_height = 75
    this.cartpole_display_args.img_width = 150

    //choose display method
    if(asGrid) {
      let numCols = 5
      let numRows = 2
      UI_Blocks.state_grid(domSelect+" .animation-container", numRows,numCols,cartpoles, this.cartpole_display_args, policy)
    } else {

      $("#corkboardDiv .policy").text(explanatoryText)
      UI_Blocks.state_corkboard(domSelect+" .animation-container", corkboard_length, corkboard_width, cartpoles, cartpole_positions, policy, this.cartpole_display_args, this.cartpole_display_args.animation_args)
    }

  }

  /**
  **/
  createRandomCorkboard(domSelect, corkboard_length, corkboard_width, policy, explanatoryText) {

    $(domSelect+" .title").html("Cartpole Corkboard")

    //num cartpoles
    let n = 10
    let maxTimesteps = 10
    let timestepsToCoast = 10

    //create cartpoles
    var cartpoles = Util.gen_rand_cartpoles(n, this.cartpole_thresholds)

    //define cartpole animation positions
    var cartpole_positions = []
    for(let i =0; i < cartpoles.length; i++) {

      //run simulation with cartple
      let cp = cartpoles[i]
      cp.setTitle(""+i)
      this.cartpoleSim.simulation(cp, policy, maxTimesteps,timestepsToCoast)

      //determine cartpole position
      let cp_pos = {
        'x' : i * 50,
        'y' : i * 100
      }
      cartpole_positions.push(cp_pos)
    }

    UI_Blocks.state_corkboard(domSelect+" .animation-container", corkboard_length, corkboard_width, cartpoles, cartpole_positions, this.cartpole_display_args)

    //text to describe grid
    $("#corkboardDiv .policy").text(explanatoryText)

  }

  /**
  Creates a grid of randomly generated cartpoles
  **/
  createRandomGrid(domSelect, policies) {

    $(domSelect+" .title").html("Random Grid")

    let numCols = 4
    let numRows = 3

    //generate & simulate random cartples
    var cartpoles = Util.gen_rand_cartpoles(numCols*numRows, this.cartpole_thresholds)
    for(let i =0; i < cartpoles.length; i++) {

      //select random policy
      let policyName = Util.getRandomElemFromArray(Object.keys(policies))

      //run simulation with policy
      let cp = cartpoles[i]
      cp.setTitle(i+"_"+policyName)
      this.cartpoleSim.simulation(cp, policies[policyName], this.cartpole_display_args.maxTimesteps)
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", numRows,numCols,cartpoles, this.cartpole_display_args)
  }


}
