d3.csv("data/data.csv").then(function(datapoints) {

    // Keeps only the state information
    datapoints = datapoints.filter(d => !d.city & d.confirmed >= 1);

    // Keep only data with at least one recorded case

    // get total br cases
    let brTotal = 0;
    for (let datum of datapoints) {

    	if (datum.is_last == "True") {

    		brTotal += +datum.confirmed;

    	}
    }


    // Groupby
    let nested = d3.nest()
    	.key(d => d.state)
    	.entries(datapoints);

    // Calculates how many days have passed since first case
    // for each datapoint in each state
    for (let state of nested) {

    	let stateData = state.values;

    	let outbreakDate = stateData[stateData.length - 1].date;
    		outbreakDate = new Date(outbreakDate);

    	// console.log("State:", stateData, "outbreakDate:", outbreakDate);

    	for (let datum of stateData) {

    		let currentDate = new Date(datum.date);

    		let diff = currentDate.getTime() - outbreakDate.getTime();
            	diff = diff / (1000 * 3600 * 24) // Milliseconds to days
    	
    		datum["days_since_outbreak"] = diff;

    	}


    }


    // Adds listeners so when the user clicks a button
    // or changes selection, the thing is redrawn

    // 1. Selector listener
    function handleSelect() {

    	let opt = selector.options[selector.selectedIndex];
    	
    	stateId = opt.value;
    	stateName = opt.text;

    	// console.log("stateId:", stateId, "stateName:", stateName);

    }

    let selector = document.querySelector(".monitor-select");
    selector.addEventListener("change", function() {

    	handleSelect();
    	drawInteractiveMonitor();

    })

    // 2. Buttons listener
    function handleButton(clickedButton) {

    	// Select the two buttons
    	let buttons = document.querySelectorAll(".monitor-button");

    	for (let button of buttons) {

    		// If the button is not selected, select it
    		if (!button.classList.contains("monitor-button-selected")) {
    			
    			button.classList.add("monitor-button-selected");

    		}

    		// If it was selected, deselect id
    		else {

    			button.classList.remove("monitor-button-selected");

    		}

    	}

    	// Selects the data-value attribute on the clicked button
    	value = clickedButton.dataset.value;

    }


    let buttons = document.querySelectorAll(".monitor-button")

    for (let button of buttons) {

    	button.addEventListener("click", function() {

    		handleButton(this);
    		drawInteractiveMonitor();

    	})

    }

    // Sets the first viz to be São Paulo, total cases
    let stateId = "SP";
    let stateName = "São Paulo";
    let value = "total";

    // Also sets the selector to SP
    selector.value = "SP";

    // Then draws the chart

    function drawInteractiveMonitor() {
    	/* This function draws the interactive monitor using
    	d3.js */

    	/////////////////////////
    	// AUXILIARY FUNCTIONS //
    	/////////////////////////

    	function isMobile() {
    	  /*
    	  This function detects if the screen
    	  of the device is mobile (width smaller than
    	  800). It returns `true`` if positive,
    	  `false` if negative.
    	  */
    	  if(window.innerWidth <= 600) {

    	     return true;

    	  } // End of if

    	  else {

    	     return false;

    	  } // End of else

    	} // End of isMobile()


    	// Selects data for the state
    	let stateData = nested.filter(d => d.key == stateId);

    	// Removes the chart to clean the div
        d3.select('#main-chart')
          .remove();


    	// Adds the svg

    	if (isMobile()) {

    		var margin = { top: 10, left: 42, right: 22, bottom: 50},
    		    height = 300 - margin.top - margin.bottom,
    		    width = window.innerWidth * 0.80 - margin.left - margin.right;

    	}

    	else {

    		var margin = { top: 10, left: 50, right: 50, bottom: 22},
    		    height = 300 - margin.top - margin.bottom,
    		    width = 580 - margin.left - margin.right;

    	}

    	let chart = d3.select(".monitor-chart-wrapper")
    					.append("svg")
    					.attr("class", "svg-chart")
    					.attr("id", "main-chart")
    					.attr("height", height + margin.top + margin.bottom)
    		            .attr("width", width + margin.left + margin.right)
    		            .append("g")
    		            .attr("transform", `translate(${margin.left},${margin.top})`)



        // Adds the line generators and scales

        // Days passed since the first day avaliable in the data to today
       	let casesStart =  new Date("2020-02-26");
        let xMax = Date.now() - casesStart.getTime();
            xMax = xMax / (1000 * 3600 * 24) + 1; // Milliseconds to days

        let xPositionScale = d3.scaleLinear()
          .domain([ 0, xMax ]) 
          .range([0, width]);

        if (value == "total") {

            var yPositionScale = d3.scaleLog()
              .domain([1, 10000]) // From 1 to 10,000 cases
              .range([ height, 0 ]);

        }

        else {

            var yPositionScale = d3.scaleLog()
              .domain([.001, 100]) // From 1 to 100 cases / 100 k people
              .range([ height, 0 ]);

        }


        let lineGenerator = d3.line()
            .x(function(d) {
              return xPositionScale(+d.days_since_outbreak);
            })
            .y(function(d){

            	if (value == "total") {

              		return yPositionScale(+d.confirmed);

            	}

              	else if (value == "ratio") {

              		return yPositionScale(+d.confirmed_per_100k_inhabitants);

              	}
            })
            .curve(d3.curveStep);


        // Adds the line
        chart.selectAll("line")
        	 .data(stateData)
        	 .enter()
        	 .append("path")
        	 .attr("class", "state-line")
        	 .attr("fill", "none")
        	 .style("stroke-width", 3)
        	 .style("stroke", "#b6292f")
        	 .attr("d", function(d) {
    	    	 	// console.log(lineGenerator(d.values));
    	    	 	return lineGenerator(d.values);
    	    	 } );


        // Adds a point to each position of the line
        let data = (stateData[0].values);
        chart.selectAll("circle")
        	.data(data)
        	.enter()
        	.append("circle")
        	.attr("class", "dot")
        	.attr("cx", d => xPositionScale(+d.days_since_outbreak))
        	.attr("cy", d => (value == "total") ? yPositionScale(+d.confirmed) : yPositionScale(+d.confirmed_per_100k_inhabitants))
        	.attr("r", 3)
        	.attr("fill", "red");

        // Adds axis
        let xAxis = d3.axisBottom(xPositionScale)
              .tickValues([1, 10, 20, 30])
              .tickFormat(function(d) {

              	if (d == 1) {

              		return  d + 'º dia'

              	}

              	else {

              		return  d + 'º'

              	}


              });

        let xAxisHolder = chart.append("g")
             .attr("class", "x-axis")
             .attr("fill", "black")
             .attr("transform", `translate(0,${height + 5})`)
             .call(xAxis);

        xAxisHolder.select(".domain") // Selects the axis vertical line...
                .remove()       // ...and removes it

        xAxisHolder.selectAll(".x-axis .tick text")
          .attr("class", "ordinary-tick");


       	let yAxisTicks = [ ]

       	if (value == "total") {

       		yAxisTicks = [1, 10, 100, 1000, 10000];

       	}

       	else if (value == "ratio") {

       		yAxisTicks = [.001, .01, .1, 1, 10, 100]

       	}

       	// Adds axis
        let yAxis = d3.axisLeft(yPositionScale)
            .tickValues(yAxisTicks)
            .tickSize(0 - width) // Make the ticks occupy the whole svg, left to right
            .tickFormat(function(d) {

    			if (d >= 1000) {

    				return d / 1000 + " mil";

    			}


    			else {

    				return d;

    			}

             });

        let yAxisHolder = chart.append("g")
             .attr("class", "y-axis")
             .attr("fill", "black")
             .attr("transform", "translate(-1,0)")
             .call(yAxis);

        yAxisHolder.select(".domain") // Selects the axis vertical line...
                .remove()       // ...and removes it


    		chart.selectAll(".tick line")
      		.attr("stroke", "#777") // Styling the ticks - color
      		.attr("stroke-dasharray", "2,3"); // Styling the ticks - dot size

    	if (value == "total") {

    		var label = "casos";

    	}

    	else if (value == "ratio") {

    		var label = "casos por";
    		var labelB = "100 mil";


    	}

        // Adds a explanation to the first label
        let yTicks = yAxisHolder.selectAll(".tick")
        	.each(function(d){

        		if ( (d == 10000 & value == "total") || (d == 100 & value == "ratio") ) {

    	    		let element = d3.select(this);
    	    		let elementLabel = element.select("text");

    	    		element.append("text")
    	    			.text(label)
    	    			.attr("x", elementLabel.attr("x"))
    	    			.attr("dy", 15)
    	    			.attr("fill", "currentColor")
    	    			.attr("class", "tick-label");

    	    		element.append("text")
    	    			.text(labelB)
    	    			.attr("x", elementLabel.attr("x"))
    	    			.attr("dy", 25)
    	    			.attr("fill", "currentColor")
    	    			.attr("class", "tick-label");

        		}


        })

        	// Updates the informative text
        	let corresp = {

    	        "AL":"Alagoas",
    	        "AP":"Amapá",
    	        "AM":"Amazonas",
    	        "BA":"Bahia",
    	        "CE":"Ceará",
    	        "DF":"Distrito Federal",
        		"AC":"Acre",
    	        "ES":"Espírio Santo",
    	        "GO":"Goiás",
    	       	"MA":"Maranhão",
    	        "MT":"Mato Grosso",
    	        "MS":"Mato Grosso do Sul",
    	        "MG":"Minas Gerais",
    	        "PA":"Pará",
    	        "PB":"Paraíba",
    	        "PR":"Paraná",
    	        "PE":"Pernambuco",
    	        "PI":"Piauí",
    	        "RJ":"Rio de Janeiro",
    	        "RN":"Rio Grande do Norte",
    	        "RS":"Rio Grande do Sul",
    	        "RO":"Rondônia",
    	        "RR":"Roraima",
    	        "SC":"Santa Catarina",
    	        "SP":"São Paulo",
    	        "SE":"Sergipe",
    	        "TO":"Tocantins",

        	}

        	// State
        	d3.select(".monitor-dynamic.state")
        		.html(d => corresp[stateData[0].key]);

        	// Date
        	d3.select(".monitor-dynamic.date")
        		.html(function(d) {

        			let string = stateData[0].values[0].date;

        			return string[8] + string[9] + "." + string[5] + string[6] +  "." + string[0] + string[1] + string[2] + string[3];

        		})


        	// Cases count
        	d3.select(".monitor-dynamic.cases-count")
        		.html(d => stateData[0].values[0].confirmed);

        	// Cases ratio
        	d3.select(".monitor-dynamic.ratio")
        		.html(d => Math.round(stateData[0].values[0].confirmed_per_100k_inhabitants * 100) / 100);


        	// Cases percentage
        	d3.select(".monitor-dynamic.percentage-cases")
        		.html(d => Math.round(stateData[0].values[0].confirmed / brTotal * 100) + "%");

        	// Population percentage
        	let brPop = 210147125;
        	d3.select(".monitor-dynamic.percentage-pop")
        		.html(d => Math.round(stateData[0].values[0].estimated_population_2019 / brPop * 100) + "%");

    }


    drawInteractiveMonitor();

    // Redraw the main chart on resize
    function redrawInteractiveMonitor() {

        d3.select('#main-chart')
          .remove();

         drawInteractiveMonitor();

    }

    window.addEventListener('resize', redrawInteractiveMonitor);


    // Adds small multiple fixed charts
    function drawRegion(region) {

    	let margin = { top: 10, left: 50, right: 50, bottom: 22},
    		    height = 300 - margin.top - margin.bottom,
    		    width = 300 - margin.left - margin.right;

    	let states = [ ];
    	if (region == "sul") {

    		states = ["PR", "SC", "RS"];

    	}

    	else if (region == "sudeste") {

    		states = ["SP", "RJ", "MG", "ES"];


    	}

    	else if (region == "centro-oeste") {

    		states = ["MS", "MT", "GO", "DF"];


    	}

    	else if (region == "nordeste") {

    		states = ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"];


    	}

    	else if (region == "norte") {

    		states = ["TO", "PA", "AM", "AP", "RR", "AC", "RO"];


    	}

    	let data = nested.filter(d => states.includes(d.key));

    	// Defines the scales and line generators and all other constants
        // Days passed since the first day avaliable in the data to today
       	let casesStart =  new Date("2020-02-26");
        let xMax = Date.now() - casesStart.getTime();
            xMax = xMax / (1000 * 3600 * 24) + 1; // Milliseconds to days


        // Total case count
        let xPositionScale = d3.scaleLinear()
          .domain([ 0, xMax ]) 
          .range([0, width]);

        let yPositionScale = d3.scaleLog()
          .domain([1, 10000]) // From 1 to 10,000 cases
          .range([ height, 0 ]);


    	// Adds one item for each state
    	for (let datum of data) {

    		let lineGenerator = d3.line()
    	        .x(function(d) {
    	          return xPositionScale(+d.days_since_outbreak);
    	        })
    	        .y(function(d){
    	          	return yPositionScale(+d.confirmed);
    	        })
    	        .curve(d3.curveStep);


    		let stateData = datum.values;


    		let chart = d3.select(`#small-multiple-${datum.key}`)

    		let svg = chart.append("svg")
    					.attr("class", "svg-chart")
    					.attr("height", height + margin.top + margin.bottom)
    		            .attr("width", width + margin.left + margin.right)
    		            .append("g")
    		            .attr("transform", `translate(${margin.left},${margin.top})`)


    		// Adds a point to each position of the line
    	    svg.selectAll("circle")
    	    	.data(stateData)
    	    	.enter()
    	    	.append("circle")
    	    	.attr("cx", d => xPositionScale(+d.days_since_outbreak))
    	    	.attr("cy", d => yPositionScale(+d.confirmed))
    	    	.attr("r", 1)
    	    	.attr("fill", "red");

    	    // Adds the gray lines for the other states
    	    let otherStates = nested.filter(d => (d != d.key));
    	    for (let otherState of otherStates) {
    	    	
    	    	// console.log(otherState);

    	    	svg.append("path")
    	    	 .attr("class", "state-line")
    	    	 .attr("fill", "none")
    	    	 .style("stroke-width", 2)
    	    	 .style("opacity", .5)
    	    	 .style("stroke", "#bebebe")
    	    	 .attr("d", lineGenerator(otherState.values))
    	    }

    	   	// Adds the state line
    		svg.append("path")
    	    	 .attr("class", "state-line")
    	    	 .attr("fill", "none")
    	    	 .style("stroke-width", 3)
    	    	 .style("stroke", "#b6292f")
    	    	 .attr("d", lineGenerator(stateData));



    	    // Adds axis
    	    let xAxis = d3.axisBottom(xPositionScale)
    	          .tickValues([1, 10, 20, 30])
    	          .tickFormat(function(d) {

    	          	if (d == 1) {

    	          		return  d + 'º dia'

    	          	}

    	          	else {

    	          		return  d + 'º'

    	          	}


    	    });

    	    let xAxisHolder = svg.append("g")
    	         .attr("class", "x-axis")
                 .attr("fill", "black")
                 .attr("transform", `translate(0,${height + 5})`)
                 .call(xAxis);

            xAxisHolder.select(".domain") // Selects the axis vertical line...
                    .remove()       // ...and removes it


           	let yAxisTicks = [1, 10, 100, 1000, 10000];

    	    let yAxis = d3.axisLeft(yPositionScale)
    	        .tickValues(yAxisTicks)
    	        .tickSize(0 - width) // Make the ticks occupy the whole svg, left to right
    	        .tickFormat(function(d) {

    				if (d >= 1000) {

    					return d / 1000 + " mil";

    				}


    				else {

    					return d;

    				}

    	         });

    	    let yAxisHolder = svg.append("g")
    	         .attr("class", "y-axis")
                 .attr("fill", "black")
                 .attr("transform", "translate(-1,0)")
                 .call(yAxis);

            yAxisHolder.select(".domain") // Selects the axis vertical line...
                    .remove()       // ...and removes it


       		svg.selectAll(".tick line")
          		.attr("stroke", "#777") // Styling the ticks - color
          		.attr("stroke-dasharray", "2,3"); // Styling the ticks - dot size

        	// Adds a explanation to the first label
        	let yTicks = yAxisHolder.selectAll(".tick")
            	.each(function(d){

            		if (d == 10000) {

    		    		let element = d3.select(this);
    		    		let elementLabel = element.select("text");

    		    		element.append("text")
    		    			.text("casos")
    		    			.attr("x", elementLabel.attr("x"))
    		    			.attr("dy", 15)
    		    			.attr("fill", "currentColor")
    		    			.attr("class", "tick-label");

            		}


        		})



    		}

    }

    drawRegion("sul");
    drawRegion("sudeste");
    drawRegion("centro-oeste");
    drawRegion("norte");
    drawRegion("nordeste");

});

