class Main {

    /***
     * Set the default parameters.
     * Including cartpole thresholds, display args, simulation, etc.
     */
    constructor() {
      //thesholds for x & theta (radians) goes from (-val, +val)
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
        // this.sandbox_sc()
        // this.sandbox_equivalence_classes()
        // this.compare_trajectories()
        // this.compare_policies()
        // this.sandbox_equivalence_classes()
    }

    /**
     A development playground for exploring the workbench, trajectory comparisons idea
     **/
    compare_trajectories() {
        $("#workbenchDiv"+" .title").html("Workbench")
        // add trajectories for comparing policies
        this.comparison_trajectories()
    }

    /***
     * Add one or more cartpole examples to the workbench
     *
     * @param cartpoles
     * @param trace_id
     * @param color
     * @param id
     */
    add_to_workbench(cartpoles, trace_id, color, id) {
        if (document.getElementById("workbenchDiv") == null) {
            console.log("You can only call add_to_workbench if you have a workbenchDiv in your DOM")
            return
        }

        let div_id = Date.now()
        let g = document.createElement('div');
        g.setAttribute("id", String(div_id));
        $("#workbenchDiv").append(g)

        UI_Blocks.create_animation_in_dom_elem("#"+div_id,
                                              "workbench_anim_"+div_id,
                                                                cartpoles,
                                                                this.cartpole_display_args.img_width,
                                                                this.cartpole_display_args.img_height,
                                                                this.cartpole_display_args,
                                                                trace_id)

        let div = document.getElementById(String(div_id));
        let t = document.createTextNode("Your Past Preference: " + id);     // Create a text node
        div.style.color = color
        div.appendChild(t)

    }

    /***
     *
     * @param existing_cp
     * @param existing_policy
     * @param num_comps
     */
    comparison_trajectories(existing_cp=null, existing_policy=null, num_comps =4) {
        let i, state_idx, cp, policy, trace_id, new_cp, new_policy;
        let mainObject = this;
        let cartpoles = []
        let policies = []
        let states = []
        let body = document.getElementById("currentPreferenceDiv");

        let traces = []
        for (i = 0; i < num_comps; i++) {
            traces.push(String(Date.now()) + String(i))
        }

        // construct any new cartpoles and policies
        for (i = 0; i < 2; i++) {
            if (i == 0 && existing_cp != null && existing_policy != null) {
                cartpoles.push(existing_cp)
                policies.push(existing_policy)
            }
            else {
                policy = new Linear_Policy(this.cartpole_thresholds, 4, true)
                cp = new CartPole(this.cartpole_thresholds, null, null, false)
                cp.color= Util.getRandColor()
                cartpoles.push(cp)
                policies.push(policy)
                new_cp = cp
                new_policy = policy
            }
        }

        // add N starting states which show divergent behaviors
        let top_N_states = Util.get_top_N_divergent_starting_states(num_comps-states.length,
                                                                       policies,
                                                                       cartpoles[0],
                                                                       this.cartpole_thresholds,
                                                                       this.cartpoleSim)
        for (state_idx in top_N_states) {
            states.push(top_N_states[state_idx])
        }

        // for each state/cartpole pair, simulate the behavior and save the trace
        for (state_idx in states) {
            let parent = document.getElementById("currentPreferenceDiv");
            let state_div = document.createElement("div");
            state_div.id = String(Date.now()) + String(state_idx)
            parent.append(state_div)
            trace_id = traces[state_idx]

            for (i = 0; i < cartpoles.length; i++) {
                let cp = cartpoles[i]
                policy = policies[i]
                cp.reset(states[state_idx])
                this.cartpoleSim.simulation_from_policy(cp, policy, 200, 0)
                cp.save_trace(trace_id)

                // add a button to select this preference
                let btn = document.createElement("button")
                btn.innerHTML = cp.id;
                console.log ("innerHTML", btn.innerHTML)
                btn.style.background=cp.color;
                btn.onclick = function(){
                    console.log("Clicked", btn.innerHTML)
                    // $("#currentPreferenceDiv").empty()
                    // $("#userTestButtons").empty()

                    mainObject.add_to_workbench(cartpoles, trace_id, cp.color, cp.id)
                    // mainObject.comparison_trajectories(cp, policy)
                };
                body.appendChild(btn);
            }


            // for each state/cartpole pair, add them to the currentPreferenceDiv Screen
            UI_Blocks.create_animation_in_dom_elem("#"+state_div.id,
                                                  "test_" + trace_id,
                                                                    cartpoles,
                                                                    this.cartpole_display_args.img_width,
                                                                    this.cartpole_display_args.img_height,
                                                                    this.cartpole_display_args,
                                                                    trace_id)
        }

        let submit_btn = document.createElement("button")
        submit_btn.innerHTML = "Submit";
        submit_btn.onclick = function(){
            // console.log(btn.innerHTML)
            $("#currentPreferenceDiv").empty()
            // $("#userTestButtons").empty()
            mainObject.comparison_trajectories(new_cp, new_policy)
        };
        body.appendChild(document.createElement("div"));
        body.appendChild(submit_btn);

    }

    /**
     A development playground for exploring the equivalence class idea
     **/
    compare_policies() {
        let NUM_DIMS = 4
        let NUM_POLICIES = 50 // assess a lot of policies!
        let NUM_COLUMNS = 2

        let starting_states = []
        let policies = []
        let cartpoles = []
        let state_ids = []

        // create states
        starting_states = State.get_cartesian_state_space_cover(NUM_DIMS, this.cartpole_thresholds)
        // create policies
        for (let i = 0; i < NUM_POLICIES; i++) {
            policies.push(new Linear_Policy(this.cartpole_thresholds,
                                           4,
                                           true,
                                           "everywhere"))
        }
        // create cartpoles - one for each policy (for animation)
        for (let i = 0; i < NUM_POLICIES; i++) {
            cartpoles.push(new CartPole(this.cartpole_thresholds))
        }

        // keep track of the "best" policies on each state
        let policy_comparisons_on_states = {}

        // rollout each policy on each state
        for (let i = 0; i < starting_states.length; i++) {
            let this_state = starting_states[i]
            let state_id = Util.hash(String(this_state))
            state_ids.push(state_id)

            policy_comparisons_on_states[state_id] = []

            for (let j = 0; j < policies.length; j++) {
                let this_policy = policies[j]
                let tmp_cp = cartpoles[j]

                // reset to selected starting state
                tmp_cp.reset(this_state)

                // rollout & save to trace history
                let rollout = this.cartpoleSim.simulation_from_policy(tmp_cp,
                                                                      this_policy,
                                                                      200,
                                                                      0)
                tmp_cp.save_trace(state_id)

                policy_comparisons_on_states[state_id].push(rollout["action_history"].length)

            }
        }

        // Dynamic time warping
        let dtw_performance_matrix = Util.gen_2d_array(starting_states.length, policies.length)

        let nwunsch_matrix = Util.gen_2d_array(starting_states.length, policies.length)

        let cartpoles_to_visualize = []


        // get a reference policy to compare all others to with DTW
        // choose a random cartpole to be the reference cartpole
        // choose a random starting state; then choose cp based on healthy (long) trajectory
        let random_state_id = Util.hash(String(Util.getRandomElemFromArray(starting_states)))
        let reference_cp_ix =  Util.find_indices_of_top_N(policy_comparisons_on_states[random_state_id],
                                                         1,
                                                         "max")[0]
        console.log(reference_cp_ix)


        for (let state_idx = 0; state_idx < starting_states.length; state_idx++) {
            let this_state = starting_states[state_idx]
            let state_id = "" + Util.hash(String(this_state))
            let cp_idx = policy_comparisons_on_states[state_id]["cartpole_idx"]

            let reference_traj = cartpoles[reference_cp_ix].getSimTrace(state_id)["action_history"]

            // get top N other longest trajectories
            for (let policy_idx = 0; policy_idx < policies.length; policy_idx++) {
                // let lookup = policies[policy_idx]
                let comparison_traj = cartpoles[policy_idx].getSimTrace(state_id)["action_history"]

                // compute the cost between the reference trajectory and the comparison,
                // and add this cost to the 2D DTW Cost array
                // dtw_performance_matrix[state_idx][policy_idx] = DTW.dtw(reference_traj, comparison_traj)["cost"]
                nwunsch_matrix[state_idx][policy_idx] = NWunsch.align(reference_traj, comparison_traj)

            }


            console.log(nwunsch_matrix)

            // for each state, we want to pick <N> policies/cartpoles to group as similar
            // and <M> policies/cartpoles to group as dissimilar.
            let similar_cartpole_indeces = Util.find_indices_of_top_N(nwunsch_matrix[state_idx], 5, "min")
            console.log("Min", similar_cartpole_indeces)
            let dissimilar_cartpole_indeces = Util.find_indices_of_top_N(nwunsch_matrix[state_idx], 5, "max")
            console.log("Max", dissimilar_cartpole_indeces)

            let similar_cps = similar_cartpole_indeces.map(i => cartpoles[i])
            let dissimilar_cps = dissimilar_cartpole_indeces.map(i => cartpoles[i])

            cartpoles_to_visualize.push([similar_cps, dissimilar_cps])

        }


        for (let i = 0; i < cartpoles_to_visualize.length; i++) {
            let title = document.createElement("h4");
            title.innerText = "State: " + String(starting_states[i])


            let domSelect = "gridDiv"+String(i)
            let node = document.createElement("div");
            node.id += domSelect

            let node_child = document.createElement("div")
            node_child.className += "grid-container animation-container"

            node.append(node_child)
            document.body.appendChild(title)
            document.body.appendChild(node)
        }

        for (let i = 0; i < cartpoles_to_visualize.length; i++) {
            let domSelect = "#gridDiv"+String(i)
            UI_Blocks.behavior_grid(domSelect+" .animation-container",
                                      1,
                                      NUM_COLUMNS,
                                     [cartpoles_to_visualize[i]],
                                     this.cartpole_display_args,
                                     false,
                                     [state_ids[i]])
        }
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
        "Random" : new Linear_Policy(4, true).get_params(),
      }

      this.createRandomGrid("#gridDiv", policies)
    }

//===========< BEGIN Helper Functions >=============//
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
    TODO(SERENA) - comment
  **/
  createGrid(argument_list) {
      let mainObjct = argument_list[0]
      let grid_type = argument_list[1]
      let policy = argument_list[2]
      if (grid_type === "RANDOM") {
          mainObjct.createRandomGrid("#gridDiv", null)
          mainObjct.update_cartpole_grid(20)
      } else if (grid_type === "RANDOM_START") {
          mainObjct.createRandomGrid("#gridDiv", null, true)
          mainObjct.update_cartpole_grid(20)
      } else if (grid_type === "MULTI_START") {
          let x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 9, true)
          let x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 3, true)
          let theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 3, true)
          let theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 3, true)
          console.log("Policy", policy)

          mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples, policy)

          mainObjct.update_cartpole_grid(100)
      } else if (grid_type === "COVER_SPACE") {
          let x_samples = Util.linspace(-mainObjct.cartpole_thresholds.x, mainObjct.cartpole_thresholds.x, 5, true)
          let x_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.x_dot, mainObjct.cartpole_thresholds.x_dot, 5, true)
          let theta_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta, mainObjct.cartpole_thresholds.theta, 5, true)
          let theta_dot_samples = Util.linspace(-mainObjct.cartpole_thresholds.theta_dot, mainObjct.cartpole_thresholds.theta_dot, 5, true)

          mainObjct.createDimCoverActionSpace("#gridDiv", x_samples, x_dot_samples, theta_samples, theta_dot_samples)
          mainObjct.update_cartpole_grid(100)
      }
  }

  /**
  * Test user knowledge - show them a cartpole and ask what will happen next.
  *
  **/
  testUserKnowledge() {
    let mainObjct = this
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
  **/
  addSingleFeedbackCartAndButtons() {
    let mainObjct = this
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

  @param{number} num_steps : the number of policy steps to visualize
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
  createDimCoverActionSpace(domSelect, x_samples, x_dot_samples, theta_samples, theta_dot_samples, comparison_policy=null) {
    let mainObjct = this;
    $(domSelect+" .title").html("Communicate Policy Through Examples")

    let cartpoles_tmp = cartesian(x_samples, x_dot_samples, theta_samples, theta_dot_samples);
    let cartpoles = [];
    // add cartpoles to be updated by COACH
    for (let i = 0; i < cartpoles_tmp.length*2; i++) {
      let cp = new CartPole(mainObjct.cartpole_thresholds);
      cp.reset(cartpoles_tmp[Math.floor(i/2)])

      if (i % 2 === 0) {
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


}
