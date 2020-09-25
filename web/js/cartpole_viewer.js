class Cartpole_Viewer {

    constructor(cartpoleSim) {
      this.sim = cartpoleSim

      //max/mins of the cartpole state vals
      this.state_var_thresholds = {}
      Object.assign(this.state_var_thresholds, this.sim.cartpole_thresholds)

      this.world_width = this.state_var_thresholds.x*2 //put thresholds at edge of grid

    }

    //==============< BEGIN Methods to calculate SVG positions =================//

    //converts cartpole xPos into the SVG xPos
    calc_svg_xpos(world_x, img_width, world_width) {
      var scale = img_width/world_width
      return world_x *scale+img_width/2.0
    }

    /**
    Calculates the svg positions of the various parts of the cartpole & arrows
    **/
    calc_svg_positions(cartpole_state, action, img_width, img_height, pullOrPush = "pull") {

      var svg_positions = {
        img_width: img_width,
        pole : {},
        cart : {},
        arrow : {},
        pullOrPush: pullOrPush
      }

      let world_state = {
        x : cartpole_state[0],
        xDot : cartpole_state[1],
        theta : cartpole_state[2],
        thetaDot : cartpole_state[3],
      }

      //dimensions of cart
      svg_positions.cart.x = this.calc_svg_xpos(world_state.x, img_width, this.world_width)
      svg_positions.cart.y = img_height*0.66   // middle of cart
      svg_positions.cart.width = 0.1*img_width
      svg_positions.cart.height = 0.1*img_height

      //dimensions & angle of pole
      svg_positions.pole.width = 0.025*img_width
      svg_positions.pole.len = svg_positions.cart.width*2;
      svg_positions.pole.theta_degrees = world_state.theta * 180 / Math.PI

      //determine which way to draw the arrow
      var whichSideOfCart = (pullOrPush == "push") ? -1 : 1;

      //if there is no action, then we don't include an arrow
      if(action == null)
        svg_positions.arrow = null
      else {
        svg_positions.arrow.x_direction_const = action  //action will be -1 or 1
        svg_positions.arrow.y_top = svg_positions.cart.y + img_height*(0.025)
        svg_positions.arrow.y_mid = svg_positions.cart.y
        svg_positions.arrow.y_bottom = svg_positions.cart.y - img_height*(0.025)
        svg_positions.arrow.x = svg_positions.cart.x + (whichSideOfCart)*svg_positions.arrow.x_direction_const*0.25*svg_positions.cart.width + (whichSideOfCart)*svg_positions.arrow.x_direction_const*svg_positions.cart.width/2
        svg_positions.arrow.point_x = svg_positions.arrow.x + svg_positions.cart.width/2 * 0.75*svg_positions.arrow.x_direction_const
      }

      return svg_positions
    }

    //==============< END Methods to calculate SVG positions =================//

    //==============< BEGIN Methods to draw SVG elements =================//

    /**
    based on results from calc_svg_positions(), add the arrow to the SVG
    **/
    draw_arrow(svgObj, svg_positions) {

      //don't include arrow if we don't have info (happens when there's no action)
      if(svg_positions.arrow == null)
        return;

      //draw an arrow shoing a push (or pull) force on the cart
      var arrow_triangle = svgObj.polygon(`${svg_positions.arrow.x},${svg_positions.arrow.y_top},${svg_positions.arrow.x},${svg_positions.arrow.y_bottom}, ${svg_positions.arrow.point_x},${svg_positions.arrow.y_mid}`).fill('rgba(255,0,0,1)')
      var arrow_line = svgObj.line(svg_positions.arrow.point_x, svg_positions.arrow.y_mid, svg_positions.cart.x - svg_positions.arrow.x_direction_const*svg_positions.cart.width/2, svg_positions.arrow.y_mid)
      arrow_line.stroke({ color: 'rgba(255,0,0,1)', width: 1.5/*, dasharray : "5,5"*/})

      return {
        triangle: arrow_triangle,
        line : arrow_line
      }
    }


    /**
    based on results from calc_svg_positions(), add cart to the SVG
    **/
    draw_cart(svgObj, svg_positions) {

      //initialize cart 2nd so it can be on top
      var box = svgObj.rect(svg_positions.cart.width, svg_positions.cart.height).fill('rgb(0,0,0)')
      var pole = svgObj.rect(svg_positions.pole.width, svg_positions.pole.len).fill('rgb(204,153,102)')
      var axle = svgObj.circle(svg_positions.pole.width*0.66).fill('rgb(127,127,204)')

      this.move_cart(svg_positions.cart, svg_positions.pole, box, pole, axle)

      return {"box" :box, "pole" : pole, "axle" : axle}
    }

    /**
    draw an additional faded cart that has slightly smaller parts than the normal cart
    **/
    draw_faded_cart(svgObj, svg_positions_cart, svg_positions_pole) {
      //initialize faded cart
      var box = svgObj.rect(svg_positions_cart.width, svg_positions_cart.height*0.75).fill('rgba(0,0,0,0.33)')
      var axle = svgObj.circle(svg_positions_pole.width*0.66).fill('rgb(127,127,204)')
      var pole = svgObj.rect(svg_positions_pole.width, svg_positions_pole.len).fill('rgba(204,153,102,0.5)')

      return {"box" :box, "pole" : pole, "axle" : axle}
    }

    /**
    based on results from calc_svg_positions(), add track to the SVG
    **/
    draw_track(svgObj, svg_positions) {
      //draw track first so it's back-most layer on canvas
      var track = svgObj.line(0, svg_positions.cart.y, svg_positions.img_width, svg_positions.cart.y)
      track.stroke({ color: 'black', width: 1 })

      return track
    }

    /**
    Moves cart elements to correct position
    **/
    move_cart(svg_positions_cart, svg_positions_pole, box, pole, axle) {
      //place cart components
      box.center(svg_positions_cart.x,svg_positions_cart.y)
      pole.center(svg_positions_cart.x,svg_positions_cart.y-svg_positions_pole.len/2)
      pole.rotate(svg_positions_pole.theta_degrees, svg_positions_cart.x,svg_positions_cart.y)
      axle.center(svg_positions_cart.x,svg_positions_cart.y)
    }


  //==============< END Methods to draw SVG elements =================//


  //==============< BEGIN Methods to create whole SVGs =================//

    /**
    populate SVG for a single timeslice
    **/
    populate_svg_snapshot(svgObj, world_state, action, img_width, img_height, title="", pullOrPush = "pull") {

      var svg_positions = this.calc_svg_positions(world_state, action, img_width, img_height, pullOrPush)
      //========== Begin SVG ===================//
      //create SVG
      var track = this.draw_track(svgObj, svg_positions)
      var arrow = this.draw_arrow(svgObj, svg_positions)
      var cart = this.draw_cart(svgObj, svg_positions)

      svgObj.text(title)

      return {
        track : track, arrow : arrow, cart : cart
      }
    }

    /**
    create animation of a simulation run in an existing SVG

    timestepDelayMS: default display speed = 50fps = 20ms/frame
    **/
    populate_svg_simulation(cartpoleSVG, cartpole, img_width, img_height, timestepDelayMS = 20, showTitle=false) {

      let simTrace = cartpole.getSimTrace()

      //animate the simulation by reusing the SVG object
      let title = (showTitle) ? cartpole.getTitle() : ""
      this.populate_svg_snapshot(cartpoleSVG, simTrace.initState, null, img_width, img_height)

      let max_time = simTrace.state_history.length

      for( let i = 0; i < max_time; i++) {
        //get the timestep data
        let curr_state = simTrace.state_history[i]
        let action = simTrace.action_history[i]

        let self = this
        setTimeout(function() {
          cartpoleSVG.clear()
          //not most efficient but should be okay for user experience...
          self.populate_svg_snapshot(cartpoleSVG, curr_state, action, img_width, img_height, title )


        }, timestepDelayMS*i)

        }


    }

/*
    /**
    Generates an SVG from a given world state

    If animation is enabled, Faded cartpole representation represents orignal
    @param {string} svgObj svgjs object
    @param {array} world_state sim's state obj
    @param {number} action 0 or 1 for left vs right
    @param {array} next_state next state given the action
    @param {array} future_state a hypothetical future state if the action was taken w/ no further actions
    @param {number} img_width
    @param {number} img_height
    @param {object} animation_args if null, then static image. Paramters as defined here: https://svgjs.com/docs/3.0/animating/
    **
    populate_svg_pushAndCoastAnimation(svgObj, world_state, action, next_state, future_state = null, img_width, img_height, animation_args = null, pullOrPush = "pull") {

        var svg_positions = this.calc_svg_positions(world_state, action, img_width, img_height, pullOrPush)
        //========== Begin SVG ===================//
        //create SVG
        var track = this.draw_track(svgObj, svg_positions)
        var arrow = this.draw_arrow(svgObj, svg_positions)
        var cart = this.draw_cart(svgObj, svg_positions)
        var faded_cart = this.draw_faded_cart(svgObj, svg_positions)

        //if animating, faded cart represents original timestep
        if(animation_args != null) {

          var cart_est_future_x = this.calc_svg_xpos(future_state.x, img_width, this.world_width)
          var future_state_theta_degrees = future_state.theta * 180 / Math.PI

          if(animation_args.not_svgjs_show_title)
            svgObj.text(this.sim.title).font({ fill: '#ddd'})

          //put faded cart in original
          faded_cart.box.center(svg_positions.cart.x,svg_positions.cart.y)
          faded_cart.axle.center(svg_positions.cart.x,svg_positions.cart.y)
          faded_cart.pole.center(svg_positions.cart.x,svg_positions.cart.y-svg_positions.pole.len/2)
          faded_cart.pole.rotate(svg_positions.pole.theta_degrees,svg_positions.cart.x,svg_positions.cart.y)

          //animate opaque cart
          cart.pole.animate(animation_args).center(cart_est_future_x,svg_positions.cart.y-svg_positions.pole.len/2).rotate(future_state_theta_degrees-  svg_positions.pole.theta_degrees,svg_positions.cart.x,svg_positions.cart.y)
          cart.box.animate(animation_args).center(cart_est_future_x,svg_positions.cart.y)
          cart.axle.animate(animation_args).center(cart_est_future_x,svg_positions.cart.y)

        //if static image, it's the next timestep
        } else {

          //draw est. amt cart traveled since last timetep
          var cart_est_next_x = this.calc_svg_xpos(next_state.x, img_width, this.world_width)
          var cart_est_next_track = svgObj.line(svg_positions.cart.x, svg_positions.cart.y, cart_est_next_x, svg_positions.cart.y)
          cart_est_next_track.stroke({ color: 'rgba(96,175,255,0.25)', width: 7 })

          //next_state.theta_degrees = next_state.theta * 180 / Math.PI

          faded_cart.box.center(cart_est_next_x,svg_positions.cart.y)
          //orig position of cart
          faded_cart.axle.center(cart_est_next_x,svg_positions.cart.y)
          //orig pole position
          faded_cart.pole.center(cart_est_next_x,svg_positions.cart.y-svg_positions.pole.len/2)
          faded_cart.pole.rotate(future_state_theta_degrees,svg_positions.cart.x,svg_positions.cart.y)
        }
    }
    */

    //==============< END Methods to create whole SVGs =================//

}
