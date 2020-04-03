class Cartpole_Viewer {

    constructor(thresholds, state_vals = null) {
      this.state_var_list = ["x", "xDot", "theta", "thetaDot"]

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
    gen_svg(domSelector, img_width, img_height) {

        //create SVG
        var draw = SVG().addTo(domSelector).size(img_width, img_height)

        //an on-click event to the svg. TODO: make it a mouse-over & format text
        var currState = {}
        Object.assign(currState,this.state)
        draw.click(function() {
          alert(JSON.stringify(currState))
        })

        //scale of world to image
        var world_width = this.state_var_thresholds.x*2 // ( 2.4 , 2.4)
        var scale = img_width/world_width

        //dimensions of cart
        var cartx = this.state.x *scale+img_width/2.0
        var carty = img_height*0.66   // middle of cart
        var cartwidth = 0.1*img_width
        var cartheight = 0.1*img_height

        //dimensions & angle of pole
        var polewidth = 0.025*img_width
        var polelen = cartwidth*2;
        var theta_degrees = this.state.theta * 180 / Math.PI

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

      }

      //set state to random vals
      set_random_state() {
          var state_vals = this.gen_random_state();
          this.updateState(this.cartpole_vars, state_vals)
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
