/**
This class demos different UI featuers
**/
class UIDemos {

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
                                  showCartpoleTitle : false,
                                  timestepDelayMS : 100,   //20 is simulation standard at 50fps

                                  //will also display counterfactual future if true
                                  //include_cfs: true,
                                  maxTimesteps: 1000,
                                }

        this.cartpoleSim = new CartPoleSim(this.cartpole_thresholds)

        //create a global variable to save cartpole anim handles
        if(window.cartpoleAnimHandles == null) {
          window.cartpoleAnimHandles = {}
        }
    }


    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {
      //policies from the dropbox paper
      let policies = {
        //NOTE: assumes tau of 0.02???
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926],
        "Random" : CartPole.generateRandomPolicy(),
      }

      //this.twoCartsDemo("#app", policies)
      let args = { "cartpole_thresholds":this.cartpole_thresholds,
                    "cartpole_display_args" : this.cartpole_display_args,
                    "domSelector":'#app' ,
                    "animation_div_dom_id" : "csv_cart"
                    }
      UI_Blocks.enableFileUploader("csv", this.procCSVs, args)
    }

    //allows user to upload a CSV trajectory
    procCSVs(fileContents, args) {

      //clears the cartpole animation as well as widgets
      UI_Blocks.clear_gridcell(args.domSelector, args.animation_div_dom_id)

      let cp_title = "hi"
      //create cartpole and run simulation
      let cp = new CartPole(args.cartpole_thresholds)
      var lines = fileContents.split('\r\n');

      //hack: need to check the python script since it's inserting a 0,0,0,0
      lines.shift()

      for(let state of lines) {
        state = state.split(",")
        let action = state.pop()
        if(state.length > 0)
          cp.addSimTimestep(state, action)
      }

      UI_Blocks.create_animation_in_dom_elem(args.domSelector, args.animation_div_dom_id, [cp], args.cartpole_display_args.img_width, args.cartpole_display_args.img_height, args.cartpole_display_args)
    }

    twoCartsDemo(domSelector, policies) {
        //display cartpole title
        this.cartpole_display_args.showCartpoleTitle = true

        //generate 2 cartpoles from same starting state and run & different policies
        let starting_state = CartPole.genRandomState(this.cartpole_thresholds)
        let policyToUse = ["Undulating","Rigid"]

        let cartpoles = []
        for(let i = 0; i < 2; i++) {
          let policyName = policyToUse[i]
          let cp_title = `${policyName[0]}` //set cp title to be first letter of policy name

          //create cartpole and run simulation
          let cp = new CartPole(this.cartpole_thresholds, starting_state, cp_title)
          this.cartpoleSim.simulation_from_policy(cp, policies[policyName], this.cartpole_display_args.maxTimesteps)
          cartpoles.push(cp)
        }

        //create a single animation in the main gridDiv
        UI_Blocks.create_animation_in_dom_elem(domSelector, "test", cartpoles, this.cartpole_display_args.img_width, this.cartpole_display_args.img_height, this.cartpole_display_args)
    }

//===========< BEGIN Helper Functions >=============//

  /**
  Creates a grid of randomly generated cartpoles
  **/
  createRandomGrid(domSelect, policies, starting_state=false) {

    $(domSelect+" .title").html("Random Grid")

    let numCols = 4
    let numRows = 3

    //generate & simulate random cartples
    let cartpoles = Util.gen_rand_cartpoles(numCols * numRows, this.cartpole_thresholds, starting_state);
    for(let i =0; i < cartpoles.length; i++) {

      // add any cartpoles to the global all_cartpoles list
      all_cartpoles[cartpoles[i].id] = {"divId": `cart_${cartpoles[i].id}`,
                                        "cartpole": cartpoles[i]}

      //select random policy
      if (policies != null) {
        let policyName = Util.getRandomElemFromArray(Object.keys(policies))
        //run simulation with policy
        let cp = cartpoles[i]
        cp.setTitle(i+"_"+policyName)
        this.cartpoleSim.simulation_from_policy(cp, policies[policyName], this.cartpole_display_args.maxTimesteps)
      }
      else {
        let cp = cartpoles[i]
        cp.setTitle(i)
        this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
      }
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", numRows, numCols, cartpoles, this.cartpole_display_args)
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
    let cartpoles = Util.gen_rand_cartpoles(n, this.cartpole_thresholds);

    //define cartpole animation positions
    let cartpole_positions = [];
    for(let i =0; i < cartpoles.length; i++) {

      //run simulation with cartple
      let cp = cartpoles[i]
      cp.setTitle(""+i)
      this.cartpoleSim.simulation_from_policy(cp, policy, maxTimesteps, timestepsToCoast)

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

}
