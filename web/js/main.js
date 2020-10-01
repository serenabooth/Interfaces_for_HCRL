var grid_type = "FREEZE_DIM" // "RANDOM" | "FREEZE_DIM"

// src: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);


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
                                  showCartpoleTitle : false,
                                  timestepDelayMS : 100,   //20 is simulation standard at 50fps

                                  //will also display counterfactual future if true
                                  //include_cfs: true,
                                  maxTimesteps: 1000,
                                }

        this.cartpoleSim = new CartPoleSim(this.cartpole_thresholds)

    }

    /**
    TODO(SERENA) - comment
    **/
    createGrid(argument_list) {
      var mainObjct = argument_list[0]
      if (grid_type == "RANDOM") {
        mainObjct.createRandomGrid("#gridDiv", null)
        mainObjct.update_cartpole_grid(20, mainObjct)
      }
      else if (grid_type == "FREEZE_DIM") {
        var x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 5, true)
        var x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 5, true)
        var theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 5, true)
        var theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 5, true)

        mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples)
        mainObjct.update_cartpole_grid(5, mainObjct)
      }
    }


    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {
      // this.sandbox_eg()
      // this.sandbox_sc()
      this.sandbox_equivalence_classes()
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

      this.handpickedStates( "#corkboardDiv", 900, 900, policies[whichPolicy], explanatoryText)
    }

    /**
    A development playground for exploring the equivalence class idea
    **/
    sandbox_equivalence_classes() {
      // open a websocket for talking to python
      this.python_ws = new WebSocket("ws://localhost:8000/echo")
      this.python_ws.onopen = () => this.python_ws.send(JSON.stringify("Connection established"));

      // this is some tomfoolery right here.
      var mainObjct = this

      // add cartpoles to screen
      waitForSocketConnection(this.python_ws, mainObjct.createGrid, [mainObjct])

      // add a policy update button to the page
      var updateBtn = document.createElement("button");
      updateBtn.innerHTML = "Update";
      updateBtn.onclick = function(){
        var msg = {
          msg_type: "update_equivalence_classes",
        }
        msg = JSON.stringify(msg)
        mainObjct.python_ws.send(msg);
      }
      var body = document.getElementById("feedbackButtons");
      body.appendChild(updateBtn);

      // process messages received from python
      this.python_ws.onmessage = function (evt) {
        var received_msg = JSON.parse(evt.data);
        console.log("Received message: " + received_msg)

        if (received_msg["msg_type"] == "policy_updated") {
          mainObjct.update_cartpole_grid(5, this.python_ws)
        }
        else if (received_msg["msg_type"] == "proposed_actions_cartpole_group") {
          for (var idx in received_msg["ordered_cartpoles"]) {
            var msg_payload = received_msg["ordered_cartpoles"][idx]
            var cartpole = all_cartpoles[msg_payload["cartpoleId"]]["cartpole"]
            var cartpoleDiv = msg_payload["divId"]
            var proposed_actions = msg_payload["proposed_actions"]

            $('#' + cartpoleDiv).appendTo('#gridDiv');
            $("#" + cartpoleDiv).empty();
            var sim_trace = mainObjct.cartpoleSim.simulation_from_action_sequence(cartpole, proposed_actions, null)

            UI_Blocks.animate_from_trace("#" + cartpoleDiv, cartpole, sim_trace, mainObjct.cartpole_display_args)
          }

        }

      }


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

  update_cartpole_grid(num_steps, mainObjct) {
      var python_ws = mainObjct.python_ws
      var cartpoles = {}

      for (var id in all_cartpoles) {
        cartpoles[id] = {"divId": all_cartpoles[id]["divId"],
                         "state": all_cartpoles[id]["cartpole"].getState(),
                         "num_steps": num_steps,
                        }
      }

      var msg = {
        msg_type: "get_actions_cartpole_group",
        cartpoles: cartpoles
      }

      msg = JSON.stringify(msg)
      python_ws.send(msg);
  }

  /**
  Creates cartpoles from handpicked states & create grid
  **/
  handpickedStates(domSelect, corkboard_length, corkboard_width, policy, explanatoryText, asGrid = false) {

    $(domSelect+" .title").html("Handpicked Corkboard")

    //create human readable states
    let hand_picked_states1 = []
    hand_picked_states1.push(["very left of center", "still","upright","still"])
    hand_picked_states1.push(["left of center",      "still","upright","still"])
    hand_picked_states1.push(["center",              "still","upright","still"])
    hand_picked_states1.push(["right of center",     "still","upright","still"])
    hand_picked_states1.push(["very right of center","still","upright","still"])
    let hand_picked_states2 = []
    hand_picked_states2.push(["very left of center", "going left","upright","still"])
    hand_picked_states2.push(["left of center",      "going left","upright","still"])
    hand_picked_states2.push(["center",              "going left","upright","still"])
    hand_picked_states2.push(["right of center",     "going left","upright","still"])
    hand_picked_states2.push(["very right of center","going left","upright","still"])


    //hand_picked_states.push(["center","going left fast",  "upright","still"])
    //hand_picked_states.push(["center","going left",       "upright","still"])
    //hand_picked_states.push(["center","still",            "upright","still"])
    //hand_picked_states.push(["center","going right",      "upright","still"])
    //hand_picked_states.push(["center","going right fast", "upright","still"])


    // hand_picked_states.push(["center","still","upright","still"])
    // hand_picked_states.push(["center","still","upright","still"])


    //create the cartpole instances from the hand-picked states
    var cartpoles = []
    var cartpole_positions = []

    var i = 0
    for(let human_readable_state of hand_picked_states1) {

      //instantiate cartpole & add to the list
      let state_vals_as_arr = CartPole.getStateArrFromHumanReadableStates(human_readable_state, this.cartpole_thresholds)

      //update the internal state to reflect defined states
      let cp = new CartPoleOld(this.cartpole_thresholds, state_vals_as_arr)
      cp.setTitle(human_readable_state.toString())
      cartpoles.push(cp)

      //set position of animation on the corkboard
      let cp_pos = {
        'x' : 50, //i * 50,
        'y' : i * 75
      }
      i++
      cartpole_positions.push(cp_pos)

    }

    var i = 0
    for(let human_readable_state of hand_picked_states2) {

      //instantiate cartpole & add to the list
      let cp = new CartPole(this.cartpole_thresholds)
      cp.setTitle(human_readable_state.toString())
      //update the internal state to reflect defined states
      let state_vals_as_arr = cp.getStateArrFromHumanReadableStates(human_readable_state)
      cp.setState(state_vals_as_arr)
      console.log('human readable state',human_readable_state,'state vals',state_vals_as_arr,'action', cp.getAction(policy))
      cartpoles.push(cp)

      //set position of animation on the corkboard
      let cp_pos = {
        'x' : 250, //i * 50,
        'y' : i * 75
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


  // createDimFreezeGrid(domSelect, state, x_samples, x_dot_samples, theta_samples, theta_dot_samples, numRows, numCols, policy = null, python_ws = null) {
  //   var mainObjct = this;
  //   $(domSelect+" .title").html("Frozen Dimension Grid")
  //
  //
  //   var cartpoles = []
  //   var dims = ["x", "x_dot", "theta", "theta_dot"]
  //
  //   for (var i = 0; i < dims.length; i++) {
  //     let dim = dims[i]
  //     console.log(dim)
  //     for (var j = 0; j < x_samples.length; j++) {
  //       var tmp_state = state
  //       if (dim == "x") {
  //         tmp_state[0] = x_samples[i]
  //         cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
  //       }
  //       else if (dim == "x_dot") {
  //         tmp_state[0] = x_dot_samples[i]
  //         cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
  //       }
  //       else if (dim == "theta") {
  //         tmp_state[0] = theta_samples[i]
  //         cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
  //       }
  //       else if (dim == "theta_dot") {
  //         tmp_state[0] = theta_dot_samples[i]
  //         cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
  //       }
  //     }
  //   }
  //
  //   console.log(cartpoles)
  //
  //   UI_Blocks.state_grid(domSelect+" .animation-container", numRows, numCols, cartpoles, this.cartpole_display_args, policy, python_ws)
  // }
  //
  //

  /**
  Takes 4 lists of x_samples, x_dot_samples, theta_samples, and theta_dot samples;
  computes the cartesian product of these lists, and creates cartpoles for each new state.
  **/
  createDimCoverActionSpace(domSelect, x_samples, x_dot_samples, theta_samples, theta_dot_samples) {
    var mainObjct = this;
    $(domSelect+" .title").html("Cover State Space")

    var cartpoles_tmp = cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    console.log(cartpoles_tmp)
    var cartpoles = []
    for (var i = 0; i < cartpoles_tmp.length; i++) {
      var cp = new CartPole(mainObjct.cartpole_thresholds)
      cp.reset(cartpoles_tmp[i])

      all_cartpoles[cp.id] = {"divId": `cart_${i}`,
                              "cartpole": cp}
      cartpoles.push(cp)

      this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    }
    console.log(cartpoles)

    UI_Blocks.state_grid(domSelect+" .animation-container", cartpoles.length, 1, cartpoles, this.cartpole_display_args)
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

  createHandpickedGrid(domSelect, policy = null, python_ws = null) {
    $(domSelect+" .title").html("Handpicked Grid")

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

    let numCols = 3
    let numRows = 2

    var cartpoles = []

    var i = 0
    for(let human_readable_state of hand_picked_states) {

      //instantiate cartpole & add to the list
      let cp = new CartPole(this.cartpole_thresholds)
      cp.setTitle(human_readable_state.toString())
      //update the internal state to reflect defined states
      let state_vals_as_arr = cp.getStateArrFromHumanReadableStates(human_readable_state)
      cp.setState(state_vals_as_arr)
      cartpoles.push(cp)
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", numRows, numCols, cartpoles, this.cartpole_display_args, policy, python_ws)

  }
}
