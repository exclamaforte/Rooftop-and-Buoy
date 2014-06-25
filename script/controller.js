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

        topic.subscribe("addOption", function (plotHolder) {
	    registry.byId("optionsGrid").addChild(
	        new ToggleButton({
		    showLabel: true,
		    checked: true,
		    label: plotHolder.title + " - On",
		    id: plotHolder.title + "Toggle",
		    "class": "option",
		    onChange: function (val) { 
		        if (val) {
			    this.set("label", plotHolder.title + " - On");
			    topic.publish("addDataSet", plotHolder);
		        }
		        else {
			    this.set("label", plotHolder.title + " - Off");
			    topic.publish("removePlot", plotHolder);
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

        topic.subscribe("removePlot", function (plotHolder) {
	    var plot = registry.byId(plotHolder.title);
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

        topic.subscribe("addDataSet", function (plotHolder) {
	    var holder = new ChartWidgit({
	        title: plotHolder.title,
		margins: 0,
	        id: plotHolder.title, "class": "graph",
	        theme: theme
	    });

	    registry.byId("graphHolder").addChild(holder);
	    
	    holder.chart
	        .addPlot("default", {type: Lines, markers:false, lines: true})
	        .addAxis("x", {fixLower: "major", fixUpper: "major", labelFunc: formatDate})
	        .addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major"})
	        .setTheme(theme);
	    //holder.chart.title = plotArray[0].title;
	    holder.chart.titleGap = 10;
	    holder.chart.titleFont = "15pt";

	    var dispFunct = function (name) { 
		return function (firstDataPoint, secondDataPoint, fixed, precision) {
		    return name + " = (" + formatDate(firstDataPoint.x.getTime().toString()) + "  ,   " + firstDataPoint.y.toFixed(2) + ")";
		};
	    };
	    var prec = 0.1;
	    var yOffset = 20;

	    funct.forEach(plotHolder.plots, function (seriesObject, index) {
		//add series to chart
		holder.chart.addSeries(seriesObject.title, seriesObject.series);
		//add vertical indicator to chart
		var interactor = new Indicator(holder.chart, "default", { //have to remember to change series
		    dualIndicator: true, series: seriesObject.title, precision: prec, labelFunc: dispFunct(seriesObject.title), 
		    offset: {x: 0, y: index * yOffset}
		});
	    });
		

	    
	    if (dom.byId(plotHolder.title + "Toggle") === null) {
		topic.publish("addOption", plotHolder);
	    }
	    holder.chart.render();
	    topic.publish("rsize");

	});
    });
