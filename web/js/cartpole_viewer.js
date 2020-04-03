class Cartpole_Viewer {

    constructor(thresholds, state_vals = null) {
      this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]

      //max/mins of the cartpole state vals
      this.state_var_thresholds = {}
      Object.assign(this.state_var_thresholds, thresholds)

      //state variables for cartpole
      this.state = {}
      if(state_vals == null)
        this.set_random_state(this.state)
      else
        this.updateState(this.cartpole_vars, state_vals);
    }

    /**
    test method to generate random actions
    for each possible action dimension, choose an action
    **/
    gen_random_actions(cartpole_user_actions) {

      var random_actions = {}

      for (let a in cartpole_user_actions) {
        var possible_choices = cartpole_user_actions[a]
        var i = Math.floor(Math.random() * possible_choices.length)
        random_actions[a] = possible_choices[i]
      }

      return random_actions
    }

    /**
    Generates dictionary w/ random values for state
    **/
    gen_random_state() {

      var random_state = {}

      for (let v of this.state_var_list) {

          //generate random val within defined thresholds
          if(v in this.state_var_thresholds) {
              let max = this.state_var_thresholds[v]
              let min = -this.state_var_thresholds[v]
              //https://www.w3schools.com/js/js_random.asp
              random_state[v] = Math.random() * (max - min) + min
          //generate arbitrary random val
          } else {
              let min = -100, max = 100
              //https://www.w3schools.com/js/js_random.asp
              random_state[v] = Math.random() * (max - min)
          }
      }

      return random_state;

    }

    /**
    Populates a div with an SVG represntation of the cartpole
    **/
    gen_svg(domSelector, actions, img_width, img_height) {

        //scale of world to image
        var world_width = this.state_var_thresholds.x*2 // ( 2.4 , 2.4)
        var scale = img_width/world_width

        //dimensions of cart
        var cartx = this.state.x *scale+img_width/2.0
        var carty = img_height*0.66   // middle of cart
        var cartwidth = 0.1*img_width
        var cartheight = 0.1*img_height
        //the est. x of the cart at previous timestep
        var cart_est_last_x = (this.state.x - this.state.x_dot)*scale+img_width/2.0

        //dimensions & angle of pole
        var polewidth = 0.025*img_width
        var polelen = cartwidth*2;
        var theta_degrees = this.state.theta * 180 / Math.PI
        //the est theta of the pole in the prev timestep
        var pole_est_last_theta = this.state.theta - this.state.theta_dot
        var pole_est_last_theta_degrees = pole_est_last_theta * 180 / Math.PI

        //========= Create tooltop ===============//

        //an on-click event to the svg. TODO: make it a mouse-over & format text
        var tooltip_txt = ""
        for(let v in this.state) {
          let rounded_val = this.state[v].toFixed(2)
          tooltip_txt += `${v} : ${rounded_val}<br/>`
        }
        tooltip_txt+= "-----------------<br/>"
        for(let a in actions)
          tooltip_txt += `${a} : ${actions[a]}<br/>`

        $(domSelector).append(`<span class="tooltiptext">${tooltip_txt}</span>`);

        //========== Begin SVG ===================//

        //create SVG
        var draw = SVG().addTo(domSelector).size(img_width, img_height)

        //Object.assign(currState,this.state)

        //draw track first so it's back-most layer on canvas
        var track = draw.line(0, carty, img_width, carty)
        track.stroke({ color: 'black', width: 2 })

        //draw cart
        var cart = draw.rect(cartwidth, cartheight).fill('rgb(0,0,0)')
        cart.center(cartx,carty)

        //draw est. amt cart traveled since last timetep
        //var cartEdgeCorrectSide =
        var cart_est_last_track = draw.line(cartx-cartwidth/2, carty, cart_est_last_x, carty)
        cart_est_last_track.stroke({ color: 'rgba(96,175,255,0.25)', width: 10 })

        //est position of cart at last timestep
        var cart_est_last_pt =  draw.circle(polewidth).fill('#666')
        cart_est_last_pt.center(cart_est_last_x,carty)

        //draw & rotate pole
        var pole = draw.rect(polewidth, polelen).fill('rgb(204,153,102)')
        pole.center(cartx,carty-polelen/2)
        pole.rotate(theta_degrees,cartx,carty)

        //draw and show where pole would go on next timestep
        var pole_est_last = draw.rect(polewidth, polelen).fill('rgba(204,153,102,0.5)')
        pole_est_last.center(cartx,carty-polelen/2)
        pole_est_last.rotate(pole_est_last_theta_degrees,cartx,carty)

        /*
        looking to create an orc or sector between old & new pole position
        https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
                var d = [
                        "M", start.x, start.y,
                        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
                ].join(" ");
        */

        //draw axle last so it's on top
        var axle = draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        axle.center(cartx,carty)

        //quick arrow triangle to indicate user action
        var arrow_x_direction = actions["push_cart"] == "on_left" ? -1 : 1
        var arrow_x = cartx - arrow_x_direction*cartwidth/2
        var arrow_point_x = arrow_x + cartwidth * arrow_x_direction
        var arrow_y_top = carty + img_height*(0.20)
        var arrow_y_mid = carty + img_height*(0.26)
        var arrow_y_bottom = carty + img_height*(0.32)

        var arrow_triangle = draw.polygon(`${arrow_x},${arrow_y_top},${arrow_x},${arrow_y_bottom}, ${arrow_point_x},${arrow_y_mid}`)
        arrow_triangle.fill('rgb(127,127,204)')//.stroke({ color:"green", width: 2 })

      }

      //set state to random vals
      set_random_state() {
          var state_vals = this.gen_random_state();
          this.updateState(this.cartpole_vars, state_vals)
          return state_vals
      }

      //
      updateState(var_list, state_vals) {
        //TODO: err check whether all required state vars are set
        //(lazy way = sort keys, "::".join, compare strings)

        //TODO: err check whether thresholds are exceeded

        //copy all keys to this.state
        Object.assign(this.state, state_vals)

      }

}
