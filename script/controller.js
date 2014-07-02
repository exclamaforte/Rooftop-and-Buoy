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
     "dojo/domReady!"
    ], function (dom, on, topic, style, query, registry, ToggleButton, date, funct, domConstruct, 
		 ChartWidgit, theme, Lines, Tooltip, Magnify, request, Indicator, ready, script, Default,
		 SelectableLegend, ContentPane, Areas, MarkersOnly, Chart, ChartWidgit2D, IndicatorElement,
		 has, hub, win, Legend, CB) {

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
		topic.publish("cancelAutoDataUpdate");
	    } else {
		style.set("customTime", "display", "none");
		style.set("autoUpdateContainer", "display", "block");
		topic.publish("dataUpdate");
		if (registry.byId("timeAutoUpdate").checked === true) {
		    topic.publish("addAutoDataUpdate");
		}
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

	on(registry.byId("toggleButton"), "click", function (e) {
	    var toggle = registry.byId("toggleButton");
	    if(toggle.value) {
		style.set("controls", "display", "block");
		toggle.set("label", "Hide Controls");
		toggle.set("value", false);
	    } else {
		style.set("controls", "display", "none");
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

	topic.subscribe("addLoading", function (name) {
	    registry.byId("graphHolder").addChild(new ContentPane({
		id: name + "Loading",
		"class": "loading",
		innerHTML: "Loading " + name
	    }));
	});

	topic.subscribe("removeLoading", function (name) {
	    registry.byId(name + "Loading").destroy();
	});

	topic.subscribe("addAutoDataUpdate", function () {
	    var button = registry.byId("timeAutoUpdate");
	    button.cancel = setInterval(function () {
		topic.publish("dataUpdate");
	    }, 60000);
	});
	topic.subscribe("cancelAutoDataUpdate", function () {
	    var button = registry.byId("timeAutoUpdate");
	    if (typeof button.cancel !== 'undefined') {
		clearInterval(button.cancel);
	    }
	    //button.checked = false;
	});
	topic.subscribe("dataUpdate", function() {
	    topic.publish("dateChange", date.add(new Date(), "hour", -1 * registry.byId("timeOptionsSelect").value), new Date());
	});

	topic.subscribe("addLegend", function (plotHolder) {
	    var legenddiv = new ContentPane ({
		id: plotHolder.title + "LegendDiv"
	    });

	    var legend = new Legend ({
		chart: registry.byId(plotHolder.title),
		id: plotHolder.title + "Legend",
		"class": "legend"
	    });

	    var plotDisableButton = new CB ({
		id: plotHolder.title + "LegendCheck",
		checked: true,
		valuee: true
	    });
	    on(plotDisableButton, "click", function () { 
		if (!plotDisableButton.valuee) {
		    plotDisableButton.valuee = true;
		    topic.publish("showPlot", plotHolder);
		    topic.publish("rsize");
		} else {
		    plotDisableButton.valuee = false;
		    topic.publish("hidePlot", plotHolder);
		    topic.publish("rsize");
		}
	    });
	    legenddiv.addChild(plotDisableButton);
	    legenddiv.addChild(legend);
	    registry.byId("key").addChild(legenddiv);
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
	    var percentage = .97 *(style.get("graphHolder", "height") - 35) / num;
	    var width = style.get("graphHolder", "width") * .97;
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
	    query(".legend").forEach( function(item) {
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

        topic.subscribe("hidePlot", function (plotHolder) {
	    style.set(plotHolder.title, "display", "none");
/*	    var plot = registry.byId(plotHolder.title);
	    if (!(typeof plot === "undefined" )) {
	        plot.destroyRecursive();
	    }
*/
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
            query(".graph").forEach( function(item) {
                domConstruct.destroy(item);
                registry.remove(item.id);
                registry.remove(item.id + "_splitter");
                //have to remove the splitter crated by the border container
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
	var dispFunct = function (name) { 
	    return function (firstDataPoint, secondDataPoint, fixed, precision) {
		return name + " = (" + formatDate(firstDataPoint.x.getTime().toString()) + "  ,   " + firstDataPoint.y.toFixed(2) + ")";
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
	    holder.chart.plotArea = {
		height: plotHolder.height, 
		width: plotHolder.width
	    };
	    style.set(holder, "width", plotHolder.width.toString() + "px");
	    style.set(holder, "height", plotHolder.height.toString() + "px");
	    domConstruct.place(holder.domNode, "graphHolder", "first");
	    var chartType = Lines;
	    if (plotHolder.title === "Wind Direction") {
		chartType = MarkersOnly;
	    }

	    //enable cash, add labelSizeChange (if drop labels is not working) if add zoom feature.
	    holder.chart
		.addPlot("default", {type: chartType, markers:false, lines: true, stroke: {width: 2}, margins: {l:0, t:0, r:0, b:0}})
	        //.addAxis("x", {fixLower: "major", fixUpper: "minor", labelFunc: formatDate, titleOrientation:"away", 
 		//	       titleGap: 5, min: plotHolder.plots[0].series[0].x, max: plotHolder.plots[0].series[plotHolder.plots[0].series.length - 1].x})
	        .addAxis("y", {vertical: true, fixLower: "minor", fixUpper: "major", title: plotHolder.unit, titleOrientation:"away", titleGap: 8, natural:true}) 
	        .setTheme(theme);


	    //holder.chart.title = plotHolder.title;
	    holder.chart.titleGap = 0;
	    holder.chart.titleFont = "15pt";

	    var yOffset = 20;
	    funct.forEach(plotHolder.plots, function (seriesObject, index) {
		var clr = colorHolder[seriesObject.title];
		if (typeof clr === "undefined") {
		    clr = getColor();
		    colorHolder[seriesObject.title] = clr;
		}

		holder.chart.addSeries(seriesObject.title, seriesObject.series, {plot:"default", color: clr, width: 1});

		
		//add vertical indicator to chart
		var interactor = new Indicator(holder.chart, "default", { //have to remember to change series
		    dualIndicator: true, 
		    series: seriesObject.title, 
		    labelFunc: dispFunct(seriesObject.title), 
		    offset: {x: 0, y: yOffset * index}, 
		    "class": "interactor",
		    mouseOver: true
		});
		interactor.onMouseDown = function () {
		    funct.forEach(registry.byClass("interactor"), function (item) {
			item._isMouseDown = true;
			if(has("ie")){
			    item._handles.push(hub.connect(item.chart.node, "onmousemove", item, "onMouseMove"));
			    item._handles.push(hub.connect(item.chart.node, "onmouseup", item, "onMouseUp"));
			    item.chart.node.setCapture();
			}else{
			    item._handles.push(hub.connect(win.doc, "onmousemove", item, "onMouseMove"));
			    item._handles.push(hub.connect(win.doc, "onmouseup", item, "onMouseUp"));
			}	
		    });
		};
		
		interactor.onMouseMove = function (event) {
		    funct.forEach(registry.byClass("interactor"), function (item) {
			if(item._isMouseDown || item.opt.mouseOver) {
			    item._onMouseSingle(event);
			    
			}
		    });
		};
				
		interactor.onMouseUp = function(event){
		    funct.forEach(registry.byClass("interactor"), function (item) {
			var plot = item.chart.getPlot(item._uName);
			plot.stopTrack();
			item._isMouseDown = false;
			item._disconnectHandles();
			plot.pageCoord = null;
			plot.dirty = true;
			item.chart.render();
		    });
		};
		topic.publish("removeLoading", seriesObject.title);
	    });

	    var xqp = plotHolder.conversionFunction;
	    if (typeof xqp !== "undefined") {
		holder.chart
		    .addPlot("other", {type: chartType, hAxis: "x", vAxis: "other y", lines:true})
		    .addAxis("other y", {vertical: true, fixLower:"major", fixUpper: "major", leftBottom: false, 
					 min: xqp(plotHolder.min), max: xqp(plotHolder.max), title: plotHolder.otherLabel, titleOrientation:"away"});
	    }

	    holder.chart.render();
	    if (dom.byId(plotHolder.title + "Legend") === null) {
		topic.publish("addLegend", plotHolder);
	    }
	});
    });
