class CleanupToys {

    constructor(domSelect, boxes, toys, svg_helper_params) {

      this.config()

      this.boxes = boxes
      this.toys = toys

      this.BOX_LEN = svg_helper_params.world_width/boxes.length/2
      this.BOX_HEIGHT = svg_helper_params.world_height/5

      this.svg_helper = new SVGHelper(svg_helper_params)
      this.svg_canvas = this.svg_helper.createSVGCanvas(domSelect)

    }

    config() {
      this.BOX_DECORATION = {"stroke" : {"color": "#DD0"}, "fill" : "#835C3B"}
    }

    generate_svg() {

      for(let i = 0; i < this.boxes.length; i++) {

        var curr_box_data = this.boxes[i]

        curr_box_data.svgHandle = this.svg_helper.addRect(this.svg_canvas,
                          this.BOX_LEN, this.BOX_HEIGHT,
                          (2*i + 1)*this.BOX_LEN, this.BOX_HEIGHT/2,
                          0,
                          this.BOX_DECORATION)
      }
    }


}
