
class UI_Blocks {


  /**
  Place cartpole animations at specified x,y positions
  Simulations should have been run beforehand

  @domSelect: the selector for the containing dom element
  @corkboard_width :
  @corkboard_height: d
  @cartpole_array: array of cartpoles. Each cartpole should be set to the desired state to display
  @cartpole_positions: an array of { 'x':xPox, 'y':yPos}. Index of position specifies cartpole at same index.
                      Note: position (0,0) in SVG is in the top-left
  @display_args: an object containing arguments that configure animations
  **/
  static state_corkboard(domSelect, corkboard_width, corkboard_height, cartpole_array, cartpole_positions, display_args) {
    var svgObj = Util.gen_empty_svg(domSelect, corkboard_width, corkboard_height)

    //render and place each cartpole
    for (let i = 0; i < cartpole_array.length; i++) {
      let cp = cartpole_array[i]
      let cp_svg_pos = cartpole_positions[i]

      UI_Blocks.embed_animation_svg_in_another_svg(svgObj, cp_svg_pos["x"], cp_svg_pos["y"], cp, display_args.img_width, display_args.img_height, display_args)
    }
  }


  /**
  Creates a grid of cartpole animations - simulations should have been run before calling this

  @gridDivDomSelector: the div that contains the grid
  @numRows : number of rows in the grid
  @numCols : number of columns in the grid
  @cartpole_array: array of cartpoles. Each cartpole should be set to the desired state to display
  @cartpole_display_args: an object containing arguments that configure animations
  @policy: policy for cartpole (as array)

  **/
  static state_grid(gridDivDomSelector, numRows, numCols, cartpole_array, display_args) {

    //check to see whether we have enough cartpoles
    if( numRows*numCols > cartpole_array.length) {
      console.log("ui_blocks.state_grid(): Not enough cartpoles for the number of grid cells")
      return
    }

    //change CSS in grid to reflect correct # of columns
    let cssVals = Array.from({length:numCols}).map(x => "auto")
    $(gridDivDomSelector).css("grid-template-columns", cssVals.join(" "))

    //create a gridcell for each cartpole
    for(let i = 0; i < numRows*numCols; i++) {

      let cartpole = cartpole_array[i]

      //create div for the cart's gridcell
      let divId = `cart_${i}`
      $(gridDivDomSelector).append(`<div id="${divId}"></div>`)

      //insert table of state values
      $("#"+divId).append(cartpole.getTitle())

      //insert simulation animation
      var animation_div_dom_id = "drawing-"+cartpole.id;
      this.create_animation_in_dom_elem("#"+divId, animation_div_dom_id, cartpole, display_args.img_width , display_args.img_height, display_args)

      //insert counterfactual simulation animation
      //if(display_args.include_cfs)
        //this.create_animation_in_dom_elem(gridCellDomSelect, animation_div_dom_id+"_cf", cartpole, cf_sim_run_results, display_args.img_width , display_args.img_height, display_args.animation_args)

    }

  }


  //===== BEGIN Grid Helper Functions ======//

      /**
      @svg: the parent svg
      @x: x position of this animation within parent SVG
      @y: x position of this animation within parent SVG
      @cartpole: a cartpole object w/ the state values defined
      @img_width:
      @img_height
      @display_args: animation args according to svgjs (https://svgjs.com/docs/3.0/animating/)
      **/
      static embed_animation_svg_in_another_svg(parentSVG, x, y, cartpole, img_width, img_height, display_args) {

        //create svg inside the div
        var svgObj = parentSVG.nested(x,y)
        svgObj.attr('x', x)
        svgObj.attr('y', y)

        cartpole.viewer.populate_svg_simulation(svgObj, cartpole, img_width, img_height, display_args.timestepDelayMS)
      }



      /**
      Creates an animation svg and places it within a dom object

      simulation data should have been generated ahead of time

      @containerDomSelect: dom selector for a gridcell
      @animation_div_dom_id: desired div id for the animation div
      @cartpole: a cartpole object w/ the state values defined (should contain simRun data)
      @img_width:
      @img_height
      @animation_args: animation args according to svgjs (https://svgjs.com/docs/3.0/animating/)
      **/
      static create_animation_in_dom_elem(containerDomSelect, animation_div_dom_id, cartpole, img_width, img_height, display_args) {

        //create animation's div
        $(containerDomSelect).append(`<div id="${animation_div_dom_id}"></div>`)

        //create svg inside the div & populate it
        var svgObj = Util.gen_empty_svg("#"+animation_div_dom_id, img_width, img_height)
        cartpole.viewer.populate_svg_simulation(svgObj, cartpole, img_width, img_height, display_args.timestepDelayMS)
      }

  //===== END Grid Helper Functions ======//

  static timeline() {
    console.log("This is not currently working... need to fix")
  }

  //NOTE: timeline functions are all broken due to updates in Cartpole obj
  //populates a timeline given run results

  //TODO: may not be working anymore after all the animation updates

  static timeline_old(viewer, domSelector, runData, numCells = 5, allowActionChange = true) {

    var img_width = 200, img_height = 100

    //pop off header row
    var headers = runData.shift()
    //slider should go from [0, maxStartT]
    let maxStartT = runData.length - numCells
    //col # of action in the simulation run data
    var index_action = runData[0].length - 1

    //create 1xn w/ first n timestemps of the run
    var timelinegrid_id = domSelector.slice(1)+"_grid"
    var timeline_gridcell_ids = []
    var timeline_gridcell_click_handlers = []

    //create CSS that sets the row length
    let css = "grid-template-columns:"
    for(let i = 0; i < numCells; i++)
      css += " auto"

    //create containing div for the grid cell
    $(domSelector).append(`<div id="${timelinegrid_id}" class="grid-container" style="${css}"></div>`)

    //create each gridcell & populate w/ SVG
    for(let i = 0; i < numCells; i++) {

      //save divId for later
      let divId = `${timelinegrid_id}-drawing-${i}`
      timeline_gridcell_ids.push(divId)

      //create gridcell div
      $("#"+timelinegrid_id).append(`<div id="${divId}" class="tooltip" data-gridcellindex="${i}", data-t="", data-cellstate=""></div>`)

      //flll grid w/ world state SVG at time i
      updateTimelineGrid(i, runData, divId)

      //add a click event to allow user to toggle the action taken for the state
      if(allowActionChange)
        $("#"+divId).click(function () {
          let t = parseInt($(this).attr("data-t"))
          let cell_state = JSON.parse(($(this).attr("data-cellstate")))
          cell_state[index_action] = cell_state[index_action] ? 0 : 1
          updateTimelineGrid(t, runData, $(this).attr("id"), cell_state)
        })
    }

    //create timeline slider for this run
    let griderSliderId = timelinegrid_id+"_slider"
    $(domSelector).append(`<div style="width:80%;margin:auto;padding-top:2em"><input type="range" min="0" max="${maxStartT}" value="0" class="slider" id="${griderSliderId}" data-show-value="true"></div>`)

    //create event that updates timeline grids upon slider change
    //$( `#${griderSliderId}` ).change(function() {
    $(`#${griderSliderId}`).on('input', function() {

      let currStartT =  $( this ).val()
      for(let i = 0; i < numCells; i++) {
        let divId = timeline_gridcell_ids[i]
        updateTimelineGrid(i + parseInt(currStartT), runData, divId)
      }
    });

    //update specified gridcell with world state + action at time t
    //TODO: may not be working anymore after all the animation updates

    function updateTimelineGrid_old(t, runData, divId, changedData_t = null) {

      let divDomSelector = `#${divId}`

      //reset div
      $(divDomSelector).empty()
      $(divDomSelector).css("background","")

      //get timeslice data from simulation
      var world_state = runData[t].slice(0,-1)
      var actions = {"push_cart" : runData[t][ index_action]}
      var run_cell_state_different = false

      //store sim data in the attributes
      $(divDomSelector).attr("data-t", t)
      let gridcellIndex = $(divDomSelector).attr("data-gridcellindex")

      //check to see whether we're displaying data that's different from timeslice
      if(changedData_t != null) {
        //highlight cells where it's display something different than sim state / action
        run_cell_state_different = !(changedData_t.join("::") === runData[t].join("::"))
        if( run_cell_state_different ) {
          world_state = changedData_t.slice(0,-1)
          actions = {"push_cart" : changedData_t[index_action]}
          $("#"+divId).css("background","#EEE")
        }
        //save the state
        $(divDomSelector).attr("data-cellstate", JSON.stringify(changedData_t))
      } else
        $(divDomSelector).attr("data-cellstate", JSON.stringify(runData[t]))



      //add curr time
      $(divDomSelector).append(`<span>${t}</span>`)
      console.log("timeline")

      var svgObj = Util.gen_empty_svg(divDomSelector, img_width, img_height)
      cartpole.viewer.gen_svg(svgObj, cartpole.getState(false), action, next_state, null, img_width, img_height)


      //add the SVG
      viewer.gen_svg(divDomSelector, world_state, actions, img_width, img_height)
    }
  }


  policy_comparison(viewer, domSelector) {

  }


}
