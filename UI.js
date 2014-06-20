require(
    ["dijit/registry",
     "dijit/layout/BorderContainer",
     "dijit/layout/TabContainer", 
     "dijit/layout/ContentPane",
     "dijit/form/Button",
     "dijit/form/CheckBox",
     "dojo/dom",
     "dojox/grid/DataGrid",
     "dojo/fx/Toggler",
     "dojo/on",
     "dijit/form/TimeTextBox",
     "dojo/topic",
     "dojo/dom-construct",
     "dojo/query",
     "dojo/dom-style",
     "dijit/Calendar",
     "dijit/form/DropDownButton",
     "dijit/DropDownMenu",
     "dijit/MenuItem",
     "dojox/charting/Chart",
     "dojox/charting/themes/Claro",
     "dojox/charting/plot2d/Lines",
     "dojox/charting/widget/Chart",
     "dojox/lang/functional",
     "dijit/form/ValidationTextBox",
     "dojo/_base/xhr",
     "dojo/request",
     "dojox/charting/axis2d/Default",
     "dojo/store/DataStore",
     "dojox/layout/TableContainer",
     "dijit/form/ToggleButton",
     "dojox/charting/action2d/Tooltip",
     "dojox/charting/action2d/Magnify",
     "dojo/store/Observable",
     "dojo/store/Memory",
     "dojo/date",
     "dojo/domReady!"
    ], function (registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler,
 	         on, TimeTextBox, topic, domConstruct, query, style, Calendar, DropDownButton, DropDownMenu, MenuItem,
	         Chart, theme, Lines, ChartWidgit, funct, VTB, xhr, request, Default, DataStore, TableContainer,
                 ToggleButton, Tooltip, Magnify, ObservableStore, MemoryStore, date) {
	registry.byClass = function (className) {
	    return funct.filter(registry.toArray(), function (item) {
		return item.class === className.toString();
	    });	
	};
        //create the BorderContainer and attach it to our appLayout div
        var appLayout = new BorderContainer({
	    design: "headline"
        }, "appLayout");

        //------------------sections------------------------------------------------------------------------------------------
        var controls = new ContentPane({
	    region: "center",
	    id: "controls",
	    tabPosition: "top"
        });
        
        var graphHolder = new ContentPane({
	    region: "right",
            id: "graphHolder", "class": "centerPanel",
            splitter: true, style:"height: 100%;"
        });
        
        //----------------tabs-----------------------------------------------------------------------------------------------
        var display = new ContentPane({
            title: "Display", id: "display", 
	    "class": "controlDiv"
        });

        var time = new ContentPane({
            title: "Time", id: "time",
	    "class": "controlDiv"
        });
        

        //----------------content-----------------------------------------------------------------------------------------------

        /*    var optionsGrid = new DataGrid({
	 query: { id: "optionsGrid"},
	 structure: [
	 {name: "Title", field: "title", width: "60px"},
	 {name: "On/Off", field: "on/off", width: "60px"}
	 ]
         });
         */
        var optionsGrid = new TableContainer({
	    id: "optionsGrid",
	    cols: 2
        });

        var dataMenu = new DropDownMenu({style: "display: none;"});
        var imageMenu = new DropDownMenu({style: "display: none;"});

        var dataFileTypes = ['csv', 'netCDF', 'xls'];
        var imageFileTypes = ['png', 'jpg', 'pdf'];
        
        var downloadData = new DropDownButton({
	    label: "Download Data",
	    id: "downloadData",
	    dropDown: dataMenu
        });
        var downloadImage = new DropDownButton({
	    label: "Download Image",
	    id: "downloadImage", 
	    dropDown: imageMenu
        });

        var downloadDataPane = new ContentPane({
	    title: "size",
	    id: "downloadDataPane", "class": "downloadPane",
	    content: downloadData
        });

        var downloadImagePane = new ContentPane({
	    id: "downloadImagePane", 
	    "class": "downloadPane"
        });
        
        var downloadSizeX = new VTB({
	    type: "text",
	    name: "downloadSizeX", id: "downloadSizeX",
	    value: "400", 
	    regExp:"^[0-9]+$",
	    style: "width: 100px"
	    
        });
        var downloadSizeY = new VTB({
	    type: "text",
	    name: "downloadSizeY", id: "downloadSizeY",
	    value: "600", 
	    regExp:"^[0-9]+$",
	    style: "width: 100px"
        });
        var sameSizeAsCurrent  = new Button ({
	    id: "sameSizeAsCurrent",
	    label: "Same Size as Current Display"
        });

        var toggleButton = new Button({
	    id: "toggleButton"
        });

        var startTime = new TimeTextBox({
	    id: "startTime",
	    value: new Date(),
	    regExp:"^(0[0-9]|[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$",
	    constraints: {
	        timePattern: 'HH:mm:ss',
	        clickableIncrement: 'T00:15:00',
	        visibleIncrement: 'T00:15:00',
	        visibleRange: 'T01:00:00'
	    }
	});

        var endTime = new TimeTextBox({
	    id: "endTime",
	    value: date.add(new Date(), "minute", 15),
	    regExp:"^(0[0-9]|[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$",
	    constraints: {
	        timePattern: 'HH:mm:ss',
	        clickableIncrement: 'T00:15:00',
	        visibleIncrement: 'T00:15:00',
	        visibleRange: 'T01:00:00'
	    }
        });
        
        var calendar = new Calendar({
	    id: "calendar",
	    value: new Date()
        });
        
        var timeUpdateButton = new Button({
	    id: "timeUpdateButton",
	    label: "Update Time"
        });


        //=====--building the dom--=======

	display.addChild(optionsGrid);
        
        time.addChild(calendar);
        time.addChild(startTime);
        time.addChild(endTime);
        time.addChild(timeUpdateButton);

        //constructing the filetype download menu
        dataFileTypes.map(function (item) {	
            dataMenu.addChild( 
                new MenuItem({
	            label: item,
                    iconClass:"dijitEditorIcon dijitEditorIconSave",
	            onClick: function() {topic.publish("saveChart", item);}
                })
            );
        });
        imageFileTypes.map(function (item) { 
            imageMenu.addChild( 
                new MenuItem({
	            label: item,
                    iconClass:"dijitEditorIcon dijitEditorIconSave",
	            onClick: function() {topic.publish("saveChart", item);}
                })
            );
        });

        downloadImagePane.addChild(sameSizeAsCurrent);    
        downloadImagePane.addChild(downloadSizeX);
        downloadImagePane.addChild(downloadSizeY);
        downloadImagePane.addChild(downloadImage);

        controls.addChild(display);
        controls.addChild(downloadImagePane);
	controls.addChild(downloadDataPane);
        controls.addChild(time);
	graphHolder.addChild(toggleButton);
        appLayout.addChild(controls);
        appLayout.addChild(graphHolder);

        //=====Button Behavior=====
        var menuToggler = new Toggler({
	    node: "controls"
        });

	on(sameSizeAsCurrent, "click", function (e) {
	    topic.publish("updateImageSize", style.get("graphHolder", "height"), style.get("graphHolder", "width"));
	});

        on(toggleButton, "click", function(e) {
	    topic.publish("toggleControls");
        });

        var labelAndPublishSet = function (start) {
	    var label = start;
	    return function () {
	        topic.publish("addDataSet", label.toString());
	        label= label+1;
	    };
        }(0);
	


        on(timeUpdateButton, "click", function () {
	    var st = new Date(calendar.value.getFullYear(), calendar.value.getMonth(), calendar.value.getDay(),
				 startTime.value.getHours(), startTime.value.getMinutes(), 
				 startTime.value.getMinutes(), startTime.value.getSeconds(), 0);
	    var et = new Date(calendar.value.getFullYear(), calendar.value.getMonth(), calendar.value.getDay(),
				 startTime.value.getHours(), startTime.value.getMinutes(), 
				 startTime.value.getMinutes(), startTime.value.getSeconds(), 0);				 
	    topic.publish("dateChange", st, et);
	});

        on(window, "resize", function (e) {topic.publish("rsize");});
        //------------event handling -------------- ==========

        topic.subscribe("addOption", function (plotObject) {
	    optionsGrid.addChild(
	        new ToggleButton({
		    showLabel: true,
		    checked: true,
		    label: plotObject.title + " - On",
		    id: plotObject.title + "Toggle",
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
	    
	    graphs.forEach( function (item) {
                //registry.byId(item.id).render();
                //registry.byId(item.id).domNode.style.width = width;
	    });
	    var charts = registry.byClass("graph");
	    charts.forEach(function (item) {
		item.chart.resize({h:percentage, w:width});//add support to resize the stuff.
	    });
        });

	var changer = function () {
	    var hidden = false;
	    return function () {
		if (hidden) {
		    menuToggler.show();
//		    style.set("graphHolder", "width", "95%");
		    topic.publish("resize");
		} else {
		    menuToggler.hide();
//		    style.set("graphHolder", "width", "75%");
		    topic.publish("resize");
		}
		hidden = !hidden;
	    };
	}();

	topic.subscribe("toggleControls", function () {
	    changer();
	});

        topic.subscribe("dateChange", function (startDate, endDate) {
            //always goes back to the server to get data. TODO: have it cashe the data.
            //should the refreshing of plots be done here or after the new data? 
            //Probably after the new data because we dont want there to be lag.
	    if (date.compare(startDate, endDate) < 0) {
		topic.publish("getData", startDate, endDate);
	    } else { 
		alert("Start time must be before End Time..");
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

        topic.subscribe("addDataSet", function (plotObject) { //add data field later with graphs. add highlight plugin. Selection can be done with moveslice, charting events can be used to make it stand out.
	    
	    var holder = new ChartWidgit({
	        title: plotObject.title,
	        margins: 0,
	        id: plotObject.title, "class": "graph",
	        theme: theme
	    });
	    
	    graphHolder.addChild(holder);
	    
	    holder.chart
	        .addPlot("default", {type: Lines, markers:true, tension: "S", lines: true})
	        .addAxis("x", {includeZero: true, fixLower: "major", fixUpper: "major"})
	        .addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major"})
	        .setTheme(theme);
	    funct.forEach(plotObject.series, function (item) {
                /*	    var yValues = funct.map(item.data, function (ele) {
		 return ele[1];
	         });
	         var xValues = funct.map(item.data, function (ele) {
		 return ele[0];
	         }); 
                 */
	        holder.chart.addSeries(item.label, item.data);
	    });
	    if (dom.byId(plotObject.title + "Toggle") === null) {
		topic.publish("addOption", plotObject);
	    }

	    var tip = new Tooltip(holder.chart, "default");
	    var mag = new Magnify(holder.chart, "default");
	    holder.chart.render();
	    topic.publish("rsize");
        });
        // start up and do layout
        appLayout.startup();

        //-------------------------dataloading---------------------------------------------------------------------------
        var dataToGet = {Temperature: "t"," "rh", "td", "spd"};//make associative array.
        topic.subscribe("getData", function (start, end) {
	    var requestURL = 
            request.get("testData.json", {
	        handleAs: "json",
	        timeout: 5000,
                data: [start, end] //sends back the data slices. If undefined, send default data
	    }).then( 
	        function (response) {
                    topic.publish("removePlots");
		    funct.forEach(response.plots, function (plot) {
                        /*		    dataHolder.push(new ObservableStore (new MemoryStore({
			 data: {//need to add more information as the usage becomes clear
			 items: plot.data
			 }
		         })));
                         */
		        topic.publish("addDataSet", plot);

		    });
	        },
	        function (error) {
		    alert(error);
		    console.log(error);
	        }
	    );
        });

        topic.publish("getData", startTime.value, endTime.value);
    });

