/**
This class demos different UI features
**/
class UIDemos {

  //set default parameters
    constructor() {

        this.svg_helper_params =  {
          //height & width of an individual animation
          //NOTE: make sure the ratio of width/height is same for both img & world
          img_width: 300,     //in pixels
          img_height: 150,
          world_width: 600,   //in world coordinates
          world_height: 300,
          //decorating the room itself
          canvas_decoration : {"stroke" : {"color": "#EFEFEF","width":"1px"}, "fill" : "#EFEFEF"}
        }
    }

    /**
    The "main" function -
    let's try not to put any JS code in index.html
    **/
    run() {

      //initial list of boxes
      var boxes = [ {   name : "A", toys : {}},
                    {   name : "B", toys : {}},
                    {   name : "C", toys : {}}
                  ]

      //randomly generate initial list of toys
      var toys = []
      for(var i = 0; i < 15; i++) {
        var curr_toy = {}
        curr_toy.name = "Toy_"+i

        //toy design
        //TODO: make star and triangle shape
        curr_toy.shape = ["circle","square", "star", "triangle"][Util.genRandomInt(4)]
        curr_toy.fill = ["#09015F","#AF0069","#55B3B1"][Util.genRandomInt(3)]
        curr_toy.stroke = {"width":"2px", "color":["#09015F","#AF0069","#55B3B1"][Util.genRandomInt(3)]}
        //curr_toy.pattern = ["solid","stripes","polka dots"][Util.genRandomInt(2)]

        //box height & width in world coordinates
        curr_toy.world_width = "20"
        curr_toy.world_height = "20"

        //place the toy - make sure that it doesn't go off the screen
        curr_toy.world_x = curr_toy.world_width/2 + Util.genRandomInt(this.svg_helper_params.world_width - curr_toy.world_width)
        //height of boxes - used to make sure that toys are under boxes
        var box_height = this.svg_helper_params.world_height/CleanupToys.BOX_FRACTION_OF_WORLD_HEIGHT
        curr_toy.world_y = box_height + curr_toy.world_height/2 + Util.genRandomInt(this.svg_helper_params.world_height-box_height-curr_toy.world_width)

        toys.push(curr_toy)
      }

      var robot = {
        /*
          "base_effector_world_x" :
          "base_effector_world_y" :

          "end_effector_world_x" :
          "end_effector_world_y" :

          "object_in_gripper" :
        */
      }

      var cleanup_world = new CleanupToys(boxes, toys, robot)
      cleanup_world.generate_svg("#app",this.svg_helper_params)
    }


//===========< BEGIN Helper Functions >=============//



}
