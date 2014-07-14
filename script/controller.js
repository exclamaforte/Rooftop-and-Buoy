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
     "dojox/charting/action2d/CustomIndicator",
     "dojo/ready",
     "dojo/request/script",
     "dojox/charting/axis2d/Default",
     "dojox/charting/widget/SelectableLegend",
     "dijit/layout/ContentPane",
     "dojox/charting/plot2d/Areas",
     "dojox/charting/plot2d/MarkersOnly",
     "dojox/charting/Chart",
     "dojox/charting/widget/Chart2D",
     "dojox/charting/action2d/_IndicatorElement",
     "dojo/sniff",
     "dojo/_base/connect",
     "dojo/_base/window",
     "dojox/charting/widget/Legend",
     "dijit/form/CheckBox",
     "dojo/mouse",
     "dojo/dom-geometry",
     "dojo/_base/lang",
     "dojox/charting/axis2d/Invisible",
     "dijit/form/Button",
     "dojo/domReady!"
    ], function (dom, on, topic, style, query, registry, ToggleButton, date, funct, domConstruct, 
		 ChartWidgit, theme, Lines, Tooltip, Magnify, request, Indicator, ready, script, Default,
		 CustomSelectableLegend, ContentPane, Areas, MarkersOnly, Chart, ChartWidgit2D, IndicatorElement,
		 has, hub, win, Legend, CB, mouse, domGeom, lang, Invisible, Button) {

	on(registry.byId("timeAutoUpdate"), "change", function (e) {
	    var button = registry.byId("timeAutoUpdate");
	    if (button.checked === true && style.get("autoUpdateContainer", "display") === "block") { 
		topic.publish("addAutoDataUpdate");
	    } else {
		topic.publish("cancelAutoDataUpdate");
	    }
	});

	on(registry.byId("timeOptionsSelect"), "change", function (e) {
	    var value = registry.byId("timeOptionsSelect").value;
	    if (value === -1) {
		style.set("customTime", "display", "block");
		style.set("autoUpdateContainer", "display", "none");
	    } else {
		style.set("customTime", "display", "none");
		style.set("autoUpdateContainer", "display", "block");
		topic.publish("dataUpdate");
		if (registry.byId("timeAutoUpdate").checked === true) {
		    topic.publish("addAutoDataUpdate");
		}
	    }
	    topic.publish("cancelAutoDataUpdate");
	    if (registry.byId("timeAutoUpdate").checked === true) {
		topic.publish("addAutoDataUpdate");
	    }
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

	on(registry.byId("disableIndicators"), "click", function (e) {
	    var toggle = registry.byId("disableIndicators");
	    if (toggle.value) {
		topic.publish("addIndicators");
		toggle.set("label", "Disable Indicators");
		toggle.set("value", false);
	    } else {
		topic.publish("removeIndicators");
		toggle.set("label", "Enable Indicators");
		toggle.set("value", true);
	    }
	});
	
	on(registry.byId("toggleButton"), "click", function (e) {
	    var toggle = registry.byId("toggleButton");
	    if(toggle.value) {
		style.set("controls", "display", "block");
		var left = style.get("appLayout", "width");
		style.set("graphHolder", "left", "250px");
		style.set("graphHolder", "width", (left - 250).toString() + "px");
		toggle.set("label", "Hide Controls");
		toggle.set("value", false);
	    } else {
		style.set("controls", "display", "none");
		style.set("graphHolder", "left", "0px" );
		style.set("graphHolder", "width", "100%" );
		toggle.set("label", "Show Controls");
		toggle.set("value", true);
	    }
	    topic.publish("rsize");
	});

        on(window, "resize", function (e) {topic.publish("rsize");});
        
	//------------event handling -------------- ==========
	var newCounter = function () {
	    var count = 0;
	    return function () {
		count+=1;
		return count - 1;
	    };
	};
	
	function hasIndicator (chart, seriesObject) {
	    return typeof chart.plots["mouseIndicator" + seriesObject.name] !== "undefined";
	}

	topic.subscribe("addIndicators", function () {
	    funct.forEach(registry.byClass("graph"), function (holder) { 
		var yOffset = 20;
		funct.forEach(holder.chart.series, function (seriesObject, index) {
		    if (! hasIndicator(holder.chart, seriesObject)) {
			var indicator = new Indicator(holder.chart, "default", { 
			    font:"10pt",
			    id: seriesObject.name + "indicator",
			    dualIndicator: true, 
			    series: seriesObject.name, 
			    labelFunc: dispFunct(seriesObject.name), 
			    offset: {x: 0, y: yOffset * index},
			    "class": "indicator",
			    mouseOver: true
			});
			indicator.id = seriesObject.name + "indicator";
			indicator.class = "indicator";
			registry.add(indicator);
		    }
		});
	    });
	});

	topic.subscribe("removeIndicators", function () {
	    funct.forEach(registry.byClass("indicator"), function (indicator) {
		indicator.destroy();
		registry.remove(indicator.id);
	    });
	});

	topic.subscribe("addLoading", function () {
	    registry.byId("controls").addChild(new ContentPane({
		id: "Loading2",
		"class": "Loading",
		innerHTML: "Loading Data from Server" 
	    }));

	});

	topic.subscribe("removeLoading", function () {
	    registry.byId("Loading2").destroy();
	});
	var events = [];
	topic.subscribe("addAutoDataUpdate", function () {
	    events.concat(setInterval(function () {
		topic.publish("dataUpdate");
	    }, 4000));
	});
	topic.subscribe("cancelAutoDataUpdate", function () {
	    funct.forEach(events, function (e) {
		clearInterval(e);
	    });
	});
	topic.subscribe("dataUpdate", function() {
	    topic.publish("dateChange", date.add(new Date(), "hour", -1 * registry.byId("timeOptionsSelect").value), new Date());
	});

	function getHiddenPlots () {
	    return funct.filter(registry.byClass("graph"), function (item) {
		return style.get(item.id, "display") === "none";
	    });
	}

	topic.subscribe("updateLegend", function () {
	    funct.forEach(registry.byClass("graph"), function (item) {
		if (style.get(item.id, "display") === "none") {
		    registry.byId(item.id + "Legend").set("label", item.id + "- Enable");
		}
	    });
	});

	topic.subscribe("addLegend", function (plotHolder) {
	    var nm = formatName(plotHolder.title, 6);
	    var plotDisableButton = new Button ({
		id: plotHolder.title + "Legend",
		label: nm + "- Disable",
		"class": "legend",
		value: false
	    });

	    on(plotDisableButton, "click", function () { 
		if (plotDisableButton.value) {
		    plotDisableButton.set("label" , nm + "- Disable");
		    plotDisableButton.value = false;
		    topic.publish("showPlot", plotHolder);
		    style.set(plotDisableButton, "background-color", "Red");
		    topic.publish("rsize");
		} else {
		    plotDisableButton.set("label" , nm + "- Enable");
		    plotDisableButton.value = true;
		    topic.publish("hidePlot", plotHolder);
		    style.set(plotDisableButton, "background-color", "Blue");
		    topic.publish("rsize");
		}
	    });

	    domConstruct.place(plotDisableButton.domNode, "key", "first");
	});

        topic.subscribe("rsize", function (e) {
	    var charts = registry.byClass("graph");
	    var num = 0;
	    funct.forEach(charts, function (item) {
		if (style.get(item.domNode, "display") === "block") {
		    num += 1;
		}
	    });

	    registry.byId("graphHolder").resize();
	    var percentage = (style.get("graphHolder", "height") - 35) / num;
	    var width = style.get("graphHolder", "width");
	    charts.forEach(function (item) {
		item.chart.resize({h:percentage, w:width});//add support to resize the stuff.
	    });
        });

	topic.subscribe("removeOptions", function () {
	    query(".option").forEach( function(item) {
                domConstruct.destroy(item);
                registry.remove(item.attributes.widgetid.value);
                registry.remove(item);
	    });
	});

	topic.subscribe("removeLegends", function () {
	    registry.byClass("legend").forEach( function (item) {
                item.destroy();	    
	    });
	});

	topic.subscribe("hideHideControls", function () {
	    style.set("toggleButton", "display", "none");
	});

	topic.subscribe("showHideControls", function () {
	    style.set("toggleButton", "display", "block");
	});

        topic.subscribe("dateChange", function (sD, eD) {
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

        topic.subscribe("hidePlot", function (plotHolder) {
	    style.set(plotHolder.title, "display", "none");
        });

	topic.subscribe("hidePlots", function (plotList) {
	    funct.forEach(plotList, function (plot) {
		style.set(plot.id, "display", "none");
	    });
	});
        topic.subscribe("showPlot", function (plotHolder) {
	    style.set(plotHolder.title, "display", "block");
        });
	
	topic.subscribe("removeLegend", function (plotHolder) {
	    var legend = registry.byId(plotHolder.title + "Legend");
	    if (!(typeof legend === "undefined")) {
		legend.destroy();
	    }
	    topic.publish("rsize");
	});

        topic.subscribe("removePlots", function () {
            registry.byClass("graph").forEach( function(item) {
		item.destroy();
            });
	    registry.byClass("indicator").forEach( function(item) {
		item.destroy();
	    });
        });

	function formatDate(d) {
	    var dee = new Date(parseInt(d));
	    var hldr = dee.toString().split(" ").slice(0, 5);
	    return hldr[0] + " " + hldr[1] + " " + hldr[2] + " " + hldr[3] + " " + hldr[4];
	}
	
	function getColorFromRotation () {
	    var index = 0;
	    var colorRotation = ["blue", "blueviolet", "darkseagreen", "crimson", "darkgoldenrod", "darkgreen", "darkorange", "olive", "springgreen"];
	    return function () {
		var cr = colorRotation[index];
		index = index % colorRotation.length;
		index = index + 1;
		return cr;
	    };
	};
	function formatName (name, num) {
	    return funct.reduce(funct.map(name.split(" "), function (e) {
		return e.slice(0, num);
	    }), function (a, b) {
		return a + " " + b;
	    });
	}
	var dispFunct = function (name) { 
	    return function (firstDataPoint, secondDataPoint, fixed, precision) {
		var time = firstDataPoint.x.toTimeString().split(" ")[0];
		return formatName(name, 3) + ":(" + time + "  ,   " + firstDataPoint.y.toFixed(2) + ")";
	    };
	};

	var getColor = getColorFromRotation();
	var colorHolder = {};
        topic.subscribe("addDataSet", function (plotHolder) {
	    var holder = new ChartWidgit({
	        title: plotHolder.title,
		margins: 0,
	        id: plotHolder.title, 
		"class": "graph"
	    });
	    style.set(holder, "height", plotHolder.height.toString() + "px");
	    style.set(holder, "width", plotHolder.width.toString() + "px");
	    holder.chart.surface.setDimensions(plotHolder.width, plotHolder.height);

	    holder.chart.plotArea = {
		height: plotHolder.height, 
		width: plotHolder.width
	    };
	    domConstruct.place(holder.domNode, "graphHolder", "first");
	    var chartType = Lines;
	    if (plotHolder.title === "Wind Direction") {
		chartType = MarkersOnly;
	    }
	    holder.chart
		.addPlot("default", {type: chartType, markers: false, lines: true, stroke: {width: 2}, margins: {l:0, t:0, r:0, b:0}})
	        .addAxis("x", {labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			       titleGap: 0, fontColor:"Black"}) 
	        .addAxis("y", {fixLower: "major", fixUpper: "major",vertical: true, title: plotHolder.unit, titleOrientation:"away", titleGap: 8, natural:true}) 
	        .setTheme(theme);
	    var mg = 6;
	    holder.chart.margins = {l:mg, t:mg, r:mg, b:mg};

	    //holder.chart.title = plotHolder.title;
	    holder.chart.titleGap = 0;
	    holder.chart.titleFont = "15pt";


	    funct.forEach(plotHolder.plots, function (seriesObject, index) {
		var clr = colorHolder[seriesObject.title];
		if (typeof clr === "undefined") {
		    clr = getColor();
		    colorHolder[seriesObject.title] = clr;
		}
		holder.chart.addSeries(seriesObject.title, seriesObject.series, {plot:"default", color: clr, width: 1});
	    });

	    var xqp = plotHolder.conversionFunction;
	    if (typeof xqp !== "undefined") {
		if (plotHolder.title === "Wind Direction") {
		    holder.chart
			.addPlot("other", {type: chartType, hAxis: "x", vAxis: "other y", lines:true, margins:{l:0, t:0, r:0, b:0}})
			.addAxis("other y", {vertical: true, fixLower:"major", fixUpper: "major", leftBottom: false, 
					     title: plotHolder.otherLabel, titleOrientation:"away", titleGap: 8, natural:true, 
					     labels: [
						 {value: 0, text: "N"},
						 {value: 360, text: "N"},
						 {value: 90, text: "E"},
						 {value: 180, text: "S"},
						 {value: 270, text: "W"}
					     ]}
				); 
		} else {
		    holder.chart
			.addPlot("other", {type: chartType, hAxis: "x", vAxis: "other y", lines:true, margins:{l:0, t:0, r:0, b:0}})
			.addAxis("other y", {vertical: true, fixLower:"major", fixUpper: "major", leftBottom: false, 
					     min: xqp(plotHolder.min), max: xqp(plotHolder.max), 
					     title: plotHolder.otherLabel, titleOrientation:"away", titleGap: 8, natural:true}); 
		}
	    }

	    holder.chart.render();
	    if (dom.byId(plotHolder.title + "Legend") === null) {
		topic.publish("addLegend", plotHolder);
	    }
	});
    });
