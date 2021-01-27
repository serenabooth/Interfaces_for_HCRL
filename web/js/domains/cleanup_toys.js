class CleanupToys {

    constructor(boxes, toys, robot) {
      //save the initial box & toy objects
      this.boxes = boxes
      this.toys_outside = toys
    }

    //===========< BEGIN fields >===============//

    //box size and decoration parameters
    static DECORATION_BOX= { /*"stroke" : {"color": "#835C3B"},*/ "fill" : "#835C3B"}
    static DECORATION_BOX_TEXT= { "stroke" : {"color": "white"}}
    static BOX_FRACTION_OF_WORLD_HEIGHT = 5

    //===========< END fields >===============//


    generate_svg(domSelect, svg_helper_params) {

      this.svg_helper = new SVGHelper(svg_helper_params)

      this.svg_canvas = this.svg_helper.createSVGCanvas(domSelect)

      this.generate_svg_boxes(this.svg_canvas, this.boxes)

      this.generate_svg_toys_outside(this.svg_canvas, this.toys_outside)

      //TODO: add the robot

    }

    /**
    Add the boxes to the top of the screen
    **/
    generate_svg_boxes(svg_canvas, box_list) {

      //width and height of individual boxes in world coordinates
      var BOX_WIDTH = this.svg_helper.world_width/box_list.length/2
      var BOX_HEIGHT = this.svg_helper.world_height/CleanupToys.BOX_FRACTION_OF_WORLD_HEIGHT

      //add the boxes to the top of the screen
      for(let i = 0; i < box_list.length; i++) {

        var curr_box_data = box_list[i]

        //put box elements inside an SVG group & save handle
        var svg_group = svg_canvas.group()
        curr_box_data.svg_handle = svg_group

        //create an SVG group with box elements
        this.svg_helper.addRect(svg_group,
                          BOX_WIDTH, BOX_HEIGHT,
                          BOX_WIDTH/2, BOX_HEIGHT/2,
                          0,
                          CleanupToys.DECORATION_BOX)

        this.svg_helper.addText(svg_group,
                                curr_box_data.name,
                                BOX_WIDTH/2, BOX_HEIGHT/2,
                                CleanupToys.DECORATION_BOX_TEXT)

        //move the SVG group to the box position
        var box_world_x = (2*i + 1)*BOX_WIDTH
        var box_world_y = BOX_HEIGHT/2
        this.svg_helper.centerSVGElem(svg_group, box_world_x, box_world_y)
      }
    }


    /**
    Add the toys to the room
    **/
    generate_svg_toys_outside(svg_canvas, toys_outside_list) {

      for(let i = 0; i < toys_outside_list.length; i++) {

        var curr_toy_data = toys_outside_list[i]

        //put toy elements inside an SVG group & save handle
        var svg_group = svg_canvas.group()
        curr_toy_data.svg_handle = svg_group

        //fill out the toy style
        var decoration = {}
        if( "fill" in curr_toy_data)
          decoration.fill = curr_toy_data.fill
        if( "stroke" in curr_toy_data)
          decoration.stroke = curr_toy_data.stroke
        if( "theta" in curr_toy_data == false)
          decoration.theta = 0

        //add the correct shape
        switch(curr_toy_data.shape) {
          case "circle" :
                          this.svg_helper.addCircle(
                            svg_group,
                            curr_toy_data.world_height,
                            curr_toy_data.world_x,
                            curr_toy_data.world_y,
                            decoration
                          )
                          break
          case "square" :
                          var theta = decoration.theta
                          this.svg_helper.addRect(
                            svg_group,
                            curr_toy_data.world_width,
                            curr_toy_data.world_height,
                            curr_toy_data.world_x,
                            curr_toy_data.world_y,
                            theta,
                            decoration
                          )
                          break
          case "triangle" :
                        var theta = decoration.theta
                        this.svg_helper.addTriangle(
                          svg_group,
                          curr_toy_data.world_width,
                          curr_toy_data.world_height,
                          curr_toy_data.world_x,
                          curr_toy_data.world_y,
                          theta,
                          decoration
                        )
                        break
          case "star" :
                        var theta = decoration.theta
                        this.svg_helper.addStar(
                          svg_group,
                          curr_toy_data.world_height,
                          curr_toy_data.world_x,
                          curr_toy_data.world_y,
                          theta,
                          decoration
                        )
                        break

        } //end switch

      } //for(let i = 0;

    }


}
