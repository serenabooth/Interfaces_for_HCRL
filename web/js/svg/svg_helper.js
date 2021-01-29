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
      if(world_x == null)
        return null

      var scale = this.img_width/this.world_width
      return world_x*scale
    }

    //converts world yPos into the SVG yPos
    calcSVGYpos(world_y) {
      if(world_y == null)
        return null

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
    addLine(svg_container, world_x1, world_y1, world_x2, world_y2, decoration) {
      //convert world to SVG coordinates
      var svg_x1 =  this.calcSVGXpos(world_x1)
      var svg_y1 =  this.calcSVGYpos(world_y1)
      var svg_x2 =  this.calcSVGXpos(world_x2)
      var svg_y2 =  this.calcSVGYpos(world_y2)

      var line = svg_container.line(svg_x1, svg_y1, svg_x2, svg_y2)

      this.decorateSVGElem(line,decoration)

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
      let that = this;
      let arms = 5
      let starPoints_w = this.calculateStarPoints(world_x, world_y, arms, radius_w*0.75, radius_w*0.5)

      //convert to image coordinates
      let starPoints_image = starPoints_w.map( function convertCoords(x_and_y_world_coords) {
        return [that.calcSVGXpos(x_and_y_world_coords[0]), that.calcSVGYpos(x_and_y_world_coords[1])]
      })

      //create polygon string as defined in https://svgjs.com/docs/3.0/shape-elements/#svg-polygon
      let starPolygonStr = ""
      for (let i in starPoints_image) {
        starPolygonStr += String(starPoints_image[i][0])
        starPolygonStr += ","
        starPolygonStr += String(starPoints_image[i][1])
        starPolygonStr += " "
      }

      let star = svg_container.polygon(starPolygonStr)
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

    /**
    Adds a triangle to the toy box
    **/
    addTriangle(svg_container, length_w, height_w, world_x, world_y, theta_degrees, decoration) {
      let that = this
        //calculate world positions of the points in the triangle
      let world_coords = [[world_x, world_y], [(world_x + length_w/2.0), (world_y + height_w/1.0)], [world_x+length_w/1.0, world_y]]
      let center = [that.calcSVGXpos(world_x + length_w/2.0), that.calcSVGYpos(world_y + height_w/2.0)]
      //convert world positions to svg positions
      let image_coords = world_coords.map( function convertCoords(x_and_y_world_coords) {
        return [that.calcSVGXpos(x_and_y_world_coords[0]), that.calcSVGYpos(x_and_y_world_coords[1])]
      })

      //create polygon string as defined in https://svgjs.com/docs/3.0/shape-elements/#svg-polygon
      let triPolygonStr = ""
      for (let i in image_coords) {
        triPolygonStr += String(image_coords[i][0])
        triPolygonStr += ","
        triPolygonStr += String(image_coords[i][1])
        triPolygonStr += " "
      }
      //add polygon to string & decorate
      let triangle = svg_container.polygon(triPolygonStr)
      triangle.rotate(theta_degrees, center[0], center[1])

      this.decorateSVGElem(triangle, decoration)
    }

    //==============< END Methods to draw SVG elements =================//

    //==============< BEGIN Methods to modify SVG elements =================//

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
    centerSVGElem(svg_elem, world_x,world_y, animation_args = null) {
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)

      if(animation_args == null)
        svg_elem.center(svg_x, svg_y)
      else
        svg_elem.animate(animation_args)
                .center(svg_x, svg_y)

    }

    rotateSVGElem(svg_elem, theta_degrees, world_x = null,world_y=null, animation_args = null) {
      var svg_x = this.calcSVGXpos(world_x)
      var svg_y = this.calcSVGYpos(world_y)

      if(animation_args == null)
        svg_elem.rotate( theta_degrees,
                          svg_x,
                          svg_y)
        else
          svg_elem.animate(animation_args)
                  .rotate( theta_degrees,
                            svg_x,
                            svg_y)


    }

  //==============< END Methods to modify SVG elements =================//

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
