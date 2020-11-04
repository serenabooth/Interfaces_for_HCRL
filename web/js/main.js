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
      let mainObjct = argument_list[0]
      let grid_type = argument_list[1]
      let policy = argument_list[2]
      if (grid_type === "RANDOM") {
        mainObjct.createRandomGrid("#gridDiv", null)
        mainObjct.update_cartpole_grid(20)
      }
      else if (grid_type === "RANDOM_START") {
        mainObjct.createRandomGrid("#gridDiv", null, true)
        mainObjct.update_cartpole_grid(20)
      }
      else if (grid_type === "MULTI_START") {
        let x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 9, true)
        let x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 3, true)
        let theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 3, true)
        let theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 3, true)
        console.log("Policy", policy)

        mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples, policy)

        mainObjct.update_cartpole_grid(100)
      }
      else if (grid_type === "COVER_SPACE") {
        let x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 5, true)
        let x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 5, true)
        let theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 5, true)
        let theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 5, true)

        mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples)
        mainObjct.update_cartpole_grid(100)
      }
    }


    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {
      // this.sandbox_eg()
      // this.sandbox_sc()
      // this.sandbox_equivalence_classes()
      this.compare_trajectories()
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
    Process the contents of a message received from the python websocket

    @mainObjct: corresponds to an instance of this class (Main)
    @evt: a json message communicated through the websocket
    **/
    process_ws_payload(mainObjct, evt) {
      let received_msg = JSON.parse(evt.data);
      console.log("Received message: " + received_msg)
      if (received_msg["msg_type"] === "policy_updated") {
        mainObjct.update_cartpole_grid(20)
      }
      else if (received_msg["msg_type"] === "proposed_actions_cartpole_group") {
        // logic for feedback cartpole
        let cartpole = all_cartpoles["cart_feedback"]["cartpole"];
        let feedbackDiv = received_msg["cart_feedback"]["divId"];
        let proposed_actions = received_msg["cart_feedback"]["proposed_actions"];
        $("#" + feedbackDiv).empty();
        cartpole.reset(cartpole.getStartingState())
        console.log("Starting state", "cart_feedback", cartpole.getStartingState())
        let sim_trace = mainObjct.cartpoleSim.simulation_from_action_sequence(cartpole, proposed_actions, null);
        UI_Blocks.animate_from_trace("#" + feedbackDiv, cartpole, sim_trace, mainObjct.cartpole_display_args)

        for (let idx in received_msg["ordered_cartpoles"]) {
          let msg_payload = received_msg["ordered_cartpoles"][idx];
          cartpole = all_cartpoles[msg_payload["cartpoleId"]]["cartpole"];
          let cartpoleDiv = msg_payload["divId"];
          proposed_actions = msg_payload["proposed_actions"];

          // reorder
          $('#' + cartpoleDiv).appendTo('#grid-container animation-container');
          $("#" + cartpoleDiv).empty();
          cartpole.reset(cartpole.getStartingState())
          if (idx < 16) {
            //redraw
            sim_trace = mainObjct.cartpoleSim.simulation_from_action_sequence(cartpole, proposed_actions, null);
            UI_Blocks.animate_from_trace("#" + cartpoleDiv, cartpole, sim_trace, mainObjct.cartpole_display_args)
          }
        }
      }
      else if (received_msg["msg_type"] === "user_assessment") {
        all_user_responses += 1
        correct_user_responses += received_msg["score"]
        $("#userTestDiv"+" .user_score").html(correct_user_responses + " (correct responses)" + " / " + all_user_responses + " (total responses)")
      }
    }

    /**
     A development playground for exploring the equivalence class idea
     **/
    compare_trajectories() {
      let current_policy = this.random_policy()
      console.log(current_policy)
    }

    /**
    A development playground for exploring the equivalence class idea
    **/
    sandbox_equivalence_classes() {
      // this is some tomfoolery right here.
      let mainObjct = this;

      let grid_type = "MULTI_START"; // "RANDOM" | "RANDOM_START" | "COVER_SPACE" | "MULTI_START"

      let whichPolicy = "Rigid"
      //policies from the dropbox paper
      let policies = {
        //NOTE: assumes tau of 0.02???
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
      }

      mainObjct.testUserKnowledge()

      // open a websocket for talking to python
      this.python_ws = new WebSocket("ws://localhost:8000/echo")
      this.python_ws.onopen = () => this.python_ws.send(JSON.stringify("Connection established"));

      mainObjct.addSingleFeedbackCartAndButtons(mainObjct);

      // add cartpoles to screen
      waitForSocketConnection(this.python_ws, mainObjct.createGrid, [mainObjct, grid_type, policies[whichPolicy]])
      // process messages received from python
      mainObjct.python_ws.onmessage = function (evt) {
        mainObjct.process_ws_payload(mainObjct, evt)
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

  random_policy() {
    let policy = []
    for(let i = 0; i<4; i++) {policy.push(Math.random())}
    return policy
  }

  /**
  Test user knowledge

  @mainObjct : a Main class instance
  **/
  testUserKnowledge(mainObjct) {
    $("#userTestDiv"+" .title").html("User Knowledge Test")
    $("#userTestDiv"+" .user_score").html(correct_user_responses + " (correct responses)" + " / " + all_user_responses + " (total responses)")

    // add a toplevel cartpole for evaluation
    let cp = Util.gen_rand_cartpoles(1, this.cartpole_thresholds)[0];
    this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    UI_Blocks.single_cartpole("#userTestDiv", cp, "user_test", this.cartpole_display_args);
    // don't strictly need to add this
    all_cartpoles[`user_test`] = {"divId": `user_test`,
                                  "cartpole": cp}

    // add a policy update button to the page
    let left = document.createElement("button");
    let right = document.createElement("button");

    left.innerHTML = "Left";
    left.onclick = function(){
      let msg = {
        msg_type: "user_test",
        user_input: "left",
        cp_state: all_cartpoles['user_test']["cartpole"].getState()
      };
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    right.innerHTML = "Right";
    right.onclick = function(){
      let msg = {
        msg_type: "user_test",
        user_input: "right",
        cp_state: all_cartpoles['user_test']["cartpole"].getState()
      };
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    let body = document.getElementById("userTestButtons");
    body.appendChild(left);
    body.appendChild(right);
  }



  /**
  Add a single cartpole to the top of the screen
  Add this cartpole to the globally tracked all_cartpoles dict
  Add a "Bad Robot" and a "Good Robot" button

  @mainObjct : a Main class instance
  **/
  addSingleFeedbackCartAndButtons(mainObjct) {
    $("#feedbackDiv"+" .title").html("Give Feedback to the Robot")

    // add a toplevel cartpole for gathering feedback
    let cp = Util.gen_rand_cartpoles(1, this.cartpole_thresholds)[0];
    this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    UI_Blocks.single_cartpole("#feedbackDiv", cp, "cart_feedback", this.cartpole_display_args);
    all_cartpoles[`cart_feedback`] = {"divId": `cart_feedback`,
                                      "cartpole": cp}

    // add a policy update button to the page
    let goodBtn = document.createElement("button");
    let badBtn = document.createElement("button");

    goodBtn.innerHTML = "Good Robot";
    goodBtn.onclick = function(){
      let msg = {
        msg_type: "feedback",
        reward: 1,
      };
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    badBtn.innerHTML = "Bad Robot";
    badBtn.onclick = function(){
      let msg = {
        msg_type: "feedback",
        reward: -1,
      };
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    let body = document.getElementById("feedbackButtons");
    body.appendChild(badBtn);
    body.appendChild(goodBtn);
  }


  /**
  Send a message through the websocket to ask for proposed actions for each cartpole

  @num_steps int, the number of policy steps to visualize
  @mainObjct : a Main class instance
  **/
  update_cartpole_grid(num_steps) {
    let mainObjct = this;
    let python_ws = mainObjct.python_ws;
    let cartpoles = {};

    for (let id in all_cartpoles) {
        cartpoles[id] = {"divId": all_cartpoles[id]["divId"],
                         "state": all_cartpoles[id]["cartpole"].getStartingState(),
                         "num_steps": num_steps,
                        }
      }

    let msg = {
      msg_type: "get_actions_cartpole_group",
      cartpoles: cartpoles
    };

    msg = JSON.stringify(msg)
      python_ws.send(msg);
  }

  /**
  Takes 4 lists of x_samples, x_dot_samples, theta_samples, and theta_dot samples;
  computes the cartesian product of these lists, and creates cartpoles for each new state.

  @domSelect the DOM elemnent in which to add the resulting grid
  @x_samples list of x values
  @x_dot_samples list of xdot values
  @theta_samples list of theta values
  @theta_dot_samples list of thetadot values
  **/
  createDimCoverActionSpace(domSelect, x_samples, x_dot_samples, theta_samples, theta_dot_samples, comparison_policy=None) {
    let mainObjct = this;
    $(domSelect+" .title").html("Communicate Policy Through Examples")

    let cartpoles_tmp = cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    let cartpoles = [];
    // add cartpoles to be updated by COACH
    for (let i = 0; i < cartpoles_tmp.length*2; i++) {
      let cp = new CartPole(mainObjct.cartpole_thresholds);
      cp.reset(cartpoles_tmp[Math.floor(i/2)])

      if (i % 2 == 0) {
        all_cartpoles[cp.id] = {"divId": `cart_${i}`,
          "cartpole": cp}
        this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
      }
      else {
        cp.setTitle(i+"_Comparison")
        this.cartpoleSim.simulation_from_policy(cp, comparison_policy, 100, 0)
      }
      cartpoles.push(cp)
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", cartpoles.length/2, 2, cartpoles, this.cartpole_display_args)
  }



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

    let cartpoles = [];

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

    //create the cartpole instances from the hand-picked states
    let cartpoles = [];
    let cartpole_positions = [];

    let i = 0;
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

    i = 0;
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
}
