require(["dijit/registry",
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
	 "dojo/domReady!"
], function (registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler,
	     on, TimeTextBox, topic, domConstruct, query, style, Calendar, DropDownButton, DropDownMenu, MenuItem, 
	     Chart, theme, Lines, ChartWidgit, funct, VTB, xhr){
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
    
    var graphHolder = new ContentPane({
        region: "right",
        id: "graphHolder", "class": "centerPanel",
        splitter: true
    });
    
    //----------------tabs-----------------------------------------------------------------------------------------------
    var display = new ContentPane({
        title: "Display"
    });

    var download = new ContentPane({
        title: "Download"
    });
    var time = new ContentPane({
        title: "Time"
    });
    

    //----------------content-----------------------------------------------------------------------------------------------
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
	id: "downloadDataPane", class: "downloadPane",
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
    
    var setMaker = new Button({
	label: "Add Set",
	id: "setMaker"

    });
    var setDestroyer = new Button({
	label: "Remove Set",
	id: "setDestroyer"
    });

    //=====--building the dom--=======
    display.addChild(setMaker);
    display.addChild(setDestroyer);


    time.addChild(calendar);
    time.addChild(startTime);
    time.addChild(endTime);
    time.addChild(timeUpdateButton);

    dataFileTypes.map(function (item) {	dataMenu.addChild( new MenuItem({
	    label: item,
            iconClass:"dijitEditorIcon dijitEditorIconSave",
	    onClick: function() {topic.publish("saveChart", item);}
    }));});
    imageFileTypes.map(function (item) { imageMenu.addChild( new MenuItem({
	    label: item,
            iconClass:"dijitEditorIcon dijitEditorIconSave",
	    onClick: function() {topic.publish("saveChart", item);}
    }));});

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

    var graphList = [];
    on(setMaker, "click", labelAndPublishSet);
    on(timeUpdateButton, "click", function (e) {topic.publish("dateChange");});    
    on(setDestroyer, "click", function (e) {
	if (graphList.length !== 0) {
	    topic.publish("removePlot", graphList[0].id);
	}
    });
    on(window, "resize", function (e) {topic.publish("rsize");});
    //------------event handling -------------- ==========

    topic.subscribe("rsize", function (e) {
	var graphs = query(".graph");
	var percentage = (style.get("graphHolder", "height") - 1) / (graphs.length);
	var width = style.get("graphHolder", "width");
	query(".graph").forEach( function (item) {
	    style.set(item, "height", percentage.toString() + "px");
	    style.set(item, "width", width.toString() + "px");	    
	});

	funct.forEach(graphList, function (item) {
	    item.resize({h: percentage, w: width});
	});
    });

    topic.subscribe("dateChange", function (e) {
	alert("Date Change");
    });

    topic.subscribe("removePlot", function (plotName) {//untested
	var plot = funct.filter(graphList, function (plot) {return plot.id === plotName;})[0];
	if (!(typeof plot === "undefined" )){
	    plot.destroy();
	    graphList = funct.filter(graphList, function (plot) {return !(plot.id === plotName);});
	}
	
	topic.publish("rsize");
    });
    topic.subscribe("addDataSet", function (setName) { //add data field later with graphs. add highlight plugin. Selection can be done with moveslice, charting events can be used to make it stand out.
	
	var holder = new ChartWidgit({
	    title: setName,
	    margins: 0,
	    id: setName, "class": "graph",
	    theme: theme
	});
	
	graphHolder.addChild(holder);
	graphList.push(holder);

	var width = style.get(setName, "height");
	var height = style.get(setName, "width");
	holder.chart
	    .addPlot("default", {type: Lines})
	    .setTheme(theme)
	    .addSeries("Series A", [1,2,3,4,5,6,7])
	    .addSeries("Series B", [7,6,5,4,3,2,1]);


	topic.publish("rsize");
    });
    // start up and do layout
    appLayout.startup();

    //-------------------------dataloading---------------------------------------------------------------------------
    xhr.get({
	url:"0.0.0.0:8000/testData.js",
	handleAs: "json",
	timeout: 1000,
	error: function () {alert("Data request timed out.");}
	load: function (result) {
	    alert("The data has arrived.");
	}
    });
});

