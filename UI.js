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
        //create the BorderContainer and attach it to our appLayout div
        var appLayout = new BorderContainer({
	        design: "headline"
        }, "appLayout");

        //------------------sections------------------------------------------------------------------------------------------
        var controls = new TabContainer({
	        region: "center",
	        id: "controls",
	        tabPosition: "top"
        });
        
        var graphHolder = new BorderContainer({
            region: "right",
            id: "graphHolder", "class": "centerPanel",
            splitter: true, style:"height: 100%;"
        });
        
        //----------------tabs-----------------------------------------------------------------------------------------------
        var display = new ContentPane({
            title: "Display", id: "display"
        });

        var download = new ContentPane({
            title: "Download", id: "download"
        });
        var time = new ContentPane({
            title: "Time", id: "time"
        });
        

        //----------------content-----------------------------------------------------------------------------------------------
        var chartOptions = new ContentPane({
	        id: "chartOptions"
        });

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
        var menuToggler = new Toggler({
	        node: "controls"
        });

        var collapseButton = new Button({
	        id: "collapseButton"
        });
        var showButton = new Button({
	        id: "showButton"
        });
        
        /*    var grid = new DataGrid({
	     structure: [{ noscroll:true, defaultCell: {width: "84px"}, 
		 cells: [
		 {name: "first Name",}]}]
         });
         */

        var startTime = new TimeTextBox({
	        id: "startTime",
	        value: new Date(),
	        constraints: {
	            timePattern: 'HH:mm:ss',
	            clickableIncrement: 'T00:15:00',
	            visibleIncrement: 'T00:15:00',
	            visibleRange: 'T01:00:00'
	        }
	    });

        var endTime = new TimeTextBox({
	        id: "endTime",
	        value: new Date(),
	        constraints: {
	            timePattern: 'HH:mm:ss',
	            clickableIncrement: 'T00:15:00',
	            visibleIncrement: 'T00:15:00',
	            visibleRange: 'T01:00:00'
	        }
        });
        
        var calendar = new Calendar({
	        id: "calendar"

        });
        
        var timeUpdateButton = new Button({
	        id: "timeUpdateButton",
	        label: "Update Time"
        });


        //=====--building the dom--=======
        chartOptions.addChild(optionsGrid);
        display.addChild(chartOptions);
        
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
        download.addChild(downloadImagePane);
        download.addChild(downloadDataPane);

        controls.addChild(display);
        controls.addChild(download);
        controls.addChild(time);

        appLayout.addChild(controls);
        appLayout.addChild(graphHolder);

        //=====Button Behavior=====


        on(collapseButton, "change", function(e) {
	        menuToggler.hide();
        });

        on(showButton, "change", function(e) {
	        menuToggler.show();
        });

        var labelAndPublishSet = function (start) {
	        var label = start;
	        var anon = function () {
	            topic.publish("addDataSet", label.toString());
	            label= label+1;
	        };
	        return anon;
        }(0);

        on(timeUpdateButton, "click", function (e) {topic.publish("dateChange", startTime.value, endTime.value);});

        on(window, "resize", function (e) {topic.publish("rsize");});
        //------------event handling -------------- ==========

        topic.subscribe("addOption", function (plotObject) {
	        optionsGrid.addChild(
	            new ToggleButton({
		            showLabel: true,
		            checked: true,
		            label: plotObject.title + " - On",
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
/*
        topic.subscribe("rsize", function (e) {
	        var graphs = query(".graph");
	        var percentage = (style.get("graphHolder", "height") - 1) / (graphs.length);
	        var width = style.get("graphHolder", "width");
	        query(".graph").forEach( function (item) {
                style.set(item, "height", percentage);
                style.set(item, "width", percentage);
                registry.byId(item.id).style.height = percentage;
                registry.byId(item.id).domNode.style.width = width;
	        });
        });
*/
        topic.subscribe("dateChange", function (startDate, endDate) {
            //always goes back to the server to get data. TODO: have it cashe the data.
            //should the refreshing of plots be done here or after the new data? 
            //Probably after the new data because we dont want there to be lag.
            topic.publish("getData", startDate, endDate);
            topic.publish("refreshData");
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
                region:"top",
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
	        var tip = new Tooltip(holder.chart, "default");
	        var mag = new Magnify(holder.chart, "default");
	        holder.chart.render();
	        topic.publish("rsize");
        });
        // start up and do layout
        appLayout.startup();

        //-------------------------dataloading---------------------------------------------------------------------------
        var dataHolder = [];
        topic.subscribe("getData", function (start, end) {
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
		                topic.publish("addOption", plot);
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

