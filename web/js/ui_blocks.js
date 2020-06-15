
class UI_Blocks {

  /**
  Creates an animation a cartpole state & a simulated policy
  **/
  create_grid_animation(containerDomSelect, animation_div_dom_id, cartpole, sim_run, img_width, img_height, animation_args, num_timesteps_to_show) {

    //get simulation results
    let action = sim_run["action"]
    var next_state = sim_run["next"]
    var future_state = sim_run["future"]

    //create animation's div
    $(containerDomSelect).append(`<div id="${animation_div_dom_id}"></div>`)

    //create svg inside the div
    cartpole.viewer.gen_svg("#"+animation_div_dom_id, cartpole.getState(false), action, next_state, future_state, img_width, img_height,animation_args,num_timesteps_to_show)
  }

  /**
  Creates a table of state values
  **/
  create_grid_animation_txt(cartpole, sim_run,cf_sim_run = null) {

    //create SVG of original action w/ text labels
    let table_header =  "<tr><th>x</th><th>x_dot</th><th>theta</th><th>theta_dot</th><th>Degen?</th><th></th></tr>"
    let orig_state_txt = cartpole.toString(null,true,["", "Orig"])

    //create row for future state
    var future_state = sim_run["future"]
    var degenerate_state_label = sim_run["degenerate"] ? "Y" : ""
    let future_state_txt = cartpole.toString(future_state,true,[degenerate_state_label,"Future"])

    //create row for cf future state
    let cf_future_state_txt = ""
    if(cf_sim_run) {
      future_state = cf_sim_run["future"]
      degenerate_state_label = cf_sim_run["degenerate"] ? "Y" : ""
      cf_future_state_txt = cartpole.toString(future_state,true,[degenerate_state_label, "cf_future"])

    }

    let tableHTML = `<table class="lightgrey" style="margin:auto;text-align:center">${table_header}${orig_state_txt}${future_state_txt}${cf_future_state_txt}</table>`
    return tableHTML
  }

  /**
  populates a grid of random states
  **/
  state_grid(divDomSelector, numRows, numCols, cartpole_array, policy = null, animation_args = null, include_cfs = true, num_timesteps_to_show = 1) {
    var img_width = 300, img_height = 100

    //create a gridcell for each cartpole
    for(let i = 0; i < numRows*numCols; i++) {

      //check to see whether we have enough cartpoles
      if(i > cartpole_array.length) {
        console.log("ui_blocks.state_grid(): Not enough cartpoles for the number of grid cells")
        return
      }

      let cartpole = cartpole_array[i]

      //create div for the cart's gridcell
      let divId = `cart_${i}`
      $(divDomSelector).append(`<div id="${divId}"></div>`)

      //simulate from original action
      var curr_action = cartpole.getAction(policy)
      let sim_run_results = cartpole.simulate(curr_action,num_timesteps_to_show)

      //simulate counterfactual action
      let cf_sim_run_results = null
      if(include_cfs) {
        //simulate from counterfactual
        curr_action = cartpole.getCounterFactualAction(curr_action)
        cf_sim_run_results = cartpole.simulate(curr_action,num_timesteps_to_show)
      }

      //insert table of state values
      let tableHTML = this.create_grid_animation_txt(cartpole, sim_run_results , cf_sim_run_results)
      $("#"+divId).append(tableHTML)

      //insert simulation animation
      var animation_div_dom_id = "drawing-"+i;
      this.create_grid_animation("#"+divId, animation_div_dom_id, cartpole, sim_run_results, img_width , img_height, animation_args)

      //insert counterfactual simulation animation
      if(include_cfs)
        this.create_grid_animation("#"+divId, animation_div_dom_id+"_cf", cartpole, cf_sim_run_results, img_width , img_height, animation_args)

    }

  }

  /**
  populates a timeline given run results

  TODO: may not be working anymore after all the animation updates
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
    //TODO: may not be working anymore after all the animation updates

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
