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
    populate_svg_snapshot(svgObj, world_state, action, img_width, img_height, title="", pullOrPush = "pull", showVals=false) {

      var svg_positions = this.calc_svg_positions(world_state, action, img_width, img_height, pullOrPush)
      //========== Begin SVG ===================//
      //create SVG
      var track = this.draw_track(svgObj, svg_positions)
      var arrow = this.draw_arrow(svgObj, svg_positions)
      var cart = this.draw_cart(svgObj, svg_positions)

      svgObj.text(title).font("size","10").center(svg_positions.cart.x,svg_positions.cart.y+10).stroke("#DDD")
      if(showVals) {
        let readable_state = Util.roundElems(world_state,3).join(",")
        svgObj.text(`(${readable_state})`).font("size","10").center(img_width*0.5,img_height-10).stroke("#DDD")
      }
      return {
        track : track, arrow : arrow, cart : cart
      }
    }

    /**
    create animation of a simulation run in an existing SVG

    timestepDelayMS: default display speed = 50fps = 20ms/frame
    **/
    populate_svg_simulation(cartpoleSVG, cartpole, img_width, img_height, displayArgs, widgetsDomSelect=null) {

      let title = (displayArgs.showCartpoleTitle) ? cartpole.getTitle() : ""
      let self = this   //give access to the Cartpole_Viewer objects


      let simTrace = cartpole.getSimTrace()
      let maxTime = simTrace.state_history.length

      //function to animate cartpoles
      let t = 0;        //counter to help keep track of time
      function animateCartpole() {

        //get the timestep data
        let curr_state = simTrace.state_history[t]
        let action = simTrace.action_history[t]
        if(widgetsDomSelect != null)
          $(widgetsDomSelect+" input.gridslider").val(t)

        //draw cartpole
        cartpoleSVG.clear()

        self.populate_svg_snapshot(cartpoleSVG, curr_state, action, img_width, img_height, title+`t=${t}` )

        //create a 'flashing' element when cartpole resets
        //TOOD: make this better
        if(t==0)
          cartpoleSVG.circle(500).fill('rgba(255,255,255,0.5)').center(img_width*0.5, img_height*0.5)
        //loop around timer to 0
        if(++t == maxTime)
          t = 0

      }
      //start cartpole animation
      let cartpoleAnimHandle = setInterval(animateCartpole,displayArgs.timestepDelayMS)

      //create widgets to help user control animations
      if(widgetsDomSelect != null) {

        //create timeline slider for this run
        $(widgetsDomSelect).append(`<div class="gridslider">0<input type="range" min="0" max="${maxTime-1}" value="0" class="gridslider" data-show-value="true">${maxTime-1}<button class="stop">Stop</button><button class="play">Play</button></div>`)
        $(widgetsDomSelect+" input.gridslider").on({

          'input' : function() {
            if($(this).val() != "") {
              clearInterval(cartpoleAnimHandle)
              t = $(this).val()
              animateCartpole()
            }},

          'mousemove' : function() {

          }
        })


        //stop button
        $(widgetsDomSelect+" .gridslider .stop").click(function() {
          clearInterval(cartpoleAnimHandle)
        })

        //play button to restart animation
        $(widgetsDomSelect+" .gridslider .play").click(function() {
          clearInterval(cartpoleAnimHandle)
          cartpoleAnimHandle = setInterval(animateCartpole,displayArgs.timestepDelayMS)
        })
      }


    }

    //==============< END Methods to create whole SVGs =================//

}
