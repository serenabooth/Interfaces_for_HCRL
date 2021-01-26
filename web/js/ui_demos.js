/**
This class demos different UI featuers
**/
class UIDemos {

  //set default parameters
    constructor() {

        this.svg_helper_params =  {
          //height & width of an individual animation
          //NOTE: make sure the ratio of width/height is same for both img & world
          img_width: 300,
          img_height: 150,
          world_width: 600,
          world_height: 300,
          outline_canvas : {"stroke" : {"color": "#000","width":"1px"}, "fill" : "None"}
        }
    }

    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {

      var boxes = [{},{},{}]  //boxes should contain toys
      var toys = [{},{},{},{}]

      var cleanup_world = new CleanupToys("#app", boxes, toys,this.svg_helper_params)
      cleanup_world.generate_svg()

      
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


}
