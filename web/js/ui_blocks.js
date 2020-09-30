
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

        cartpole.viewer.populate_svg_simulation(svgObj, cartpole, img_width, img_height, display_args)
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

        let widgetsDivId = `${animation_div_dom_id}_widgets`
        $(containerDomSelect).append(`<div id="${widgetsDivId}"></div>`)

        //create svg inside the div & populate it
        var svgObj = Util.gen_empty_svg("#"+animation_div_dom_id, img_width, img_height)
        cartpole.viewer.populate_svg_simulation(svgObj, cartpole, img_width, img_height, display_args,"#"+widgetsDivId)

      }

  //===== END Grid Helper Functions ======//

  policy_comparison(viewer, domSelector) {

  }


}
