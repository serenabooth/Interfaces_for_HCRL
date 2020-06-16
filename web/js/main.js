
$(document).ready(function() {


      //===========< init sim & viewer thresholds >====================//
      //thesholds for x & theta (radians)
      //goes from (-val, +val)
      var cartpole_thresholds = { x : 2.4,
                                  theta : 24 * Math.PI / 180, // = 0.41887902047863906

                                  //max velocity would span world in 1 timestep
                                  x_dot : 2*2.4,
                                  theta_dot : 2* 24 * Math.PI / 180
                                }
      var ui_blocks = new UI_Blocks()

      let whichPolicy = "Undulating"

      //policies from the dropbox paper
      //NOTE: likely assumes tau of 0.02, which we changed...
      let policies = {
        "Undulating" : [-0.28795545, 0.4220686, -0.55905958, 0.79609386],
        "Rigid" : [-0.06410089, 0.18941857, 0.43170927, 0.30863926]
      }


      let numCols = 4
      let numRows = 2

          //===========< choose policy & generate states for grid>====================//

          cartpoles = []
          for(let i = 0; i < numRows*numCols; i++) {
            //create random state cartpoles
            cp = new CartPole(cartpole_thresholds)
            cartpoles.push(cp)
          }

          //===========< fill in HTML >====================//

          //enable SVG animations
          var animation_args = {
              duration: 1000,
              delay : 0,
              when : 'now',
              swing: false,
              times: Number.MAX_SAFE_INTEGER,
              wait:1500,
          }
          //the # of timesteps in the animation...
          var numTimestepsToShow = 25 //half a second when cartpole.tau=0.02
          var include_cfs = false
          ui_blocks.state_grid("#randomgrid",numRows,numCols,cartpoles, policies[whichPolicy], include_cfs,numTimestepsToShow, animation_args)


          //generate SVG's of states & fill in grid
          let cssVals = Array.from({length:numCols}).map(x => "auto")
          $("#randomgrid").css("grid-template-columns", cssVals.join(" "))
          //fill in descriptive text
          $("#randomgrid_policy").text(`${whichPolicy}: [${policies[whichPolicy]}]`)
          //$("#randomgrid_descript").text("Static Image Faded elements: Where the cart *will* be in 1 timesteps at current velocity")

      //timelines
      //ui_blocks.timeline(viewer,"#animation",window.run_data,1,false)
      //ui_blocks.timeline(viewer,"#timeline",window.run_data)


      //$("#randomgrid_states").text(ui_blocks.state_text(states))


  });
