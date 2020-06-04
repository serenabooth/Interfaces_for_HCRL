class UI_Blocks {

  /**
  populates a grid of random states
  **/
  state_grid(viewer, domSelector, numRows, numCols, world_state_list = null, action_list = null, animation_args = null, num_timesteps_to_show = 1) {
    var img_width = 300, img_height = 100

    for(let i = 0; i < numRows*numCols; i++) {
      if(world_state_list != null) {
          var world_state = world_state_list[i]
      } else {
          //populate grid cell with random state
          var world_state = viewer.gen_random_state()
      }

      if(action_list != null)
        var curr_action = action_list[i]
      else
        //select a random action for the gridcell
        var curr_action = viewer.gen_random_action()

      //create new div for the grid cell
      let domId = "drawing-"+i;
      //round decimal places for display
      let roundedStateVals = this.roundElems(world_state,2)
      let gridTxt = `x: (${roundedStateVals[0]},${roundedStateVals[1]}) , th: (${roundedStateVals[2]},${roundedStateVals[3]})`
      $(domSelector).append(`<div id="${domId}" class="tooltip lightgrey">${gridTxt}</div>`)

      viewer.gen_svg("#"+domId, world_state, curr_action, img_width, img_height,animation_args,num_timesteps_to_show)

    }
  }

  cluster_grid(viewer, domSelector, states) {
    console.log(states)
    var numRows = 4;
    var numCols = 4; //this is set up in the CSS... TODO - try to make dynamic
    var img_width = 300, img_height = 100

    for(let i = 0; i < states.length; i++) {

      var pos = i % numCols
      console.log(pos)
      //populate grid cell with random state
      var random_state = viewer.set_random_state()
      viewer.update_state(states[i])
      // random_state.update_state(states[i])
      //select a random action for the gridcell
      var random_actions = viewer.gen_random_actions()

      //create new div for the grid cell
      let domId = "drawing-"+i;
      $(domSelector).append(`<div id="${domId}" class="tooltip">${i}</div>`)

      viewer.gen_svg("#"+domId, random_actions, img_width, img_height)
    }
  }


  //return formatted text list of states
  state_text(stateArr) {
    let stateTxt = []
    for(let s of stateArr)
      stateTxt.push(`[${s}]`)
    return stateTxt
  }
  //truncates each float in the array and returns  new array
  roundElems(floatArr, numDecPlaces) {
    let roundedArr = []
    for(let f of floatArr)
      roundedArr.push(f.toFixed(numDecPlaces))
    return roundedArr
  }


  /**
  populates a timeline given run results
  **/
  timeline(viewer, domSelector, runData, numCells = 5, allowActionChange = true) {

    var img_width = 200, img_height = 100

    //pop off header row
    var headers = runData.shift()
    //slider should go from [0, maxStartT]
    let maxStartT = runData.length - numCells
    //col # of action in the simulation run data
    var index_action = runData[0].length - 1

    //create 1xn w/ first n timestemps of the run
    var timelinegrid_id = domSelector.slice(1)+"_grid"
    var timeline_gridcell_ids = []
    var timeline_gridcell_click_handlers = []

    //create CSS that sets the row length
    let css = "grid-template-columns:"
    for(let i = 0; i < numCells; i++)
      css += " auto"

    //create containing div for the grid cell
    $(domSelector).append(`<div id="${timelinegrid_id}" class="grid-container" style="${css}"></div>`)

    //create each gridcell & populate w/ SVG
    for(let i = 0; i < numCells; i++) {

      //save divId for later
      let divId = `${timelinegrid_id}-drawing-${i}`
      timeline_gridcell_ids.push(divId)

      //create gridcell div
      $("#"+timelinegrid_id).append(`<div id="${divId}" class="tooltip" data-gridcellindex="${i}", data-t="", data-cellstate=""></div>`)

      //flll grid w/ world state SVG at time i
      updateTimelineGrid(i, runData, divId)

      //add a click event to allow user to toggle the action taken for the state
      if(allowActionChange)
        $("#"+divId).click(function () {
          let t = parseInt($(this).attr("data-t"))
          let cell_state = JSON.parse(($(this).attr("data-cellstate")))
          cell_state[index_action] = cell_state[index_action] ? 0 : 1
          updateTimelineGrid(t, runData, $(this).attr("id"), cell_state)
        })
    }

    //create timeline slider for this run
    let griderSliderId = timelinegrid_id+"_slider"
    $(domSelector).append(`<div style="width:80%;margin:auto;padding-top:2em"><input type="range" min="0" max="${maxStartT}" value="0" class="slider" id="${griderSliderId}" data-show-value="true"></div>`)

    //create event that updates timeline grids upon slider change
    //$( `#${griderSliderId}` ).change(function() {
    $(`#${griderSliderId}`).on('input', function() {

      let currStartT =  $( this ).val()
      for(let i = 0; i < numCells; i++) {
        let divId = timeline_gridcell_ids[i]
        updateTimelineGrid(i + parseInt(currStartT), runData, divId)
      }
    });

    //update specified gridcell with world state + action at time t
    function updateTimelineGrid(t, runData, divId, changedData_t = null) {

      let divDomSelector = `#${divId}`

      //reset div
      $(divDomSelector).empty()
      $(divDomSelector).css("background","")

      //get timeslice data from simulation
      var world_state = runData[t].slice(0,-1)
      var actions = {"push_cart" : runData[t][ index_action]}
      var run_cell_state_different = false

      //store sim data in the attributes
      $(divDomSelector).attr("data-t", t)
      let gridcellIndex = $(divDomSelector).attr("data-gridcellindex")

      //check to see whether we're displaying data that's different from timeslice
      if(changedData_t != null) {
        //highlight cells where it's display something different than sim state / action
        run_cell_state_different = !(changedData_t.join("::") === runData[t].join("::"))
        if( run_cell_state_different ) {
          world_state = changedData_t.slice(0,-1)
          actions = {"push_cart" : changedData_t[index_action]}
          $("#"+divId).css("background","#EEE")
        }
        //save the state
        $(divDomSelector).attr("data-cellstate", JSON.stringify(changedData_t))

      } else
        $(divDomSelector).attr("data-cellstate", JSON.stringify(runData[t]))



      //add curr time
      $(divDomSelector).append(`<span>${t}</span>`)
      console.log("timeline")
      //add the SVG
      viewer.gen_svg(divDomSelector, world_state, actions, img_width, img_height)
    }
  }


  policy_comparison(viewer, domSelector) {

  }

}
