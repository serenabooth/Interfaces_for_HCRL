class SVGHelper {

    constructor(params) {

      this.world_width = params.world_width
      this.world_height = params.world_height
      this.img_width = params.img_width
      this.img_height = params.img_height
      this.outline_canvas = params.outline_canvas
    }

    //==============< BEGIN Methods to calculate SVG positions =================//

    //converts cartpole xPos into the SVG xPos
    calcSVGXpos(world_x) {
      var scale = this.img_width/this.world_width
      return world_x*scale
    }

    //converts world yPos into the SVG yPos
    calcSVGYpos(world_y) {
      var scale = this.img_height/this.world_height
      return world_y *scale
    }

    //==============< END Methods to calculate SVG positions =================//

    //==============< BEGIN Methods to create SVG elements =================//

    /**
    TODO: move this method from Util to here
    **/
    createSVGCanvas(dom_select) {
      //create canvas
      var svg_canvas = Util.gen_empty_svg(dom_select, this.img_width, this.img_height)

      //create outline
      if(this.outline_canvas != null)
        this.addRect(svg_canvas,
                          this.world_width, this.world_height,
                          this.world_width/2, this.world_height/2,
                          0,
                          this.outline_canvas)

      return svg_canvas
    }

    /**
    Add a circle to the SVG
    **/
    addCircle(svg_canvas, world_r, world_x, world_y, decoration) {
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)
      var svg_r = this.calcSVGXpos(world_r)

      var circle = svg_canvas.circle(svg_r).fill(fillColor)
      circle.center(svg_x, svg_y)

      this.decorateSVGElem(circle, decoration)

      return circle
    }

    /**
    add a line to the SVG
    **/
    addLine(svg_canvas, world_x1, world_y1, world_x2, world_y2, svg_positions, decoration) {
      var svg_x1 =  this.calcSVGXpos(world_x1)
      var svg_y1 =  this.calcSVGXpos(world_y1)
      var svg_x2 =  this.calcSVGXpos(world_x2)
      var svg_y2 =  this.calcSVGXpos(world_y2)

      var line = svg_canvas.line(svg_x1, svg_y1, svg_x2, svg_y2)

      line.decorateSVGElem(decoration)

      return line
    }

    /**
    Add a rectangle to the SVG
    **/
    addRect(svg_canvas, length_w, height_w, world_x, world_y, theta_degrees, decoration) {

      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)
      var svg_length = this.calcSVGXpos(length_w)
      var svg_height = this.calcSVGYpos(height_w)

      //create rectangle
      var rect = svg_canvas.rect(svg_length, svg_height)
      rect.center(svg_x, svg_y)
      rect.rotate(theta_degrees, svg_x, svg_y)

      this.decorateSVGElem(rect, decoration)

      return rect
    }


    addText(svg_canvas, text, world_x,world_y,font_size = "10", decoration) {

      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)

      var text_elem = svg_canvas.text(text)
      text_elem.center(svg_x,svg_y)

      this.decorateSVGElem(text_elem, decoration)
      text_elem.font("size",font_size)

    }
    /**
    Adds a polygon to the canvas
    **/
    draw_polygon(svg_canvas, world_coords_list, decoration) {
      var polygon = svgObj.polygon(`${svg_positions.arrow.x},${svg_positions.arrow.y_top},${svg_positions.arrow.x},${svg_positions.arrow.y_bottom}, ${svg_positions.arrow.point_x},${svg_positions.arrow.y_mid}`).fill('rgb(255,0,0)')

    }


    /**
    Apply styling elements to the svg elements
    **/
    decorateSVGElem(svgElem, decoration) {

      if(decoration == null)
        return

      //has: color
      if("fill" in decoration) {
        svgElem.fill( decoration.fill )
      }

      //has: color, width, dasharray
      if("stroke" in decoration) {
        svgElem.stroke( decoration.stroke )
      } else {
        svgElem.stroke({ color: 'black', width: 1 })
      }
    }

  //==============< END Methods to draw SVG elements =================//

  //==============< BEGIN Methods to calculate shapes =================//


  /**
  calculate polygon points to form a triangle
  **/
  calculateTrianglePoints(world_x, world_y, world_len_of_side) {

  }

  /**
  calculates the polygon points to form a star
  //https://dillieodigital.wordpress.com/2013/01/16/quick-tip-how-to-draw-a-star-with-svg-and-javascript/
  */
  calculateStarPoints(world_x, world_y, arms, outerRadius, innerRadius) {

    var point_array_world_coords = []

     var angle = Math.PI / arms;

     for (var i = 0; i < 2 * arms; i++) {
        // Use outer or inner radius depending on what iteration we are in.
        var r = (i & 1) == 0 ? outerRadius : innerRadius;

        var currX = world_x + Math.cos(i * angle) * r;
        var currY = world_y + Math.sin(i * angle) * r;

        point_array_world_coords.push([currX, currY])
     }

     return point_array_world_coords;
  }

  //==============< END Methods to calculate shapes =================//

}
