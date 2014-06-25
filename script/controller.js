require(
    ["dojo/dom",
     "dojo/on",
     "dojo/topic",
     "dojo/dom-style",
     "dojo/query",
     "dijit/registry",
     "dijit/form/ToggleButton",
     "dojo/date",
     "dojox/lang/functional",
     "dojo/dom-construct",
     "dojox/charting/widget/Chart",
     "dojox/charting/themes/Claro",
     "dojox/charting/plot2d/Lines",
     "dojox/charting/action2d/Tooltip",
     "dojox/charting/action2d/Magnify",
     "dojo/request",
     "dojox/charting/action2d/MouseIndicator",
     "dojo/ready",
     "dojo/request/script",
     "dojo/domReady!"
    ], function (dom, on, topic, style, query, registry, ToggleButton, date, funct, domConstruct, 
		 ChartWidgit, theme, Lines, Tooltip, Magnify, request, Indicator, ready, script) {

	on(registry.byId("timeOptionsSelect"), "change", function (e) {
	    var value = registry.byId("timeOptionsSelect").value;
	    if (value === -1) {
		registry.byId("customTimeToggler").show();
	    } else {
		registry.byId("customTimeToggler").hide();
		topic.publish("dateChange", date.add(new Date(), "hour", -1 * value), new Date());
	    }
	});
	on(dom.byId("sameSizeAsCurrent"), "click", function (e) {
	    topic.publish("updateImageSize", style.get("graphHolder", "height"), style.get("graphHolder", "width"));
	});

        on(dom.byId("toggleButton"), "click", function(e) {
	    topic.publish("toggleControls");
        });

        on(dom.byId("timeUpdateButton"), "click", function () {
	    var startDate = registry.byId("startDate");
	    var startTime = registry.byId("startTime");
	    var endDate = registry.byId("endDate");
	    var endTime = registry.byId("endTime");
	    var st = new Date(startDate.value.getFullYear(), startDate.value.getMonth(), startDate.value.getDay(),
			      startTime.value.getHours(), startTime.value.getMinutes(), 
			      startTime.value.getMinutes(), startTime.value.getSeconds(), 0);
	    var et = new Date(endDate.value.getFullYear(), endDate.value.getMonth(), endDate.value.getDay(),
			      endTime.value.getHours(), endTime.value.getMinutes(), 
			      endTime.value.getMinutes(), endTime.value.getSeconds(), 0);				 
	    topic.publish("dateChange", st, et);
	});

        on(window, "resize", function (e) {topic.publish("rsize");});
        //------------event handling -------------- ==========

        topic.subscribe("addOption", function (plotObject) {
	    registry.byId("optionsGrid").addChild(
	        new ToggleButton({
		    showLabel: true,
		    checked: true,
		    label: plotObject.title + " - On",
		    id: plotObject.title + "Toggle",
		    "class": "option",
		    onChange: function (val) { 
		        if (val) {
			    this.set("label", plotObject.title + " - On");
			    topic.publish("addDataSet", plotObject);
		        }
		        else {
			    this.set("label", plotObject.title + " - Off");
			    topic.publish("removePlot", plotObject);
		        }
		    }
	        })
	    );
        });

        topic.subscribe("rsize", function (e) {
	    var graphs = query(".graph");
	    var percentage = (style.get("graphHolder", "height") - 1) / (graphs.length);
	    var width = style.get("graphHolder", "width");
	    var charts = registry.byClass("graph");
	    charts.forEach(function (item) {
		item.chart.resize({h:percentage, w:width});//add support to resize the stuff.
	    });
        });

	var changer = function () {
	    var hidden = false;
	    return function () {
		if (hidden) {
		    registry.byId("menuToggler").show();
                    //style.set("graphHolder", "width", "95%");
		    topic.publish("resize");
		} else {
		    registry.byId("menuToggler").hide();
                    //style.set("graphHolder", "width", "75%");
		    topic.publish("resize");
		}
		hidden = !hidden;
	    };
	}();

	topic.subscribe("removeOptions", function () {
	    query(".option").forEach( function(item) {
                domConstruct.destroy(item);
                registry.remove(item.attributes.widgetid.value);
                registry.remove(item);
	    });
	});
        topic.subscribe("dateChange", function (sD, eD) {
            //always goes back to the server to get data. TODO: have it cashe the data.
            //should the refreshing of plots be done here or after the new data? 
            //Probably after the new data because we dont want there to be lag.
	    if (date.compare(sD, eD) < 0 ) {
		if (date.compare(eD, new Date()) <= 0) {
		    topic.publish("getData", sD, eD);
		} else {
		    alert("The sensor does not posses the ability to see into the future.");
		}
	    } else { 
		alert("Start time must before end time.");
	    }
	    
        });

        topic.subscribe("removePlot", function (plotObject) {
	    var plot = funct.filter(registry.toArray(), function (plot) {
                return plot.id === plotObject.title;
            })[0];
	    if (!(typeof plot === "undefined" )){
	        plot.destroy();
	    }	    
	    topic.publish("rsize");
        });

        topic.subscribe("removePlots", function () {
            query(".graph").forEach( function(item) {
                domConstruct.destroy(item);
                registry.remove(item.id);
                registry.remove(item.id + "_splitter");
                //have to remove the splitter crated by the border container
            });
        });
	
	function formatDate(d) {
	    var dee = new Date(parseInt(d));
	    return dee.toTimeString().split(" ")[0];
	}

        topic.subscribe("addDataSet", function (plotObject) { 	    
	    var holder = new ChartWidgit({
	        title: plotObject.title,
		margins: 0,
	        id: plotObject.title, "class": "graph",
	        theme: theme
	    });
	    
	    registry.byId("graphHolder").addChild(holder);
	    
	    holder.chart
	        .addPlot("default", {type: Lines, markers:false, lines: true})
	        .addAxis("x", {fixLower: "major", fixUpper: "major", labelFunc: formatDate})
	        .addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major"})
	        .setTheme(theme);
	    holder.chart.title = plotObject.title;
	    holder.chart.titleGap = 10;
	    holder.chart.titleFont = "15pt";
//	    funct.forEach(plotObject.series, function (item) { //uncomment to support multiple series.
	    holder.chart.addSeries("wee", plotObject.series);
//	    });
	    if (dom.byId(plotObject.title + "Toggle") === null) {
		topic.publish("addOption", plotObject);
	    }

	    var dispFunct =  function (firstDataPoint, secondDataPoint, fixed, precision) {
		return formatDate(firstDataPoint.x.getTime().toString()) + "  ,   " + firstDataPoint.y;
	    };
	    var tip = new Tooltip(holder.chart, "default");
	    var mag = new Magnify(holder.chart, "default");
	    var prec = 0.1;
	    var interactor = new Indicator(holder.chart, "default", { //have to remember to change series
		dualIndicator: true, series: "wee", precision: prec, labelFunc: dispFunct
	    });
	    holder.chart.render();
	    topic.publish("rsize");
        });

        //-------------------------dataloading---------------------------------------------------------------------------

        var dataTypes = {
	    airTemp : "t",
	    relativeHumidity: "rh",
	    dewPoint: "td",
	    wind_speed: "spd"
	};

	function stringDate (date) {
	    var fin = "";
	    fin += date.getUTCFullYear();
	    fin += "-";
	    fin += twoDigitString(date.getUTCMonth());
	    fin += "-";
	    fin += twoDigitString(date.getUTCDate());
	    fin += "+";
	    fin += twoDigitString(date.getUTCHours());
	    fin += ":";
	    fin += twoDigitString(date.getUTCMinutes());
	    fin += ":";
	    fin += twoDigitString(date.getUTCSeconds());
	    return fin;
	}
	function twoDigitString (intr) {
	    var fin = "";
	    if (intr < 10) {
		fin += "0" + intr.toString();
	    } else {
		fin += intr.toString();
	    }
	    return fin;
	}

	funct.filteredMap = function (arry, f, filter) {
	    return funct.filter(funct.map(arry, f), filter);
	};
	//arry is an array, f is a function that takes an array and returns a number, and period is the period that you split the array.
	funct.rollingFold = function (arry, f, period) {
	    var stop = arry.length - (arry.length % period);
	    var fin = funct.filteredMap(arry, function (item, index) {
		if (index >= stop) {
		    return f(arry.slice(index));
		} else {
		    return f(arry.slice(index, index + period));
		}
	    }, function (item, index) {
		return index % period === 0;
	    });
	    return fin;
	};

	function averagePointsArray (arry) {
	    if (arry.length === 1) {
		return arry[0];
	    }
	    var hi = {
		"x": arry[0].x,
		"y": funct.reduce(arry, function (pv, cv) { return pv + cv.y; }, 0) / arry.length 
	    }; return hi;
	}

	function averagePoints (arry, period) { //period is the number of points that are being averaged
	    return funct.rollingFold(arry, averagePointsArray, period);
	}

        topic.subscribe("getData", function (start, end) {
	    var url = "http://metobs.ssec.wisc.edu/app/rig/tower/data/json";
	    var q = "symbols=";
	    funct.forEach(dataTypes, function (item) {
		q = q + item + ":";
	    });
	    q = q.slice(0, -1);
	    q = q + "&begin=" + stringDate(start) + "&end=" + stringDate(end);
	    console.log(url + "?"+ q);
            request.get("data/realData.json", {
	        handleAs: "json",
	        timeout: 5000
	    }).then(function (response) {
                topic.publish("removePlots");
		topic.publish("removeOptions");
		//formatting the name
		response.stamps = funct.map(response.stamps, function (item) {//"2014-05-20 16:07:01"
		    var parsed = funct.map(item.split(/:| |-/), function (item) {
			return parseInt(item);
		    });
		    return new Date(parsed[0], parsed[1], parsed[2], parsed[3], parsed[4], parsed[5], 0); 
		});
		//formatting the data
		funct.forEach(response.symbols, function (pltName) {
		    //index is where the name appears so that you can match the name with the data
		    var index = response.symbols.indexOf(pltName);
		    //remove underscore, add space, change to proper case. 
		    pltName = pltName.replace("_", " ").toProperCase();
		    var plotObject = {
			title: pltName,
			series: funct.map(response.data, function (set, ind) { 
			    //to add supp for multiple series, enclose in brackets and iterate through all of the 
			    //indexes you want, adding them to the array.
			    //data is in the form of tuples that match with the names, so we get the tuple at certain index, and then get the time value for that 
			    return {"x": response.stamps[ind], "y": set[index]};
			})
		    };
		    var maxPoints = 200;
		    var period = Math.ceil(plotObject.series.length / maxPoints);
		    if (period > 1) {
			plotObject.series = averagePoints(plotObject.series, period);
		    }
		    topic.publish("addDataSet", plotObject);
		});
	    }, function (error) {
		alert(error);
		console.log(error);
	    });
        });

	//adding a method to change strings to their proper case. 
	String.prototype.toProperCase = function () {
	    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};

        topic.publish("getData", registry.byId("startTime").value, registry.byId("endTime").value);
    });