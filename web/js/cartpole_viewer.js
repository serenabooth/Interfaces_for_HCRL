class Cartpole_Viewer {

    constructor(thresholds, state_vals = null) {
      this.state_var_list = ["x", "x_dot", "theta", "theta_dot"]

      //use directionary in case actions are multi-dimensional?
      this.cartpole_user_actions = {
        "push_cart" : [0,1]
      }

      //max/mins of the cartpole state vals
      this.state_var_thresholds = {}
      Object.assign(this.state_var_thresholds, thresholds)
    }

    /**
    test method to generate random actions
    for each possible action dimension, choose an action
    **/
    gen_random_actions(cartpole_user_actions = null) {

      if (!cartpole_user_actions)
        cartpole_user_actions = this.cartpole_user_actions

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

    gen_svg(domSelector, world_state, actions, img_width, img_height, animation_args = null) {
      //scale of world to image
      var world_width = this.state_var_thresholds.x*4 // ( 2.4 , 2.4)
      var scale = img_width/world_width

      //convert state data to usable form
        if(world_state == null)
          world_state = [0,0,0,0]
        //if we get data as array, then convert to obj
        else if(Array.isArray(world_state)) {
          let stateAsObj = {}
          for(let i = 0; i < this.state_var_list.length; i++) {
            let state_var_name = this.state_var_list[i]
            stateAsObj[state_var_name] = world_state[i]
          }
          world_state = stateAsObj
        }


        //the est x & theta the prev timestep
        var est_next_timesteps = 1
        var pole_est_next_theta = world_state.theta + (est_next_timesteps*world_state.theta_dot)
        var pole_est_next_theta_degrees = pole_est_next_theta * 180 / Math.PI
        var cart_est_next_x = (world_state.x + (est_next_timesteps*world_state.x_dot))*scale+img_width/2.0

        //dimensions of cart
        var cartx = world_state.x *scale+img_width/2.0
        var carty = img_height*0.66   // middle of cart
        var cartwidth = 0.1*img_width
        var cartheight = 0.1*img_height

        //dimensions & angle of pole
        var polewidth = 0.025*img_width
        var polelen = cartwidth*2;
        var theta_degrees = world_state.theta * 180 / Math.PI

        //========= Create tooltip ===============//

        //an on-click event to the svg. TODO: make it a mouse-over & format text
        var tooltip_txt = ""
        for(let v in world_state) {
          let rounded_val = world_state[v].toFixed(2)
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
        var cart_est_next_track = draw.line(cartx-cartwidth/2, carty, cart_est_next_x, carty)
        cart_est_next_track.stroke({ color: 'rgba(96,175,255,0.25)', width: 7 })

        //est position of cart at last timestep
        var cart_est_next_pt =  draw.circle(polewidth).fill('rgb(127,127,204)')
        cart_est_next_pt.center(cart_est_next_x,carty)

        //draw & rotate pole
        var pole = draw.rect(polewidth, polelen).fill('rgb(204,153,102)')
        pole.center(cartx,carty-polelen/2)
        pole.rotate(theta_degrees,cartx,carty)

        //draw and show where pole would go on next timestep
        var pole_est_next = draw.rect(polewidth, polelen).fill('rgba(204,153,102,0.5)')
        pole_est_next.center(cart_est_next_x,carty-polelen/2)
        pole_est_next.rotate(pole_est_next_theta_degrees,cartx,carty)

        //draw axle last so it's on top
        var axle = draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        axle.center(cartx,carty)

        //include animations if args are inluded
        if(animation_args != null) {
          pole.animate(animation_args).center(cart_est_next_x,carty-polelen/2).rotate(pole_est_next_theta_degrees,cartx,carty)
          cart.animate(animation_args).center(cart_est_next_x,carty)
          axle.animate(animation_args).center(cart_est_next_x,carty)
        }

        //quick arrow triangle to indicate user action
        var arrow_x_direction = actions["push_cart"] == 0 ? -1 : 1
        var arrow_x = cartx - arrow_x_direction*cartwidth/2
        var arrow_point_x = arrow_x + cartwidth * arrow_x_direction
        var arrow_y_top = carty + img_height*(0.20)
        var arrow_y_mid = carty + img_height*(0.26)
        var arrow_y_bottom = carty + img_height*(0.32)

        var arrow_triangle = draw.polygon(`${arrow_x},${arrow_y_top},${arrow_x},${arrow_y_bottom}, ${arrow_point_x},${arrow_y_mid}`)
        arrow_triangle.fill('#999')//.stroke({ color:"green", width: 2 })

    }


}
