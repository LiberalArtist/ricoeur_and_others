///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// .js file for interactive visualizatoins for Paul Ridcoeur's Social Network, a branch of Ricoeur and the Other.
// Ricoeur and the Other is a part of Digital Ricoeur project
// 
// This is an interactive visualization effort of Paul Ricoeur's intellectual peers, as referred to by Ricoeur
// in his vast primary literature as corpora.
//
// by Do Yeun Kim
//
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Variables that I think could be shared between the two graphs are defined here
var startYear = Number.MAX_SAFE_INTEGER,
    refreshSY,
    endYear = Number.MIN_SAFE_INTEGER,
    refreshEY,
    sortBy,
    reverse,
    width = 1600,
    height = 900,
    padding = 80,
    b_set = [],
    barFiltered = [],
    l_set = [];
const l_default = 20;

// Read in the .csv file
// Print out an error message if the file is unreadable.
// Otherwise, save the CSV file into b_set then call visualize function
function initialize() {

    // Read in the csv file for the bar graph
    // Check for errors, then do some pre-processing
    d3.csv("./data/barGraph.csv", function(error, data) {
        b_set = data;
        if (error) {
            console.log(error);
            window.alert("Cannot read in the file.");
        }
        else {
            // console.log(b_set);
        
            // Safety check that we are correctly reading in the file
            for (i = 0; i < b_set.length; i++) {
                if (b_set[i].Year < startYear) {
                    startYear = b_set[i].Year;
                }   
                if (b_set[i].Year > endYear) {
                    endYear = b_set[i].Year;
                }
            }
            refreshSY = startYear;
            refreshEY = endYear;

            // Display the date range we are currently working on
            // Also display the current sorting order
            document.getElementById("startYear").value = startYear;
            document.getElementById("endYear").value = endYear;
            //document.getElementById("checkboxes").parentNode.style.display = "none";
            sorBy = "Thinker";
               
            // Filter the b_set for visualization
            filterBar();
            checkReverse();
        }
    });

    // Read in the csv file for line graph
    // Similarly, check for error then initialize the graph
    d3.csv("./data/lineAVG.csv", type, function(error, data) {
        l_set = data;
        if (error) {
            console.log(error);
            window.alert("Cannot read in the file.");
        }
        // console.log(l_set);
        initLine();
    });




}

function openCustom() {
    var customDiv = document.getElementById("lineCustomize");
    var displayStatus = customDiv.style.display;
    if (document.getElementById("lineDefault").checked) {
        customDiv.style.display = "none"; 
        initLine();
    }
    else {
        if(displayStatus=="none") {
            customDiv.style.display = "table";
        } else {
            customDiv.style.display = "none";
        }
    }
}

function clearCustom() {
    var i = 0;
    while (document.getElementsByClassName("customCheck")[i]) {
        document.getElementsByClassName("customCheck")[i].checked = false; 
        i++;
    }
}

function selectAllCustom() {
    var i = 0;
    while (document.getElementsByClassName("customCheck")[i]) {
        document.getElementsByClassName("customCheck")[i].checked = true; 
        i++;
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This part is associated with the bargraph for the time being
//

// The user can input the dates by hitting enter instead of clicking Date Range
function checkInput() {
    // Initialize inputs
    var startInput = document.getElementById("startYear"),
        endInput = document.getElementById("endYear");
    
    // If "enter" is hit while the user is inputing start year, call grabDate
    startInput.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            grabDate();
        }
    });

    // If "enter" is hit while the user is inputing end year, call grabDate
    endInput.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            grabDate();
        }
    });
}

// Update date range for the bar graph
// This function grabs the date range provided by the user, re-filters the b_set, 
// and updates the visualization
function grabDate() {
    startYear = parseInt(document.getElementById("startYear").value);
    endYear = parseInt(document.getElementById("endYear").value);

    // console.log(startYear);
    // console.log(endYear);
    
    filterBar();
    sortData();
}

// If the user wants to refresh view to default
// This returns to initial state w/o having to read in the file
function resetDate() {
    startYear = refreshSY;
    endYear = refreshEY;

    // Display the date range we are currently working on
    // Also display the current sorting order
    document.getElementById("startYear").value = startYear;
    document.getElementById("endYear").value = endYear;

    // console.log(startYear);
    // console.log(endYear);

    filterBar();
    sortData();
}



// From the two mutually exclusive radio buttons, fetch by which factor to sort barFiltered.
// Then, sort barFiltered using updated sortBy and reverse, redrawing the bargraph
function sortData() {
   var sortByRadio = document.getElementsByName("sortBy");
   for (var i = 0; i < sortByRadio.length; i++) {
        if (sortByRadio[i].checked){
            sortBy = sortByRadio[i].value;
            if (sortByRadio[i].value == "Thinker") {
                barFiltered.sort(sort_by(sortBy, reverse, function(a) {return a}));
                // console.log(sortByRadio[i].value);
            } else {
                barFiltered.sort(sort_by(sortBy, reverse, parseInt));
                // console.log(sortByRadio[i].value);
            }
            break;
        }
    }
    barGraph();
}

// If the user wants to reverse the order of sorting, they can click the button
// It will reverse the sorting order, after which this function calls on sortData()
// to further sort and redisplay the graph
function checkReverse() {
    currentMode = document.getElementsByName("reverse");
    for (var i = 0; i < currentMode.length; i++) {
        if (currentMode[i].checked) {
            if (currentMode[i].value == "Ascend") {
                reverse = false;
            } else {
                reverse = true;
            }

        }
    
    }

    // console.log(reverse);
    sortData();

}


// The main function for bargraph
// Set dimension of the SVG, create the element, then draw the graph
//
function barGraph(){


    // Set dimensions for the visualization
    var barPad = 1;
    var barWidth = (width - 2 * padding) / barFiltered.length - barPad;

    // Selectively remove the bar graph
    // As we move on to add more interactivities to the line graph,
    // we may want to remove both graphs at once.
    d3.select("#b_graph").remove();

    // Create svg frame for visualization given the attributes above
    var bargraph = d3.select("#b_DIV").
        append("svg").
        attr("class", "graph").
        attr("width", width).
        attr("height", height).
        attr("id", "b_graph");

    

    // Set scales for x-axis and y-axis to afford dynamic scaling
    var xScale = d3.scaleBand().
        domain(d3.range(barFiltered.length)).
        rangeRound([padding, width - padding]);
    var yScale = d3.scaleLinear().
        domain([0,d3.max(barFiltered, function(d, i) {
            return barFiltered[i].Frequency;
       })]).
        range([height - padding, padding]);
   
    // Initialize the tooltip to show Author's name 
    var enlarged = d3.select("#b_DIV").
        append("div").
        attr("class", "tooltip").
        style("opacity", 0);

    // Create the bar graph
    bargraph.selectAll("rect").
        data(barFiltered).
        enter().
        append("rect").
        attr("class", "rect").
        attr("x", function(d,i) {
            return (padding + i * ((width - 2 * padding) / barFiltered.length));}).
        attr("y", function(d, i) {
            return height - (yScale(0) - yScale(barFiltered[i].Frequency) + padding)}).
        attr("width", barWidth).
        attr("height", function(d, i) {
            return yScale(0) - yScale(barFiltered[i].Frequency)}).
        attr("fill", "#191970").
        on("mouseover", function(d,i) {
            // Show the name and frequency of the author where the mouse pointer enters the bar
            enlarged.transition().
                duration(200).
                style("opacity", 0.9);
            enlarged.html(barFiltered[i].Thinker + "<br/>" + barFiltered[i].Frequency).
                style("left", (d3.event.pageX) + "px").
                style("top", (d3.event.pageY) + "px");
                
        }).
        on("mouseout", function(d) {
            enlarged.transition().
                duration(500).
                style("opacity", 0);   
        });
   
    // Add frequency to the bar  
    var textSize = barWidth/3;
    bargraph.selectAll("text.labels").
        data(barFiltered).
        enter().
        append("text").
        text(function(d, i) {
            return barFiltered[i].Frequency;}).
        attr("x", function(d, i) {
            return (barWidth/2 + padding + i * ((width - 2 * padding) / barFiltered.length));}).
        attr("y", function(d, i){ 
            return (height - (yScale(0) - yScale(barFiltered[i].Frequency)) - padding)}).
        attr("font-family", "arial").
        attr("font-size", textSize + "px").
        attr("fill", "red").
        style("text-anchor", "middle").
        attr("class", "labels");

    // Define the axes
    var b_xAxis = d3.axisBottom(xScale).
                    tickFormat(function(d, i) {
                        return barFiltered[i].Thinker;});
    var b_yAxis = d3.axisLeft(yScale);

    // Draw the axes
    bargraph.append("g").
        attr("class", "x axis").
        attr("transform", "translate(0 "+ (height - padding) + ")").
        call(b_xAxis).
        attr("font-weight", "bold").
        selectAll(".tick text").
        call(wrapLabel, barWidth);
    bargraph.append("g").
        attr("class", "y axis").
        attr("transform", "translate(" + padding + ",0)").
        call(b_yAxis);

    // Add the labels to the axes
    bargraph.append("text").
        attr("transform", "translate(" + (width/2) + "," + (height - padding/3) + ")").
        attr("font-weight", "bold").
        style("text-anchor", "middle").
        text("Thinkers");
    bargraph.append("text").
        attr("transform", "rotate(-90)").
        attr("y", padding / 3).
        attr("x", 0 - height / 2).
        attr("dy", "1em").
        attr("font-weight", "bold").
        style("text-anchor", "middle").
        text("Frequency");

}

// Function that wraps long names so that the labels do not overlap
// The code was taken from Mike Bostok's code, found here:
// https://bl.ocks.org/mbostock/7555321
function wrapLabel(text, barWidth) {
    text.each(function() {
        var text = d3.select(this),
            // words is a reversed array of the split string where the string is split 
            // based on the regex \s+ which turns each continuous empty space with 
            // empty string
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            // Define tspan for adjusting of location for the label
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        // Fetch the words from the label one by one
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            // If the length of the tspan is greater than barWidth, i.e. if the name is too long
            // remove the last word from the current line and create a new line for this word
            if (tspan.node().getComputedTextLength() > barWidth) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
// Helper function for sort
// Borrowed from https://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
var sort_by = function(field, reverse, primer) {
    
    // Check for primer and see what additional steps must be made
    var key = primer ?
        function(x) {return primer(x[field])} :
        function(x) {return x[field]};
    
    // Determines whether the directionality is reversed (1 or -1)    
    reverse = !reverse ? 1 : -1;

    // sort using reverse
        return function (a,b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }

}

// This function filters b_set to better accomodate for data being visualized
// First, the b_set is filtered by the year range
// Then, the frequency at which the thinker is refered to in Ricoeur's work
// is summed up for each thinker so that we don't display multiple occasions for
// each thinker
function filterBar() {

    // Create temporary arrays to process
    dateFilter = [];
    nameYear = [];

    // This method allows for creating an independent copy of b_set
    // Makes a copy of b_set as temp
    let temp = b_set.slice(0);  
    // console.log(temp);
    // b_set is now independent of temp, and will not refer to temp
    // i.e. modifying temp will no longer modify b_set
    temp = b_set.map(o => Object.assign({}, o));

    var y_count = 0;
    // If the datum falls into the date range, add it to the temporary arry
    for (var i = 0; i < temp.length; i++) {     
        if (parseInt(startYear) <= parseInt(temp[i].Year) && parseInt(temp[i].Year) <= parseInt(endYear)) {
            dateFilter.push(temp[i]);
        }

    }

    for (var i = 0; i < dateFilter.length; i++) {
        // Get the list of year and titles to display above the bar graph
        if (i == 0) {
            // Replace "-" with empty space and put year in parentheses
            // In replace(/-/g, " "), /-/g allows us to replace ALL "-".
            nameYear.push(dateFilter[i].Title.replace(/-/g, " ").concat(" (", dateFilter[i].Year, ")"));   
        }
        else if (dateFilter[i].Year != dateFilter[i - 1].Year) {
            // Replace "-" with empty space and put year in parentheses
            // In replace(/-/g, " "), /-/g allows us to replace ALL "-".
            // console.log(dateFilter[i]);
            nameYear.push(", ".concat(dateFilter[i].Title.replace(/-/g, " "), " (", dateFilter[i].Year, ")"));
            y_count++;
        }
    }
    // Check for illegal input and add "and" properly
    if (nameYear.length == 0) {
        nameYear.push("Illegal date range. Please check and update the date range.");
    }
    if (nameYear.length > 2) {
        nameYear.splice(y_count, 0, ", and");
    }
    if (nameYear.length == 2) {
        nameYear.splice(y_count, 0, " and");
    }
    
    // Sort the temporary array to make summation easier
    dateFilter.sort(sort_by('Thinker'), false, function(a) {return a});
    
    // Initialize variables for summation
    sum = 0;
    bfLen = 0;
    // Reset barFiltered 
    barFiltered.length = 0;

    // Iterate through temp and look for redundancy in thinkers
    for (var i = 0; i < dateFilter.length; i++) {
        // Add initial item
        if (!i) {
            barFiltered.push(dateFilter[i]);
            bfLen++;
        } 
        // If the current thinker is different from the previous one, 
        // add the entry to the barFiltered array
        else if (dateFilter[i].Thinker != dateFilter[i - 1].Thinker) {
            barFiltered.push(dateFilter[i]);
            barFiltered[bfLen].Frequency = parseInt(dateFilter[i].Frequency);
            bfLen++;
        } 
        // If the current thinker has just been added to the array
        // sum up frequency
        else {
            sum = parseInt(barFiltered[bfLen - 1].Frequency) + parseInt(dateFilter[i].Frequency)
            barFiltered[bfLen - 1].Frequency = sum;
        }
    }
   
    // Sort by frequency and only return the most frequent 20
    barFiltered.sort(sort_by('Frequency'), true, function(a) { return a;});
    // console.log(barFiltered);
    barFiltered = barFiltered.filter(function(d, i) { return (i >= barFiltered.length - 20); });

    // This part shows the books that are being displayed.
    var outNY = nameYear[0];
    for (var i = 1; i < nameYear.length; i++) {
        // Don't want the extra comma here
        if (i == nameYear.length - 1) {
            nameYear[i] = nameYear[i].replace(", "," ");
        }
        outNY = outNY.concat(nameYear[i]);        
    }
    // Display the books above the bar graph
    document.getElementById("books").innerHTML = outNY;

    // console.log(barFiltered);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This part contains the functions used for the line chart
//

var thinkers_sh = [];
// As of now, we are using a predfined color scheme with 20 colors.
// We might need to define our own color scheme if we want to show more than 20 thinkers
var l_x = d3.scaleTime().range([padding, width - padding]),
    l_y = d3.scaleLinear().range([height - padding, padding]),
    l_z = d3.scaleOrdinal(d3.schemeCategory20);

// Using d3 library's timeParse function to parse years 
var parseYear = d3.timeParse("%Y");

// Draw line
var line = d3.line().
    x(function(d) {return l_x(d.year);}).
    y(function(d) {return l_y(d.freq);});


function initLine() {
    // Create thinkers, which is a map that allows us to access individual frequencies,
    // mapped onto each thinker and year
    var thinkers = l_set.columns.slice(2).map(function(id) {
        return {
            id: id,
            values: l_set.map(function(d) {
                return {year: d.year, freq: d[id]};
            })
        };
    });
    //console.log(thinkers);
    //console.log(thinkers[0]);
    var customSize = document.getElementsByClassName("customThinkers").length;

    for (var i = 0; i < customSize; i++) {
        var rankedName = (i + 1).toString() + ". " + thinkers[i].id;
        // console.log(rankedName);
        document.getElementsByClassName("customThinkers")[i].innerHTML = rankedName;
    }

    // This part allows us to alternate between top 20 and custom of sort
    var show;
    if (document.getElementById("lineDefault").checked) {
        d3.select("#l_graph").remove();
        show = l_default;
        // console.log("Drawing default lines");

        // Empty thinkers_sh
        thinkers_sh = [];
        for (var i = 0; i < show; i++) {
            thinkers_sh[i] = thinkers[i]; 
        }
    } else {
        d3.select("#l_graph").remove();
        // console.log("Drawing custom lines");

        // Empty thinkers_sh
        thinkers_sh = [];
        for (var i = 0; i < customSize; i++) {
            if (document.getElementsByClassName("customCheck")[i].checked) {
                thinkers_sh.push(thinkers[i]); 
            }
        }
    }

    // define the domain for the axes
    l_x.domain(d3.extent(l_set, function(d) {return d.year;}));
    l_y.domain([
        d3.min(thinkers_sh, function(c) {return d3.min(c.values, function(d) {return d.freq;}); }),
        d3.max(thinkers_sh, function(c) {return d3.max(c.values, function(d) {return d.freq;}); })
    ]);
    l_z.domain(thinkers_sh.map(function(c) {return c.id;}));

    // console.log(thinkers_sh);
    drawLineChart();

}


// This function actually draws the line graph
function drawLineChart() {


    // The line graph will be appended to div of class "l_DIV"
    var linegraph = d3.select("#l_DIV").
        append("svg").
        attr("class", "graph").
        attr("width", width + padding).
        attr("height", height).
        attr("id", "l_graph");

    var g = linegraph.append("g");

    // Define axes for lin graph
    var l_xAxis = d3.axisBottom(l_x);
    var l_yAxis = d3.axisLeft(l_y);
    // Draw the axes
    g.append("g").
        attr("class", "x axis").
        attr("transform", "translate(0" + "," + (height - padding) + ")").
        call(l_xAxis);
    g.append("g").
        attr("class", "y axis").
        attr("transform", "translate(" + padding + ",0)").
        call(l_yAxis);

   // Label the axes     
    g.append("text").
        attr("transform", "translate(" + (width/2) + "," + (height - padding/2) + ")").
        attr("font-weight", "bold").
        text("Years");
    g.append("text").
        attr("transform", "rotate(-90)").
        attr("y", padding / 3).
        attr("x", 0 - height / 2).
        attr("dy", "1em").
        attr("font-weight", "bold").
        style("text-anchor", "middle").
        text("Frequency");

    // Each thinker
    var thinker = g.selectAll(".thinker").
        data(thinkers_sh).
        enter().
        append("g").
        attr("class", "thinker");

    // For each thinker, draw a line using the values 
    // Here, values defined in initLine function as thinkers was created
    thinker.append("path").
        attr("class", "line").
        attr("id", function(d) { return d.id; }).
        attr("d", function(d) {
            return line(d.values); }).
        style("stroke", function(d) { return l_z(d.id); }).
        on("mouseover", function(d, i) {
            // Appending the name of each thinker at the end of each line
            thinker.append("text").
                datum(function(d, i) { 
                    // Don't use this right now, but we will want to use this in the future
                }).
                attr("transform", "translate("+ (width/2) + "," + padding + ")").
                attr("x", 3).
                attr("dy", "0.35em").
                style("font", "20px sans-serif").
                style("text-anchor", "middle").
                text(this.id).
                attr("id", "bigName");

        }).
        on("mouseout", function(d) {
            // Clear all text 
            thinker.select("#bigName").remove();
        });


    var fontSize = 15;
    // Append the name of the thinker as the legend
    thinker.append("text").
        datum(function(d) {return {id: d.id, value: d.values[d.values.length - 1]};}).
        attr("transform", function(d, i) {return "translate(" + l_x(d.value.year) + "," + (padding + i * fontSize) +")";}).
        attr("x", fontSize).
        attr("dy", "0.35em").
        style("font", fontSize + "px sans-serif").
        style("font-weight", "bold").
        text(function(d) {return d.id;});
  
    // Append circles of appropriate color to the legend 
    var legendOffset = 10;
    var radius = 5;
    thinker.append("circle").
            datum(function(d) {return {id: d.id, value: d.values[d.values.length - 1]};}).
            attr("transform", function(d, i) {return "translate(" + l_x(d.value.year) + "," + (padding + i * fontSize) + ")";}).
            attr("cx", legendOffset).
            attr("r", radius).
            attr("fill", function(d, i) { return l_z(d.id);});
    
    // Initialize the tooltip to show Author's name 
    var lineFreq = d3.select("#l_DIV").
        append("div").
        attr("class", "tooltip").
        style("opacity", 0);
}


// When the csv file is read, all elements are read in as string
// Here, we parse for date and convert the frequencies to numbers
function type (d, _, columns) {
    // Parse years into year format provided by d3 library
    d.year = parseYear(d.year);
    var n = columns.length;
    for (var i = 1; i < n; ++i) {
        c = columns[i];
        d[c] = +d[c];
    }
    return d;
}

initialize();
checkInput();
