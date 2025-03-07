let run_action = function(begin_point, action){

    let original_begin_point = action.begin_point
    let pre_action_list = action.pre_action_list

    d3.select('#main_canvas')
        .append('g')
        .attr('id', "action_cursor")
        .attr('transform', "translate(100, 100)")
        .append('image')
        .attr('href', "image/cursor_hand.svg")
        .attr('width', "30")

    pre_action_list.forEach(function(d, i){
        setTimeout(function(){
            if (d.type === "move_mark"){
                let current_coordinator = _chart_object[d.canvas_id].CoordSys[d.coordinate_id]
                let abs_mouse_point = {x: d.absolute_mouse_point.x + begin_point.x - original_begin_point.x, y: d.absolute_mouse_point.y + begin_point.y - original_begin_point.y}
                current_coordinator.simulate_drag_visual_element(d.status, d.move_vo_list, d.change_position, abs_mouse_point, d.relative_mouse_point, d.current_vo_id, 1000)
            }
            else if (d.type === "move_background"){
                move_background(d.change_position, 500)
            }
            else if (d.type === "change_scale"){
                console.log(d.canvas_id)
                console.log(_chart_object[d.canvas_id])
                let current_axis = _chart_object[d.canvas_id][d.axis_direction + "_axis_object_list"][d.axis_id]
                current_axis.simulate_update_scale(d)
            }
            else if (d.type === "delete"){
                let current_canvas = _chart_object[d.canvas_id]
                current_canvas.delete_current_canvas()
            }
            else if (d.type === "copy"){
                let current_canvas = _chart_object[d.canvas_id]
                current_canvas.copy_current_canvas()
            }
            else if (d.type === "reset"){
                let current_canvas = _chart_object[d.canvas_id]
                current_canvas.reset_current_canvas()
            }
            else if (d.type === "move_canvas"){
                let current_canvas = _chart_object[d.canvas_id]
                current_canvas.move_current_canvas(d)
            }
            action_list.push(d)
        }, i * 2000 + 2000)
    })
}