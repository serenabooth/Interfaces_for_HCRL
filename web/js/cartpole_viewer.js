class Cartpole_Viewer {


    constructor(cartpoleSim, thresholds) {
      this.sim = cartpoleSim

      //max/mins of the cartpole state vals
      this.state_var_thresholds = {}
      Object.assign(this.state_var_thresholds, this.sim.cartpole_thresholds)
    }

    /**
    test method to generate random actions
    for each possible action dimension, choose an action
    **/
    gen_random_action() {
      return this.sim.getRandomAction()
    }

    /**
    Generates dictionary w/ random values for state
    **/
    gen_random_state() {
      return this.sim.getRandomState()
    }

    /**
    Generates an SVG from a given world state

    If animation is enabled, Faded cartpole representation represents orignal

    @param {string} domSelector the div that'll contain the SVG
    @param {array} world_state an array of float arrays
    @param {number} action 0 or 1 for left vs right
    @param {number} img_width
    @param {number} img_height
    @param {object} animation_args if null, then static image. Paramters as defined here: https://svgjs.com/docs/3.0/animating/
    @param {number} num_timesteps_to_show
    **/
    gen_svg(domSelector, world_state, action, img_width, img_height, animation_args = null,  num_timesteps_to_show = 1) {
      //scale of world to image
      var world_width = this.state_var_thresholds.x*2 //put thresholds at edge of grid
      var scale = img_width/world_width

      //convert state data to usable form
        if(world_state == null)
          world_state = [0,0,0,0]
        //if we get data as array, then convert to obj
        else if(Array.isArray(world_state)) {
          let stateAsObj = {}
          for(let i = 0; i < this.sim.state_var_list.length; i++) {
            let state_var_name = this.sim.state_var_list[i]
            stateAsObj[state_var_name] = world_state[i]
          }
          world_state = stateAsObj
        }

        //the est x & theta the prev timestep
        var pole_est_next_theta = world_state.theta + (num_timesteps_to_show*world_state.theta_dot)
        var pole_est_next_theta_degrees = pole_est_next_theta * 180 / Math.PI
        var cart_est_next_x = (world_state.x + (num_timesteps_to_show*world_state.x_dot))*scale+img_width/2.0

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
        if(action == 0)
          tooltip_txt += "pushTo: left"
        else
        tooltip_txt += "pushTo: right"

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
        //draw & rotate pole
        var pole = draw.rect(polewidth, polelen).fill('rgb(204,153,102)')
        pole.center(cartx,carty-polelen/2)
        pole.rotate(theta_degrees,cartx,carty)
        //draw axle last so it's on top
        var axle = draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        axle.center(cartx,carty)

        //draw faded cart -- if it's a static image, it's the next timestep
        var faded_cart = draw.rect(cartwidth, cartheight*0.75).fill('rgba(0,0,0,0.33)')
        faded_cart.center(cart_est_next_x,carty)
        //orig position of cart
        var faded_cart_axle =  draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        faded_cart_axle.center(cart_est_next_x,carty)
        //orig pole position
        var faded_pole = draw.rect(polewidth, polelen).fill('rgba(204,153,102,0.5)')
        faded_pole.center(cart_est_next_x,carty-polelen/2)
        faded_pole.rotate(pole_est_next_theta_degrees,cartx,carty)
        //draw est. amt cart traveled since last timetep
        var cart_est_next_track = draw.line(cartx, carty, cart_est_next_x, carty)
        cart_est_next_track.stroke({ color: 'rgba(96,175,255,0.25)', width: 7 })

        //include animations if args are inluded
        if(animation_args != null) {
          //switch faded cartpole to original position for animations
          faded_pole.center(cartx,carty-polelen/2)
          faded_pole.rotate(theta_degrees,cartx,carty)
          faded_cart.center(cartx,carty)
          faded_cart_axle.center(cartx,carty)

          pole.animate(animation_args).rotate(pole_est_next_theta_degrees,cartx,carty).center(cart_est_next_x,carty-polelen/2)
          cart.animate(animation_args).center(cart_est_next_x,carty)
          axle.animate(animation_args).center(cart_est_next_x,carty)
        }


        //quick arrow triangle to indicate user action
        var arrow_x_direction = action == 0 ? -1 : 1
        var arrow_x = cartx - arrow_x_direction*cartwidth/2
        var arrow_point_x = arrow_x + cartwidth * arrow_x_direction
        var arrow_y_top = carty + img_height*(0.20)
        var arrow_y_mid = carty + img_height*(0.26)
        var arrow_y_bottom = carty + img_height*(0.32)

        var arrow_triangle = draw.polygon(`${arrow_x},${arrow_y_top},${arrow_x},${arrow_y_bottom}, ${arrow_point_x},${arrow_y_mid}`)
        arrow_triangle.fill('#999')//.stroke({ color:"green", width: 2 })

    }


}
