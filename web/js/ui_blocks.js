
class UI_Blocks {


  // redrawCartpole(divId, cartpole, img_width, img_height, action) {
  //   $(divId).empty()
  //   cartpole.viewer.gen_img(divId, cartpole.getState(false), img_width, img_height, action)
  // }


  //https://stackoverflow.com/questions/29393064/reading-in-a-local-csv-file-in-javascript
  static enableFileUploader(uploaderDomId, handlerFunc, argObj) {
    var fileInput = document.getElementById(uploaderDomId),

        readFile = function () {
            var reader = new FileReader();
            reader.onload = function (readerEvt) {
              //alert(readerEvt.target.fileName)
              if(handlerFunc != null)
                handlerFunc(reader.result, argObj)
            };

            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsBinaryString(fileInput.files[0]);
        };

    fileInput.addEventListener('change', readFile);
  }


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
    }

  }

  /**
  @gridcell_domSelector dom selector of the div that contains the gridcell
  @animation_div_dom_id id of the div that contains the animation svg
  **/
  static clear_gridcell(gridcell_domSelector, animation_div_dom_id) {

    //remove contents of the cell ( animation & widgets)
    $(gridcell_domSelector).empty()

    //if the cell had an auto-advancing timeline, then make sure that it's stopped
    let widget_div_domSelect = "#"+UI_Blocks.get_animation_widget_div_id(animation_div_dom_id)
    if (widget_div_domSelect in window.cartpoleAnimHandles) {
      clearInterval(window.cartpoleAnimHandles[widget_div_domSelect])
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

        let widgetsDivId = UI_Blocks.get_animation_widget_div_id(animation_div_dom_id) //`${animation_div_dom_id}_widgets`
        $(containerDomSelect).append(`<div id="${widgetsDivId}"></div>`)

        //create svg inside the div & populate it
        var svgObj = Util.gen_empty_svg("#"+animation_div_dom_id, img_width, img_height)
        var viewer = cartpoleArray[0].viewer
        return viewer.populate_svg_simulations(svgObj, cartpoleArray, img_width, img_height, display_args,"#"+widgetsDivId)

      }

      static get_animation_widget_div_id(animation_div_dom_id) {
        let widgetsDivId = `${animation_div_dom_id}_widgets`
        return widgetsDivId
      }
  //===== END Grid Helper Functions ======//


}
