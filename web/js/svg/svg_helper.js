/**
Wrapper function for the SVG library in case we decide to switch

We currently are using SVG.js version 3.0
https://svgjs.com/docs/3.0/
**/
class SVGHelper {

    constructor(params) {
      //height & width in world coordinates
      this.world_width = params.world_width
      this.world_height = params.world_height

      //height and width in pixels
      this.img_width = params.img_width
      this.img_height = params.img_height

      //the outline & fill of the SVG canvas
      this.canvas_decoration = params.canvas_decoration
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
      var svg_container = Util.gen_empty_svg(dom_select, this.img_width, this.img_height)

      //create outline
      if(this.canvas_decoration != null)
        this.addRect(svg_container,
                          this.world_width, this.world_height,
                          this.world_width/2, this.world_height/2,
                          0,
                          this.canvas_decoration)

      return svg_container
    }

    /**
    Add a circle to the SVG
    **/
    addCircle(svg_container, world_r, world_x, world_y, decoration) {

      //convert world to SVG coordinates
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)
      var svg_r = this.calcSVGXpos(world_r)

      var circle = svg_container.circle(svg_r)
      circle.center(svg_x, svg_y)

      this.decorateSVGElem(circle, decoration)

      return circle
    }

    /**
    add a line to the SVG
    **/
    addLine(svg_container, world_x1, world_y1, world_x2, world_y2, svg_positions, decoration) {
      //convert world to SVG coordinates
      var svg_x1 =  this.calcSVGXpos(world_x1)
      var svg_y1 =  this.calcSVGXpos(world_y1)
      var svg_x2 =  this.calcSVGXpos(world_x2)
      var svg_y2 =  this.calcSVGXpos(world_y2)

      var line = svg_container.line(svg_x1, svg_y1, svg_x2, svg_y2)

      line.decorateSVGElem(decoration)

      return line
    }

    /**
    Add a rectangle to the SVG
    **/
    addRect(svg_container, length_w, height_w, world_x, world_y, theta_degrees, decoration) {

      //convert world to SVG coordinates
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)
      var svg_length = this.calcSVGXpos(length_w)
      var svg_height = this.calcSVGYpos(height_w)

      //create rectangle
      var rect = svg_container.rect(svg_length, svg_height)
      rect.center(svg_x, svg_y)
      rect.rotate(theta_degrees, svg_x, svg_y)

      this.decorateSVGElem(rect, decoration)

      return rect
    }

    /**
    Adds a star to the toy box
    **/
    addStar(svg_container, radius_w, world_x, world_y, theta_degrees, decoration) {

      var arms = 5
      var starPoints_w = this.calculateStarPoints(world_x, world_y, arms, radius_w, radius_w*0.75)

      //convert world coordinates into image coordinates


      //create polygon string as defined in https://svgjs.com/docs/3.0/shape-elements/#svg-polygon
      var starPolygonStr = ""

      var star = svg_container.polygon(svg_container, starPolygonStr)
      this.decorateSVGElem(star, decoration)
    }


    addText(svg_container, text, world_x,world_y,decoration,font_size = "10") {

      //convert world to SVG coordinates
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)

      var text_elem = svg_container.text(text)
      text_elem.center(svg_x,svg_y)

      this.decorateSVGElem(text_elem, decoration)
      text_elem.font("size",font_size)
    }


    addTriangle(svg_container, length_w, height_w, world_x, world_y, theta_degrees, decoration) {
      //calculate world positions of the points in the triangle

      //convert world positions to svg positions

      //create polygon string as defined in https://svgjs.com/docs/3.0/shape-elements/#svg-polygon

      //add polygon to string & decorate
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

    /**
    place the center of the svg element at the x,y coordinates
    **/
    centerSVGElem(svg_elem, world_x,world_y) {
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)

      svg_elem.center(svg_x, svg_y)
    }
  //==============< END Methods to draw SVG elements =================//

  //==============< BEGIN Methods to calculate shapes =================//



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
