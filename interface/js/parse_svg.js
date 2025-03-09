function parse_svg()
{

	let current_svg = d3.select('svg')
	console.log('parse svg success')
	calculate_svg(current_svg)
}


parse_svg()


function calculate_svg(current_svg){

	let size = current_svg.node().getBoundingClientRect()
	console.log('the size of the svg', size)
	svg_width = size.width
	svg_height = size.height

	if (current_svg.attr('width') === null && current_svg.attr('height') === null && current_svg.attr("viewBox") !== null)
	{
		console.log("?????????")
		viewBox = current_svg.attr('viewBox')
		view_box_list = viewBox.split(',')
		if (view_box_list.length === 4){
			current_svg.attr("width", view_box_list[2]) 
			current_svg.attr("height", view_box_list[3])
		}
		else if (view_box_list.length === 1){
			view_box_list = viewBox.split(' ').filter(d => d !== "")
			current_svg.attr("width", view_box_list[2])
			current_svg.attr("height", view_box_list[3])
		}
	}

	current_svg
		.attr('width', svg_width)
		.attr('height', svg_height)

	if (current_svg.attr('width') !== null && current_svg.attr('height') !== null && current_svg.attr("viewBox") === null)
	{
		current_svg.attr('viewBox', "0 0 " + svg_width + " " + svg_height)
	}

	// svg_width = parseFloat(current_svg.attr("width"))
	// svg_height = parseFloat(current_svg.attr('height'))

	let deal_type = ['rect', 'path', 'line', 'circle', 'svg', 'text']
	
	console.log(current_svg.selectAll("rect"))

	current_svg.attr('transform_matrix', function(d){
		let matrix = d3.select(this).node().getScreenCTM()
		let matrix_new = {a: matrix.a, b:matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f}

		// console.log(d_type, JSON.stringify(matrix_new))
		return JSON.stringify(matrix_new)
	})

	current_svg.selectAll('rect')
		.attr('bbox_new', function(d){
			let r = d3.select(this).node().getBoundingClientRect()
			d3.select(this)
				.attr('real_x', r.x)
				.attr('real_y', r.y)
				.attr('real_width', r.width)
				.attr('real_height', r.height)

		})

	deal_type.forEach(function(d_type){
		console.log(d_type)
		current_svg.selectAll(d_type)
			.attr('transform_matrix', function(d){
				let matrix = d3.select(this).node().getScreenCTM()
				let matrix_new = {a: matrix.a, b:matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f}

				// console.log(d_type, JSON.stringify(matrix_new))
				return JSON.stringify(matrix_new)
			})
	})

	current_svg.selectAll('rect')
		.each(function(d){
			let computedStyle = getComputedStyle(d3.select(this).node())
			// console.log('computedStyle', computedStyle)
			d3.select(this)	
				.attr('fill', computedStyle['fill'])
				.attr('opacity', computedStyle['opacity'])
				.attr('stroke', computedStyle['stroke'])
				.attr('stroke-width', computedStyle['stroke-width'])
				.attr('stroke-opacity', computedStyle['stroke-opacity'])
			// return getComputedStyle(d3.select(this).node())['fill']
		})


	current_svg.selectAll('text')
		.attr('text_bbox', function(d){
			let bbox = d3.select(this).node().getBBox()
			let bbox_new = {x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height}
			return JSON.stringify(bbox_new)
		})
		.each(function(d){
			let computedStyle = getComputedStyle(d3.select(this).node())

			// console.log('path compuated style', computedStyle)
			d3.select(this)
				.style('font-family', computedStyle['font-family'])
				.attr('my_stoke', computedStyle['stroke'])
				.attr('my_stoke_width', computedStyle['stroke-width'])
				.attr('my_stoke_opacity', computedStyle['stroke-opacity'])
				.attr('my_fill', computedStyle['fill'])
				.attr('my_fill_opacity', computedStyle['fill-opacity'])
				.attr('my_font_size', computedStyle['font-size'])
				.attr('opacity', computedStyle['opacity'])
				.attr('fill', computedStyle['fill'])
			})

		// .style('font-family', function(d){
		// 	return getComputedStyle(d3.select(this).node())['font-family']
		// })
		// .attr('my_fill', function(d){
		// 	return getComputedStyle(d3.select(this).node())['fill']
		// })
		// .attr('my_font_size', function(d){
		// 	return getComputedStyle(d3.select(this).node())['font-size']
		// })

	current_svg.selectAll('path')
		.each(function(d){
			let computedStyle = getComputedStyle(d3.select(this).node())

			// console.log('path compuated style', computedStyle)
			d3.select(this)
				.style('font-family', computedStyle['font-family'])
				.attr('my_stoke', computedStyle['stroke'])
				.attr('my_stoke_width', computedStyle['stroke-width'])
				.attr('my_stoke_opacity', computedStyle['stroke-opacity'])
				.attr('my_fill', computedStyle['fill'])
				.attr('my_fill_opacity', computedStyle['fill-opacity'])
				.attr('my_font_size', computedStyle['font-size'])
				.attr('opacity', computedStyle['opacity'])
				.attr('fill', computedStyle['fill'])
			})

	send_data = {data: current_svg.node().outerHTML, name: "current.svg"}
	// console.log(send_data.data)
	return send_data

}
