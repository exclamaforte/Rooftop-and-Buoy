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
     "dojo/domReady!"
    ], function (dom, on, topic, style, query, registry, ToggleButton, date, funct, domConstruct, ChartWidgit, theme, Lines, Tooltip, Magnify, request) {

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
                    //		    style.set("graphHolder", "width", "95%");
		    topic.publish("resize");
		} else {
		    registry.byId("menuToggler").hide();
                    //		    style.set("graphHolder", "width", "75%");
		    topic.publish("resize");
		}
		hidden = !hidden;
	    };
	}();

	topic.subscribe("removeOptions", function () {
	    query(".option").forEach( function(item) {
                domConstruct.destroy(item);
                registry.remove(item.attributes.widgetid);
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
	
	function formatNumberAsTime(number) {
	    var ret = "";
	    if (number < 100000) {
		ret += "0";
	    }
	    if (number < 10000) {
		ret += "0";
	    }
	    if (number < 1000) {
		ret += "0";
	    }
	    if (number < 100) {
		ret += "0";
	    }
	    if (number < 10) {
		ret += "0";
	    }
	    ret += number.toString();
	    return ret[0] + ret[1] + ":" + ret[2] + ret[3] + ":" + ret[4] + ret[5];
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
	        .addPlot("default", {type: Lines, markers:true, tension: "S", lines: true})
	        .addAxis("x", {fixLower: "major", fixUpper: "major", labelFunc: formatNumberAsTime})
	        .addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major"})
	        .setTheme(theme);
	    funct.forEach(plotObject.series, function (item) {
	        holder.chart.addSeries("wee", item);
	    });
	    if (dom.byId(plotObject.title + "Toggle") === null) {
		topic.publish("addOption", plotObject);
	    }

	    var tip = new Tooltip(holder.chart, "default");
	    var mag = new Magnify(holder.chart, "default");
	    holder.chart.render();
	    topic.publish("rsize");
        });
	
	topic.subscribe("updateDisplayingPlots", function () {
	    
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
	function averagePoints (plotObject, period) { //period is the number of points that are being averaged
	    //funct.map;
	}
        topic.subscribe("getData", function (start, end) {
	    var URL = "http://metobs.ssec.wisc.edu/app/rig/tower/data/json?symbols=";
	    funct.forEach(dataTypes, function (item) {
		URL = URL + item + ":";
	    });
	    URL = URL.slice(0, -1);
	    URL = URL + "&begin=" + stringDate(start) + "&end=" + stringDate(end);
	    console.log(URL);
            request.get("data/realData.json", {
	        handleAs: "json",
	        timeout: 5000
	    }).then( 
	        function (response) {
                    topic.publish("removePlots");
		    topic.publish("removeOptions");
		    response.stamps = funct.map(response.stamps, function (item) { 
			return item.split(" ")[1].replace(/:/g, "");
		    });

		    funct.forEach(response.symbols, function (pltName) {
			var index = response.symbols.indexOf(pltName);
			
			var plotObject = {
			    title: pltName,
			    series: [funct.map(response.data, function (set) {
				var index2 = response.data.indexOf(set); //for loop might be faster because dont have to index the set
				return {"x": response.stamps[index2], "y": set[index]};
			    })]
			};
			
		        topic.publish("addDataSet", plotObject);
		    });
	        },
	        function (error) {
		    alert(error);
		    console.log(error);
	        }
	    );
        });

        topic.publish("getData", registry.byId("startTime").value, registry.byId("endTime").value);
    });
