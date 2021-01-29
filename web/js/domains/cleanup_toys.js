class CleanupToys {

    constructor(boxes, toys, robot) {
      //save the initial box & toy objects
      this.boxes = boxes
      this.toys_outside = toys
      this.robot = robot
    }

    //===========< BEGIN fields >===============//

    //box size and decoration parameters
    static DECORATION_BOX= { /*"stroke" : {"color": "#835C3B"},*/ "fill" : "#835C3B"}
    static DECORATION_BOX_TEXT= { "stroke" : {"color": "white"}}
    static BOX_FRACTION_OF_WORLD_HEIGHT = 5

    //===========< END fields >===============//

    //===========< BEGIN state update methods >===============//

    //will move the base and keep the same theta
    move_base(robot, world_x, world_y, animation_args = null) {

      //update internal robot state
      this.robot.base_effector.world_x = world_x
      this.robot.base_effector.world_y = world_y

      //update SVG group
      this.svg_helper.centerSVGElem(robot.svg_handle, world_x,world_y, animation_args)

    }

    //change the theta
    rotate_base(robot, theta_degrees, animation_args = null) {
      //update internal robot state
      //this.svg_helper.rotateSVGElem()
      this.svg_helper.rotateSVGElem(robot.svg_handle, theta_degrees, robot.base_effector_r/2,65, animation_args)
      //update SVG group

    }

    pick_up_obj(robot, objName) {

    }

    //===========< END state update methods >===============//

    //===========< BEGIN SVG-related methods >===============//

    generate_svg(domSelect, svg_helper_params) {

      this.svg_helper = new SVGHelper(svg_helper_params)
      this.svg_canvas = this.svg_helper.createSVGCanvas(domSelect)

      this.generate_svg_boxes(this.svg_canvas, this.boxes)
      this.generate_svg_toys_outside(this.svg_canvas, this.toys_outside)
      this.generate_svg_robot(this.svg_canvas, this.robot)
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

    generate_svg_robot(svg_canvas, robot) {

      var svg_group = svg_canvas.group()
      robot.svg_handle = svg_group

      /*
      //arm goes from base effector to world effector
      //draw first so it's on the bottom layer
      var end_effector_world_x = robot.base_effector_world_x
      var end_effector_world_y = robot.base_effector_world_y + robot.arm_len
      var stiff_arm = this.svg_helper.addLine(svg_group,
                                              robot.base_effector_world_x,
                                              robot.base_effector_world_y,
                                              end_effector_world_x,
                                              end_effector_world_y,
                                              robot.arm_decoration)
      */

      //create the robot pieces at theta = 0 ( we will rotate later)
      var base = this.svg_helper.addRect(
        svg_group,
        robot.base_effector_r,
        robot.base_effector_r,
        robot.base_effector_world_x,
        robot.base_effector_world_y,
        0,        
        robot.base_effector_decoration
      )

      var end_effector = this.svg_helper.addCircle(
        svg_group,
        robot.end_effector_r,
        robot.base_effector_world_x ,
        robot.base_effector_world_y+robot.base_effector_r/2,
        robot.end_effector_decoration
      )


      //rotate the whole robot so the arm & end effector are in the right place
      this.svg_helper.rotateSVGElem(
                        svg_group,
                        robot.base_effector_theta_degrees,
                        robot.base_effector_world_x,
                        robot.base_effector_world_y )

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
