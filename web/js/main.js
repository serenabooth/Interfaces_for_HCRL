var grid_type = "FREEZE_DIM" // "RANDOM" | "FREEZE_DIM" | "HAND_SELECTED"

// src: https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

function waitForSocketConnection(socket, callback){
    setTimeout(
        function () {
            if (socket.readyState == 1) {
                    callback();
            } else {
                console.log("wait for connection...")
                waitForSocketConnection(socket, callback);
            }
        }, 5); // wait 5 milisecond for the connection...
}


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
                                  include_cfs: false,
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

                                    //including arguments that are not svgjs
                                    not_svgjs_show_title: true,
                                  }
                                }

      this.python_ws = null

    }

    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {

      // this.sandbox_eg()
      // this.sandbox_sb()
      this.sandbox_equivalence_classes()
      // this.sandbox_sc()

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
      // this is some tomfoolery right here.
      var mainObjct = this

      var img_width = this.cartpole_display_args.img_width
      var img_height = this.cartpole_display_args.img_height

      // define the base cartpole object
      var cp = new CartPole(mainObjct.cartpole_thresholds, null, null, true)

      this.python_ws = new WebSocket("ws://localhost:8000/echo")
      this.python_ws.onopen = () => this.python_ws.send(JSON.stringify("Connection established"));

      // add a button to the page
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


      var cartpoleSim  = new CartPole(mainObjct.cartpole_thresholds)
      var ui_blocks = new UI_Blocks()

      //todo: randomly initialize a BUNCH of states
      var response_received = false
      console.log(this.python_ws)
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
            UI_Blocks.populate_grid_cell_from_proposed_actions("#" + cartpoleDiv, cartpole, proposed_actions, mainObjct.cartpole_display_args)

          }

        }

      }

      function createGrid() {
        if (grid_type == "RANDOM") {
            mainObjct.createRandomGrid("#gridDiv", null, mainObjct.python_ws)
        }
        else if (grid_type == "HAND_SELECTED") {

        }
        else if (grid_type == "FREEZE_DIM") {
          var state = cp.getState()
          var x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 5, true)
          var x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 5, true)
          var theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 5, true)
          var theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 5, true)
          mainObjct.createDimCoverActionSpace("#gridDiv", state, x_samples, x_dot_samples, theta_samples, theta_dot_samples, 1, null, mainObjct.python_ws)
          mainObjct.update_cartpole_grid(5, mainObjct.python_ws)
        }
      }

      waitForSocketConnection(this.python_ws, createGrid)

    }

    /**
    Serena's run sandbox
    **/
    sandbox_sb() {
      // this is some tomfoolery right here.
      var mainObjct = this

      var img_width = this.cartpole_display_args.img_width
      var img_height = this.cartpole_display_args.img_height
      var cp = null

      this.python_ws = new WebSocket("ws://localhost:8000/echo")
      this.python_ws.onopen = () => this.python_ws.send(JSON.stringify("Connection established"));

      var badBtn = document.createElement("button");
      badBtn.innerHTML = "Bad";
      badBtn.onclick = function(){

        var msg = {
          msg_type: "feedback",
          reward: -1,
          state: cp.getState()
        }

        msg = JSON.stringify(msg)
        mainObjct.python_ws.send(msg);
      }


      var goodBtn = document.createElement("button");
      goodBtn.innerHTML = "Good";
      goodBtn.onclick = function(){
        var msg = {
          msg_type: "feedback",
          reward: 1,
          state: cp.getState()
        }

        msg = JSON.stringify(msg)
        mainObjct.python_ws.send(msg);
      }

      var body = document.getElementById("feedbackButtons");
      body.appendChild(badBtn);
      body.appendChild(goodBtn);

      //===========< init sim & viewer thresholds >====================//
      var cartpoleSim  = new CartPole(mainObjct.cartpole_thresholds)
      var ui_blocks = new UI_Blocks()

      // add the cartpole for training feedback
      cp = new CartPole(mainObjct.cartpole_thresholds, null, null, true)
      ui_blocks.individual_episode("#cartpole_instance", cp)

      //
      //
      var response_received = false
      console.log(this.python_ws)
      this.python_ws.onmessage = function (evt) {
        var received_msg = JSON.parse(evt.data);
        console.log("Received message: " + received_msg)

        if (received_msg["msg_type"] == "policy_updated") {
          mainObjct.update_cartpole_grid()
        }
        else if ("action" in received_msg) {
          var done = cp.update(received_msg["action"])

          if (done) {
            console.log("Episode finished")
            cp.reset()
          }

          ui_blocks.redrawCartpole("#drawing", cp, img_width, img_height, received_msg["action"])
        }
        else if (received_msg["msg_type"] == "proposed_actions_cartpole_group") {
          for (var id in received_msg) {
            if (id == "msg_type") {
            }
            else {
              var cartpole = all_cartpoles[id]["cartpole"]
              var cartpoleDiv = received_msg[id]["divId"]
              var proposed_actions = received_msg[id]["proposed_actions"]

              // TODO: redraw cartpole with proposed action
              $("#" + cartpoleDiv).empty();
              UI_Blocks.populate_grid_cell_from_proposed_actions("#" + cartpoleDiv, cartpole, proposed_actions, mainObjct.cartpole_display_args)


            }
          }
        }
      };

      function createGrid() {
        if (grid_type == "RANDOM") {
            mainObjct.createRandomGrid("#gridDiv", null, mainObjct.python_ws)
        }
        else if (grid_type == "HAND_SELECTED") {

        }
        else if (grid_type == "FREEZE_DIM") {
          var state = cp.getState()
          var x = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 4)
          var x_dot = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 4)
          var theta = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 4)
          var theta_dot = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 4)
          mainObjct.createDimFreezeGrid("#gridDiv", state, x, x_dot, theta, theta_dot, 4, 4, null, mainObjct.python_ws)
          console.log(x)

        }
      }

      waitForSocketConnection(this.python_ws, createGrid)


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
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
      }

      let explanatoryText = `${whichPolicy}: [${policies[whichPolicy]}]`
      this.createRandomCorkboard( "#corkboardDiv", 900,900, policies[whichPolicy],explanatoryText )

      //display cartpoles
      //this.createRandomGrid("#gridDiv", policies[whichPolicy])

      //timelines - not working
      //ui_blocks.timeline(viewer,"#animation",window.run_data,1,false)
      //ui_blocks.timeline(viewer,"#timeline",window.run_data)

    }

//===========< BEGIN Helper Functions >=============//

  update_cartpole_grid(num_steps, python_ws) {
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
      let cp = new CartPole(this.cartpole_thresholds)
      cp.setTitle(human_readable_state.toString())
      //update the internal state to reflect defined states
      let state_vals_as_arr = cp.getStateArrFromHumanReadableStates(human_readable_state)
      cp.setState(state_vals_as_arr)
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

    let n = 10
    //create cartpoles
    var cartpoles = Util.gen_rand_cartpoles(n, this.cartpole_thresholds)

    //define cartpole animation positions
    var cartpole_positions = []
    for(let i =0; i < cartpoles.length; i++) {
      let cp_pos = {
        'x' : i * 50,
        'y' : i * 50
      }
      cartpole_positions.push(cp_pos)
    }

    UI_Blocks.state_corkboard(domSelect+" .animation-container", corkboard_length, corkboard_width, cartpoles, cartpole_positions, policy, this.cartpole_display_args, this.cartpole_display_args.animation_args)

    //text to describe grid
    $("#corkboardDiv .policy").text(explanatoryText)

  }

  createDimFreezeGrid(domSelect, state, x_samples, x_dot_samples, theta_samples, theta_dot_samples, numRows, numCols, policy = null, python_ws = null) {
    var mainObjct = this;
    $(domSelect+" .title").html("Frozen Dimension Grid")


    var cartpoles = []
    var dims = ["x", "x_dot", "theta", "theta_dot"]

    for (var i = 0; i < dims.length; i++) {
      let dim = dims[i]
      console.log(dim)
      for (var j = 0; j < x_samples.length; j++) {
        var tmp_state = state
        if (dim == "x") {
          tmp_state[0] = x_samples[i]
          cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
        }
        else if (dim == "x_dot") {
          tmp_state[0] = x_dot_samples[i]
          cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
        }
        else if (dim == "theta") {
          tmp_state[0] = theta_samples[i]
          cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
        }
        else if (dim == "theta_dot") {
          tmp_state[0] = theta_dot_samples[i]
          cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, tmp_state))
        }
      }
    }

    console.log(cartpoles)

    UI_Blocks.state_grid(domSelect+" .animation-container", numRows, numCols, cartpoles, this.cartpole_display_args, policy, python_ws)
  }


  createDimCoverActionSpace(domSelect, state, x_samples, x_dot_samples, theta_samples, theta_dot_samples, numCols, policy = null, python_ws = null) {
    var mainObjct = this;
    $(domSelect+" .title").html("Cover State Space")

    var cartpoles_tmp = cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    var cartpoles = []
    for (var i = 0; i < cartpoles_tmp.length; i++) {
      cartpoles.push(new CartPole(mainObjct.cartpole_thresholds, cartpoles_tmp[i]))
    }

    UI_Blocks.state_grid(domSelect+" .animation-container", cartpoles.length, numCols, cartpoles, this.cartpole_display_args, policy, python_ws)
  }

  /**
  Creates a grid of randomly generated cartpoles
  **/
  createRandomGrid(domSelect, policy = null, python_ws = null) {

    $(domSelect+" .title").html("Random Grid")

    let numCols = 4
    let numRows = 2

    var cartpoles = Util.gen_rand_cartpoles(numCols*numRows, this.cartpole_thresholds)

    UI_Blocks.state_grid(domSelect+" .animation-container", numRows, numCols, cartpoles, this.cartpole_display_args, policy, python_ws)
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
