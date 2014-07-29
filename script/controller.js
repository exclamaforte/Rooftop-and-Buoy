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
     "script/CustomWidget", 
     "dojox/charting/themes/Claro", 
     "dojox/charting/plot2d/Lines", 
     "dojox/charting/action2d/Tooltip",
     "dojox/charting/action2d/Magnify", 
     "dojo/request", 
     "script/CustomIndicator", 
     "dojo/ready", 
     "dojo/request/script", 
     "dojox/charting/axis2d/Default",
     "dojox/charting/widget/SelectableLegend", 
     "dijit/layout/ContentPane", 
     "dojox/charting/plot2d/Areas", 
     "dojox/charting/plot2d/MarkersOnly",
     "dojox/charting/action2d/_IndicatorElement",
     "dojo/sniff",
     "dojo/_base/connect",
     "dojo/_base/window",
     "dojox/charting/widget/Legend",
     "dijit/form/CheckBox",
     "dojo/mouse",
     "dojo/dom-geometry",
     "dojo/_base/lang",
     "dijit/form/Button",
     "script/NoTicks",
     "dojo/_base/array",
     "dojo/domReady!"
    ], function (dom, on, topic, style, query, registry, ToggleButton, date, funct, domConstruct, 
		 ChartWidgit, theme, Lines, Tooltip, Magnify, request, Indicator, ready, script, Default,
		 CustomSelectableLegend, ContentPane, Areas, MarkersOnly, IndicatorElement,
		 has, hub, win, Legend, CB, mouse, domGeom, lang, Button, NoTicks, array) {

	on(registry.byId("timeAutoUpdate"), "change", function (e) {
	    var button = registry.byId("timeAutoUpdate");
	    if (button.checked === true && style.get("autoUpdateContainer", "display") === "block") { 
		topic.publish("addAutoDataUpdate", button);
	    } else {
		topic.publish("cancelAutoDataUpdate", button);
	    }
	});
	on(dom.byId("disableAll"), "click", function (e) {
	    funct.forEach(registry.byClass("legend"), function (item) {
		var nm = formatName(item.id.slice(0, -6), 6);
		item.set("label" , nm + "- Enable");
		item.value = true;
		topic.publish("hidePlot", item.id.slice(0, -6));
	    });
	    topic.publish("hardrsize");
	});
	on(dom.byId("enableAll"), "click", function (e) {
	    funct.forEach(registry.byClass("legend"), function (item) {
		var nm = formatName(item.id.slice(0, -6), 6);
		item.set("label" , nm + "- Disable");
		item.value = false;
		topic.publish("showPlot", item.id.slice(0, -6));
	    });
	    topic.publish("hardrsize");
	});


	on(registry.byId("timeOptionsSelect"), "change", function (e) {
	    var value = registry.byId("timeOptionsSelect").value;
	    var button = registry.byId("timeAutoUpdate");
	    if (value === -1) {
		style.set("customTime", "display", "block");
		style.set("autoUpdateContainer", "display", "none");
		topic.publish("cancelAutoDataUpdate", button);
	    } else {
		style.set("customTime", "display", "none");
		style.set("autoUpdateContainer", "display", "block");
		dataUpdate();
		if (button.checked === true) {
		    topic.publish("addAutoDataUpdate", button);
		}
	    }
	});

        on(dom.byId("timeUpdateButton"), "click", function () {
	    var startDate = registry.byId("startDate");
	    var startTime = registry.byId("startTime");
	    var endDate = registry.byId("endDate");
	    var endTime = registry.byId("endTime");
	    var st = new Date(startDate.value.getFullYear(),
			      startDate.value.getMonth(),
			      startDate.value.getDate(),
			      startTime.value.getHours(),
			      startTime.value.getMinutes(),
			      startTime.value.getSeconds(), 0);
	    var et = new Date(endDate.value.getFullYear(),
			      endDate.value.getMonth(),
			      endDate.value.getDate(),
			      endTime.value.getHours(),
			      endTime.value.getMinutes(),
			      endTime.value.getSeconds(), 0);
	    if (date.difference(st, et, "hour") > 30) {
		style.set("time", "display", "none");
		var confirmLongTime = new ContentPane({
		    id: "confirmLongTime",
		    innerHTML: '<p style="color:red"> This time segment has a lot of data<br>and might take a long time to load<br>Do you want to continue?</p>'
		});
		var confirmButton = new Button ({
		    label: "Load",
		    id: "confirmButton",
		    onClick: function () {
			topic.publish("dateChange", st, et);
			registry.remove(confirmLongTime);
			confirmLongTime.destroy();
			style.set("time", "display", "block");
		    }
		});
		var denyButton = new Button ({
		    label: "Cancel",
		    id: "denyButton",
		    onClick: function () {
			registry.remove(confirmLongTime);
			confirmLongTime.destroy();
			style.set("time", "display", "block");
		    }
		});
		confirmLongTime.addChild(confirmButton);
		confirmLongTime.addChild(denyButton);
		registry.byId("controls").addChild(confirmLongTime);
	    } else {
		topic.publish("dateChange", st, et);
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
	    topic.publish("hardrsize");
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
		var start = 10;
		var yOffset = 20;
		funct.forEach(holder.chart.series, function (seriesObject, index) {
		    if (! hasIndicator(holder.chart, seriesObject)) {
			var indicator = new Indicator(holder.chart, "default", {
			    font:"10pt",
			    id: seriesObject.name + "indicator",
			    dualIndicator: true,
			    series: seriesObject.name,
			    labelFunc: dispFunct(seriesObject.name),
			    offset: {x: 0, y: yOffset * index + start},
			    "class": "indicator"
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
	    if (typeof registry.byId("Loading2") === "undefined") {
		registry.byId("controls").addChild(new ContentPane({
		    id: "Loading2",
		    innerHTML: "Loading Data from Server..."
		}));
	    }
	});

	topic.subscribe("removeLoading", function () {
	    if (typeof registry.byId("Loading2") !== "undefined") {
		registry.byId("Loading2").destroy();
	    }
	});

	topic.subscribe("addAutoDataUpdate", function (button) {
	    if (typeof button.event === "undefined") {
		button.event = setInterval(function () {
		    dataUpdate();
		}, 60000);
	    }
	});
	topic.subscribe("cancelAutoDataUpdate", function (button) {
	    if (typeof button.event !== "undefined") {
		clearInterval(button.event);
		button.event = undefined;
	    }
	});

	function dataUpdate() {
	    var n = new Date();
	    topic.publish("dateChange", date.add(n, "hour", -1 * registry.byId("timeOptionsSelect").value), n);
	};

	topic.subscribe("updateLegend", function () {
	    funct.forEach(registry.byClass("graph"), function (item) {
		if (style.get(item.id, "display") === "none") {
		    registry.byId(item.id + "Legend").set("label", formatName(item.id, 6) + "- Enable");
		    registry.byId(item.id + "Legend").set("value", true);
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
		} else {
		    plotDisableButton.set("label" , nm + "- Enable");
		    plotDisableButton.value = true;
		    topic.publish("hidePlot", plotHolder);
		    style.set(plotDisableButton, "background-color", "Blue");
		}
		topic.publish("hardrsize");
	    });
	    //have to find the chart in the lowest in the list
	    domConstruct.place(plotDisableButton.domNode, "key", "first");
	});

	var makeNewTimeout = function (fun, time) {
	    var timeout = 0;
	    return function () {
		clearTimeout(timeout);
		timeout = setTimeout(fun, time);
	    };
	};
	var rsizefunct = function () {
	    var charts = registry.byClass("graph");
	    var num = 0;
	    funct.forEach(charts, function (item) {
		if (style.get(item.domNode, "display") === "block") {
		    num += 1;
		}
	    });
	    var percentage = Math.floor((style.get("graphHolder", "height") - 35) / num);
	    var width = style.get("graphHolder", "width");
	    charts.forEach(function (item) {
		item.chart.resize({h:percentage, w:width});
	    });
	    funct.forEach(registry.byId("indicator"), function (indicator) {
	    	indicator.sizeUpdate = true;
	    });
	};

	var resizeHandler = makeNewTimeout(rsizefunct, 300);

        topic.subscribe("rsize", function () {
	    resizeHandler();
        });
	topic.subscribe("hardrsize", function () {
	    rsizefunct();
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

        topic.subscribe("dateChange", function (sD, eD) {
	    if (date.compare(sD, eD) < 0 ) {
		if (date.difference(sD, eD, "second") >= 10) {
		    if (date.compare(eD, new Date()) <= 0) {
			topic.publish("getData", sD, eD);
		    } else {
			alert("The sensor does not posses the ability to see into the future.");
		    }
		} else {
		    alert("Start time must 10 seconds before end time.");
		}
	    } else {
		alert("Start time must before end time.");
	    }

        });
	var lowestDisplay;
	function getShownPlots () {
	    return funct.filter(registry.byClass("graph"), function (item) {
		return style.get(item.id, "display") === "block";
	    });
	}
	function lowest () {
	    var hidden = getShownPlots();
	    return funct.foldr(hidden, function (previous, next) {
		return order.lessThan(previous.id, next.id)? previous : next;
	    }, false);
	}
        topic.subscribe("hidePlot", function (plotHolder) {
	    var title = plotHolder.title;
	    if (typeof plotHolder === "string") {
		title = plotHolder;
	    }
	    style.set(title, "display", "none");
	    registry.byId(title).enabled = false;
	    var low2 = lowest();
	    if ((low2 !== false) && (lowestDisplay.id !== low2.id)) {
		lowestDisplay.chart.axes.x.destroy();
		low2.chart.axes.x.destroy();
		var xargs1 = {type: NoTicks, labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			      titleGap: 0, fontColor:"Black", majorTicks: false};
		var xargs2 = {type: Default, labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			      titleGap: 0, fontColor:"Black", majorTicks: false};
		lowestDisplay.chart.addAxis("x", xargs1);
		low2.chart.addAxis("x", xargs2);
		low2.chart.render();
		lowestDisplay = low2;
	    }
	});
        topic.subscribe("showPlot", function (plotHolder) {
	    var title = plotHolder.title;
	    if (typeof plotHolder === "string") {
		title = plotHolder;
	    }
	    style.set(title, "display", "block");
	    registry.byId(title).enabled = true;
	    var low2 = lowest();
	    if (lowestDisplay.id !== low2.id) {
		lowestDisplay.chart.axes.x.destroy();
		low2.chart.axes.x.destroy();
		var xargs1 = {type: NoTicks, labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			      titleGap: 0, fontColor:"Black", majorTicks: false};
		var xargs2 = {type: Default, labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			      titleGap: 0, fontColor:"Black", majorTicks: false};
		lowestDisplay.chart.addAxis("x", xargs1);
		low2.chart.addAxis("x", xargs2);
		lowestDisplay.chart.render();
		low2.chart.render();
		lowestDisplay = low2;
	    }
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
		return formatName(name, 3) + ":(" + time + " , " + firstDataPoint.y.toFixed(2) + ")";
	    };
	};
	var axisFunction = function (text, value, precision) {
	    return value.toFixed(1).toString();
	};

	var getColor = getColorFromRotation();
	var colorHolder = {};

        function PoSet () {
	    this.order = [];
	    this.length = 0;
	}
	PoSet.prototype.add = function (item) {
	    if (!this.contains(item)) {
		this.order.push(item);
		this.length += 1;
	    }
	};
	PoSet.prototype.contains = function (item) {
	    return 0 <= array.indexOf(this.order, item);
	};
	PoSet.prototype.lessThan = function (item1, item2) {
	    if (this.contains(item1) && this.contains(item2)) {
		return array.indexOf(this.order, item1) < array.indexOf(this.order, item2);
	    } else {
		return false;
	    }
 	};
	PoSet.prototype.remove = function (item) {
	    var index = array.indexOf(this.order, item);
	    if (index > -1) {
		this.order.splice(index, 1);
	    }
	};
	PoSet.prototype.last = function () {
	    return this.order[0];
	};
	var order = new PoSet(); //contains the the order of the plots on the page using their names as keys.

	topic.subscribe("addDataSet", function (plotHolder) {
	    //creating chart widget
	    var marg =  {l:6,
			 t:6,
			 r:0,
			 b:2};
	    var holder = new ChartWidgit({
	        title: plotHolder.title,
		margins: marg,
	        id: plotHolder.title,
		"class": "graph",
		style: "height: " + plotHolder.height.toString() + "px"
	    });
	    //setting the size of the underlying plot so that we dont have to render twice.
	    holder.chart.surface.setDimensions(plotHolder.width, plotHolder.height);
	    domConstruct.place(holder.domNode, "graphHolder", "first");
	    var chartType = Lines;
	    var yargs = {fixLower: "major", fixUpper: "major",vertical: true, title: plotHolder.unit, titleOrientation:"away",
			 natural:true, labelFunc:axisFunction, minorTicks: false, titleGap: 1};
	    var xargs = {type: NoTicks, labelFunc: formatDate, titleOrientation:"away", hidden: true,
 			 titleGap: 0, fontColor:"Black", majorTicks: false};
	    if (plotHolder.title === "Wind Direction") {
		chartType = MarkersOnly;
		yargs.from = 0;
		yargs.to = 360;
		yargs.majorTickStep = 90;
	    }
            if (plotHolder.title === "Relative Humidity") {
                yargs.from = 0;
                yargs.to = 100;
                yargs.majorTickStep = 10;
            }
	    if (plotHolder.title === "Accumulated Precipitation") {
		if (plotHolder.min === plotHolder.max) {
		    yargs.from = 0;
		    yargs.to = .2;
		    yargs.titleGap = 20;
		}
	    }
	    if (order.length === 0) {
		xargs.type = Default;
		lowestDisplay = holder;
	    }
	    holder.chart
		.addPlot("default", {type: chartType, markers: false, lines: true, stroke: {width: 2}, margins: {l:0, t:0, r:0, b:0}, titleGap: 0})
	        .addAxis("x", xargs)
	        .addAxis("y", yargs)
	        .setTheme(theme);
	    holder.enabled = true;

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
		var propertyObject = {vertical: true, fixLower:"major", fixUpper: "major", leftBottom: false, minorTicks: false,
				      title: plotHolder.otherLabel, titleOrientation:"away", titleGap: 8, natural:true};
		if (plotHolder.title === "Wind Direction") {
		    propertyObject.labels = [
			{value: 0, text: "N"},
			{value: 90, text: "E"},
			{value: 180, text: "S"},
			{value: 270, text: "W"},
			{value: 360, text: "N"}
		    ];
		    propertyObject.from = 0;
		    propertyObject.to = 360;
		    propertyObject.majorTickStep = 90;
		} else {
		    propertyObject.min = xqp(plotHolder.min);
		    propertyObject.max = xqp(plotHolder.max);
		}
                if (plotHolder.title === "Altimeter") {
                    propertyObject.titleGap = -30;
                }
	        holder.chart
		    .addPlot("other", {type: chartType, hAxis: "x", vAxis: "other y", lines:true, margins:{l:0, t:0, r:0, b:0}})
		    .addAxis("other y", propertyObject);
	    }

	    holder.chart.render();
	    if (dom.byId(plotHolder.title + "Legend") === null) {
		topic.publish("addLegend", plotHolder);
	    }
	    order.add(plotHolder.title);
	});
    });
