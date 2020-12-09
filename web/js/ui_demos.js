/**
This class demos different UI featuers
**/
class UIDemos {

  //set default parameters
    constructor() {

      //thesholds for x & theta (radians)
      //goes from (-val, +val)
      this.cartpole_thresholds = { x : 2.4,
                                    theta : 12 * Math.PI / 180, // = 0.41887902047863906/2
                                    //max velocity would span world in 4 timesteps
                                    x_dot : 2.4/2,
                                    //max velocity would span pole min to max in 4 timesteps
                                    theta_dot : (12 * Math.PI / 180)/2
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

      this.csvSetup()

      this.policyExplorer(policies["Undulating"], 'app', "Undulating")
      this.policyExplorer(policies["Rigid"], 'app2',"Rigid")
    }

    //===========< BEGIN Helper Functions >=============//

    policyExplorer(policy, divId, title) {

      let x_inc = 0.5;
      let theta_inc = 1 * Math.PI / 180 //1 degrees in radians
      let x_dot_inc = 0.5
      let theta_dot_inc = 1 * Math.PI / 180 //1 degrees in radians

      let bounds = {
        "x" : [-this.cartpole_thresholds.x+x_inc, this.cartpole_thresholds.x-x_inc, x_inc],
        "x_dot" : [-this.cartpole_thresholds.x_dot, this.cartpole_thresholds.x_dot, x_dot_inc],
        "theta" : [-this.cartpole_thresholds.theta+theta_inc, this.cartpole_thresholds.theta-theta_inc, theta_inc],
        "theta_dot" : [-this.cartpole_thresholds.theta_dot, this.cartpole_thresholds.theta_dot, theta_dot_inc],
      }

      let x_dot = 0.5
      let theta_dot = 0.5 * Math.PI / 180

      let num_states = 0

      let surface_vals = []
      let histogram_vals = []
      for (let x = bounds.x[0]; x < bounds.x[1]; x+= bounds.x[2]) {
        let currX = []
        for (let theta = bounds.theta[0]; theta < bounds.theta[1]; theta += bounds.theta[2])
          for (let x_dot = bounds.x_dot[0]; x_dot < bounds.x_dot[1]; x_dot += bounds.x_dot[2])
              for (let theta_dot = bounds.theta_dot[0]; theta_dot < bounds.theta_dot[1]; theta_dot += bounds.theta_dot[2]) {
                  let start_state = [x,x_dot, theta, theta_dot]

                  let cp = new CartPole(this.cartpole_thresholds,start_state)
                  let simTrace = this.cartpoleSim.simulation_from_policy(cp, policy, this.cartpole_display_args.maxTimesteps)
                  currX.push(simTrace.state_history.length)
                  histogram_vals.push(simTrace.state_history.length)

                  num_states++
              }

        surface_vals.push(currX)
      }

        var hist_data = [{
          x: histogram_vals,
          type: 'histogram',

          }];

          var hist_layout = {
            bargap: 0.05,
            bargroupgap: 0.2,
            barmode: "overlay",
            title: title,
            xaxis: {title: "# Timesteps"},
            yaxis: {title: "Count"},
          }

          var surface_data = [{
            type: 'surface',
            z: surface_vals,
          }]

          var surface_layout = {
            title: title,
            xaxis: {title: "x",
                    range: [bounds.x[0], bounds.x[1]]
                  },
            yaxis: {title: "theta",
                    range: [bounds.theta[0], bounds.theta[1]], }
          };

        let histId = divId+"_hist"
        let surfaceId = divId+"_surface"

        $("#"+divId).append(`<div id='${histId}'></div>`)
        $("#"+divId).append(`<div id='${surfaceId}'></div>`)

        Plotly.newPlot(histId, hist_data, hist_layout);
        Plotly.newPlot(surfaceId, surface_data, surface_layout);
    }

    //attaches CSV event handler to a HTML form
    csvSetup() {
      //this.twoCartsDemo("#app", policies)
      let args = { "cartpole_thresholds":this.cartpole_thresholds,
                    "cartpole_display_args" : this.cartpole_display_args,
                    "domSelector":'#csvdisplay' ,
                    "animation_div_dom_id" : "csv_cart"
                    }
      //attaches the procCSVs event handler to the <input id="csv"> element
      let inputId = "csv"
      Util.enableFileUploader(inputId, this.procCSVs, args)
    }

    //event handler : allows user to upload a CSV trajectory
    procCSVs(fileContents, args) {

      //clears the cartpole animation as well as widgets
      UI_Blocks.clear_gridcell(args.domSelector, args.animation_div_dom_id)

      //create cartpole and run simulation
      let cp = new CartPole(args.cartpole_thresholds)
      cp.setTitle("hello")

      var lines = fileContents.split('\r\n');
      //hack: need to check the python script since it's inserting a 0,0,0,0
      lines.shift()
      for(let state of lines) {
        state = state.split(",")
        let action = state.pop()
        if(state.length > 0) {
          if(state.length < 4) {
            alert("Error: Not enough columns...there shoud be 5 (x, xDot, th, thDot, action)")
            return
          }
          for(let i = 0; i < state.length; i++)
            state[i] = parseFloat(state[i])
          cp.addSimTimestep(state, action)
        }
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

}
