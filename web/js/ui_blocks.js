
class UI_Blocks {


  // redrawCartpole(divId, cartpole, img_width, img_height, action) {
  //   $(divId).empty()
  //   cartpole.viewer.gen_img(divId, cartpole.getState(false), img_width, img_height, action)
  // }



  /**
  Creates a grid of cartpole animations - simulations should have been run before calling this

  @gridDivDomSelector: the div that contains the grid
  @numRows : number of rows in the grid
  @numCols : number of columns in the grid
  @cartpole_array: array of cartpoles. Each cartpole should be set to the desired state to display
  @cartpole_display_args: an object containing arguments that configure animations
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
      this.create_animation_in_dom_elem("#"+divId, animation_div_dom_id, cartpole, display_args.img_width, display_args.img_height, display_args)

      //insert counterfactual simulation animation
      //if(display_args.include_cfs)
        //this.create_animation_in_dom_elem(gridCellDomSelect, animation_div_dom_id+"_cf", cartpole, cf_sim_run_results, display_args.img_width , display_args.img_height, display_args.animation_args)

    }

  }

  /**
  Creates a single cartpole- simulations should have been run before calling this

  @gridDivDomSelector: the div that contains the grid
  @cartpole: a cartpole object
  @divId: string. Set this to prevent collisions when producing the grid.
  @display_args: an object containing arguments that configure animations
  **/
  static single_cartpole(gridDivDomSelector, cartpole, divId, display_args) {
      //create div for the cart's gridcell
      $(gridDivDomSelector).append(`<div id="${divId}"></div>`)

      //insert simulation animation
      var animation_div_dom_id = "drawing-"+divId;
      this.create_animation_in_dom_elem("#"+divId, animation_div_dom_id, cartpole, display_args.img_width, display_args.img_height, display_args)
  }
  /**
  TODO:Comment
  **/
  static animate_from_trace(cartpoleDiv, cartpole, sim_trace, display_args) {
      var animation_div_dom_id = "drawing-"+cartpole.id;
      this.create_animation_in_dom_elem(cartpoleDiv, animation_div_dom_id, cartpole, display_args.img_width, display_args.img_height, display_args)
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
      static create_animation_in_dom_elem(containerDomSelect, animation_div_dom_id, cartpoleObjOrArray, img_width, img_height, display_args) {

        //if cartpole is an object, then convert to array
        let cartpoleArray = Array.isArray(cartpoleObjOrArray) ? cartpoleObjOrArray : [cartpoleObjOrArray]
        //create animation's div
        $(containerDomSelect).append(`<div id="${animation_div_dom_id}"></div>`)

        let widgetsDivId = `${animation_div_dom_id}_widgets`
        $(containerDomSelect).append(`<div id="${widgetsDivId}"></div>`)

        //create svg inside the div & populate it
        var svgObj = Util.gen_empty_svg("#"+animation_div_dom_id, img_width, img_height)
        cartpoleArray[0].viewer.populate_svg_simulations(svgObj, cartpoleArray, img_width, img_height, display_args,"#"+widgetsDivId)

      }

  //===== END Grid Helper Functions ======//


}
