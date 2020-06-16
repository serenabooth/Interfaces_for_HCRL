class Cartpole_Viewer {

    constructor(cartpoleSim) {
      this.sim = cartpoleSim

      //max/mins of the cartpole state vals
      this.state_var_thresholds = {}
      Object.assign(this.state_var_thresholds, this.sim.cartpole_thresholds)
    }



    /**
    Generates an SVG from a given world state

    If animation is enabled, Faded cartpole representation represents orignal

    @param {string} domSelector the div that'll contain the SVG
    @param {array} world_state sim's state obj
    @param {number} action 0 or 1 for left vs right
    @param {array} next_state next state given the action
    @param {array} future_state a hypothetical future state if the action was taken w/ no further actions
    @param {number} img_width
    @param {number} img_height
    @param {object} animation_args if null, then static image. Paramters as defined here: https://svgjs.com/docs/3.0/animating/
    **/
    gen_svg(domSelector, world_state, action, next_state, future_state, img_width, img_height, animation_args = null) {

      //scale of world to image
      var world_width = this.state_var_thresholds.x*2 //put thresholds at edge of grid
      var scale = img_width/world_width

      //the est x & theta the prev timestep
      var pole_est_next_theta = next_state.theta
      var pole_est_next_theta_degrees = pole_est_next_theta * 180 / Math.PI
      var cart_est_next_x = (next_state.x)*scale+img_width/2.0

      var pole_est_future_theta = future_state.theta
      var pole_est_future_theta_degrees = pole_est_future_theta * 180 / Math.PI
      var cart_est_future_x = (future_state.x)*scale+img_width/2.0


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
/*
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
*/
        //========== Begin SVG ===================//

        //create SVG
        var draw = SVG().addTo(domSelector).size(img_width, img_height)

        //Object.assign(currState,this.state)

        //draw track first so it's back-most layer on canvas
        var track = draw.line(0, carty, img_width, carty)
        track.stroke({ color: 'black', width: 1 })

        //draw arrow to indicate direction - have to draw before cart
        //so that red line doesn't overlap cart
        var arrow_x_direction = action == 0 ? -1 : 1
        var arrow_x = cartx - arrow_x_direction*1.75*cartwidth - arrow_x_direction*cartwidth/2
        var arrow_point_x = arrow_x + cartwidth/2 * arrow_x_direction
        var arrow_y_top = carty + img_height*(0.075)
        var arrow_y_mid = carty
        var arrow_y_bottom = carty - img_height*(0.075)

        var arrow_triangle = draw.polygon(`${arrow_x},${arrow_y_top},${arrow_x},${arrow_y_bottom}, ${arrow_point_x},${arrow_y_mid}`).fill('rgba(255,0,0,1)')

        var action = draw.line(arrow_point_x, arrow_y_mid, cartx - arrow_x_direction*cartwidth/2, arrow_y_mid)
        //arrow_triangle.fill('rgba(255,0,0,0)')
        action.stroke({ color: 'rgba(255,0,0,1)', width: 1.5/*, dasharray : "5,5"*/})

        //initialize faded cart
        var faded_cart = draw.rect(cartwidth, cartheight*0.75).fill('rgba(0,0,0,0.33)')
        var faded_cart_axle =  draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        var faded_pole = draw.rect(polewidth, polelen).fill('rgba(204,153,102,0.5)')

        //initialize cart 2nd so it can be on top
        var cart = draw.rect(cartwidth, cartheight).fill('rgb(0,0,0)')
        var pole = draw.rect(polewidth, polelen).fill('rgb(204,153,102)')
        var axle = draw.circle(polewidth*0.66).fill('rgb(127,127,204)')
        //place cart components
        cart.center(cartx,carty)
        pole.center(cartx,carty-polelen/2)
        pole.rotate(theta_degrees,cartx,carty)
        axle.center(cartx,carty)

        //draw est. amt cart traveled since last timetep
        var cart_est_next_track = draw.line(cartx, carty, cart_est_next_x, carty)
        cart_est_next_track.stroke({ color: 'rgba(96,175,255,0.25)', width: 7 })

        //if animating, faded cart represents original timestep
        if(animation_args != null) {

          //put faded cart in original
          faded_cart.center(cartx,carty)
          faded_cart_axle.center(cartx,carty)
          faded_pole.center(cartx,carty-polelen/2)
          faded_pole.rotate(theta_degrees,cartx,carty)

          //animate opaque cart
          //the lines commented above each animation is a vestiage of trying to animate the
          //  immediate next step and following timsteps separately
          //pole.animate(animation_args).rotate(pole_est_next_theta_degrees-theta_degrees,cartx,carty).center(cart_est_next_x,carty-polelen/2)
          pole.animate(animation_args).center(cart_est_future_x,carty-polelen/2).rotate(pole_est_future_theta_degrees-theta_degrees,cartx,carty)
          //console.log("theta1"+ (theta_degrees))
          //console.log("theta2"+ (pole_est_future_theta_degrees-theta_degrees))
          //cart.animate(animation_args).center(cart_est_next_x,carty)
          cart.animate(animation_args).center(cart_est_future_x,carty)

          //axle.animate(animation_args).center(cart_est_next_x,carty)
          axle.animate(animation_args).center(cart_est_future_x,carty)


          /*
          an attempt at making the red triangle visible between the "next" and "future" timestep

          arrow_triangle.animate(animation_args).attr({ fill:"red"})
                        .animate(animation_args).attr({ fill:"red"})

          arrow_triangle.animate(animation_args).stroke({ color: 'rgba(255,0,0,0)'})
                .animate(animation_args).stroke({ color: 'rgba(255,0,0,1)'})

                          arrow_triangle.animate(animation_args).fill('rgba(255,0,0,0)')
                                        .animate(animation_args).fill('rgba(255,0,0,1)')

                    */

        //if static image, it's the next timestep
        } else {
          faded_cart.center(cart_est_next_x,carty)
          //orig position of cart
          faded_cart_axle.center(cart_est_next_x,carty)
          //orig pole position
          faded_pole.center(cart_est_next_x,carty-polelen/2)
          faded_pole.rotate(pole_est_next_theta_degrees,cartx,carty)
        }


    }




}
