let get_all_svg = function() {
	d3.selectAll('svg')
		.each(d=>{
			console.log(d, "???")
		})
		// .append('rect')
		// .attr("width", 100)
		// .attr('height', 100)
		// .attr('fill', "red")

	console.log('????')
}

document.body.appendChild(document.createElement('script')).src = 'localhost:8000/js/lib/d3v6.min.js';

get_all_svg()


// javascript:(function(){document.body.appendChild(document.createElement('script')).src='http://localhost:8000/js/get_svg.js';})();

// javascript:(function(){document.body.appendChild(document.createElement('script')).src = 'localhost:8000/js/lib/d3v6.min.js';document.body.appendChild(document.createElement('script')).src='http://localhost:8000/js/get_svg.js'; })();