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
      var grid_type = argument_list[1]
      if (grid_type === "RANDOM") {
        mainObjct.createRandomGrid("#gridDiv", null)
        mainObjct.update_cartpole_grid(20)
      }
      else if (grid_type === "RANDOM_START") {
        mainObjct.createRandomGrid("#gridDiv", null, true)
        mainObjct.update_cartpole_grid(20)
      }
      else if (grid_type === "MULTI_START") {
        var x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 9, true)
        var x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 3, true)
        var theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 3, true)
        var theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 3, true)

        mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples)
        mainObjct.update_cartpole_grid(100)
      }
      else if (grid_type === "COVER_SPACE") {
        var x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 5, true)
        var x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 5, true)
        var theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 5, true)
        var theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 5, true)

        mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples)
        mainObjct.update_cartpole_grid(20)
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
    Process the contents of a message received from the python websocket

    @mainObjct: corresponds to an instance of this class (Main)
    @evt: a json message communicated through the websocket
    **/
    process_ws_payload(mainObjct, evt) {
      var received_msg = JSON.parse(evt.data);
      console.log("Received message: " + received_msg)
      if (received_msg["msg_type"] === "policy_updated") {
        mainObjct.update_cartpole_grid(20)
      }
      else if (received_msg["msg_type"] === "proposed_actions_cartpole_group") {
        // logic for feedback cartpole
        var cartpole = all_cartpoles["cart_feedback"]["cartpole"]
        var feedbackDiv = received_msg["cart_feedback"]["divId"]
        var proposed_actions = received_msg["cart_feedback"]["proposed_actions"]
        $("#" + feedbackDiv).empty();
        cartpole.reset(cartpole.getStartingState())
        console.log("Starting state", "cart_feedback", cartpole.getStartingState())
        var sim_trace = mainObjct.cartpoleSim.simulation_from_action_sequence(cartpole, proposed_actions, null)
        UI_Blocks.animate_from_trace("#" + feedbackDiv, cartpole, sim_trace, mainObjct.cartpole_display_args)

        for (var idx in received_msg["ordered_cartpoles"]) {
          var msg_payload = received_msg["ordered_cartpoles"][idx]
          var cartpole = all_cartpoles[msg_payload["cartpoleId"]]["cartpole"]
          var cartpoleDiv = msg_payload["divId"]
          var proposed_actions = msg_payload["proposed_actions"]

          // reorder
          $('#' + cartpoleDiv).appendTo('#gridDiv');
          $("#" + cartpoleDiv).empty();
          cartpole.reset(cartpole.getStartingState())
          if (idx < 16) {
            //redraw
            var sim_trace = mainObjct.cartpoleSim.simulation_from_action_sequence(cartpole, proposed_actions, null)
            UI_Blocks.animate_from_trace("#" + cartpoleDiv, cartpole, sim_trace, mainObjct.cartpole_display_args)
          }
        }
      }
      else if (received_msg["msg_type"] == "user_assessment") {
        all_user_responses += 1
        correct_user_responses += received_msg["score"]
        $("#userTestDiv"+" .user_score").html(correct_user_responses + " (correct responses)" + " / " + all_user_responses + " (total responses)")
      }
    }

    /**
    A development playground for exploring the equivalence class idea
    **/
    sandbox_equivalence_classes() {
      // this is some tomfoolery right here.
      var mainObjct = this

      var grid_type = "MULTI_START" // "RANDOM" | "RANDOM_START" | "COVER_SPACE" | "MULTI_START"

      mainObjct.testUserKnowledge()

      // open a websocket for talking to python
      this.python_ws = new WebSocket("ws://localhost:8000/echo")
      this.python_ws.onopen = () => this.python_ws.send(JSON.stringify("Connection established"));

      mainObjct.addSingleFeedbackCartAndButtons(mainObjct);

      // add cartpoles to screen
      waitForSocketConnection(this.python_ws, mainObjct.createGrid, [mainObjct, grid_type])
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

  /**
  Test user knowledge

  @mainObjct : a Main class instance
  **/
  testUserKnowledge(mainObjct) {
    var mainObjct = this

    $("#userTestDiv"+" .title").html("User Knowledge Test")
    $("#userTestDiv"+" .user_score").html(correct_user_responses + " (correct responses)" + " / " + all_user_responses + " (total responses)")

    // add a toplevel cartpole for evaluation
    var cp = Util.gen_rand_cartpoles(1, this.cartpole_thresholds)[0]
    this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    UI_Blocks.single_cartpole("#userTestDiv", cp, "user_test", this.cartpole_display_args);
    // don't strictly need to add this
    all_cartpoles[`user_test`] = {"divId": `user_test`,
                                  "cartpole": cp}

    // add a policy update button to the page
    var left = document.createElement("button");
    var right = document.createElement("button");

    left.innerHTML = "Left";
    left.onclick = function(){
      var msg = {
        msg_type: "user_test",
        user_input: "left",
        cp_state: all_cartpoles['user_test']["cartpole"].getState()
      }
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    right.innerHTML = "Right";
    right.onclick = function(){
      var msg = {
        msg_type: "user_test",
        user_input: "right",
        cp_state: all_cartpoles['user_test']["cartpole"].getState()
      }
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    var body = document.getElementById("userTestButtons");
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
    var cp = Util.gen_rand_cartpoles(1, this.cartpole_thresholds)[0]
    this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    UI_Blocks.single_cartpole("#feedbackDiv", cp, "cart_feedback", this.cartpole_display_args);
    all_cartpoles[`cart_feedback`] = {"divId": `cart_feedback`,
                                      "cartpole": cp}

    // add a policy update button to the page
    var goodBtn = document.createElement("button");
    var badBtn = document.createElement("button");

    goodBtn.innerHTML = "Good Robot";
    goodBtn.onclick = function(){
      var msg = {
        msg_type: "feedback",
        reward: 1,
      }
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    badBtn.innerHTML = "Bad Robot";
    badBtn.onclick = function(){
      var msg = {
        msg_type: "feedback",
        reward: -1,
      }
      msg = JSON.stringify(msg)
      mainObjct.python_ws.send(msg);
    }
    var body = document.getElementById("feedbackButtons");
    body.appendChild(badBtn);
    body.appendChild(goodBtn);
  }


  /**
  Send a message through the websocket to ask for proposed actions for each cartpole

  @num_steps int, the number of policy steps to visualize
  @mainObjct : a Main class instance
  **/
  update_cartpole_grid(num_steps) {
      var mainObjct = this
      var python_ws = mainObjct.python_ws
      var cartpoles = {}

      for (var id in all_cartpoles) {
        console.log("ID", id, all_cartpoles[id]["cartpole"].getStartingState())
        cartpoles[id] = {"divId": all_cartpoles[id]["divId"],
                         "state": all_cartpoles[id]["cartpole"].getStartingState(),
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
  Takes 4 lists of x_samples, x_dot_samples, theta_samples, and theta_dot samples;
  computes the cartesian product of these lists, and creates cartpoles for each new state.

  @domSelect the DOM elemnent in which to add the resulting grid
  @x_samples list of x values
  @x_dot_samples list of xdot values
  @theta_samples list of theta values
  @theta_dot_samples list of thetadot values
  **/
  createDimCoverActionSpace(domSelect, x_samples, x_dot_samples, theta_samples, theta_dot_samples) {
    var mainObjct = this;
    $(domSelect+" .title").html("Communicate Policy Through Examples")

    var cartpoles_tmp = cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    var cartpoles = []
    for (var i = 0; i < cartpoles_tmp.length; i++) {
      var cp = new CartPole(mainObjct.cartpole_thresholds)
      cp.reset(cartpoles_tmp[i])

      all_cartpoles[cp.id] = {"divId": `cart_${i}`,
                              "cartpole": cp}
      cartpoles.push(cp)

      this.cartpoleSim.simulation_from_action_sequence(cp, [], 0)
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", cartpoles.length, 1, cartpoles, this.cartpole_display_args)
  }



  /**
  Creates a grid of randomly generated cartpoles
  **/
  createRandomGrid(domSelect, policies, starting_state=false) {

    $(domSelect+" .title").html("Random Grid")

    let numCols = 4
    let numRows = 3

    //generate & simulate random cartples
    var cartpoles = Util.gen_rand_cartpoles(numCols*numRows, this.cartpole_thresholds, starting_state)
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
}
