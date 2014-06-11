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
	 "dojo/domReady!"
], function(registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler, on, TimeTextBox, topic, domConstruct){
    //create the BorderContainer and attach it to our appLayout div
    var appLayout = new BorderContainer({
	design: "headline"
    }, "appLayout");

    //------------------sections------------------------------------------------------------------------------------------
    var menu = new TabContainer({
	region: "center",
	id: "controls",
	tabPosition: "top"
    });
    
    var graphHolder = new ContentPane({
        region: "right",
        id: "leftCol", "class": "centerPanel",
        splitter: true
    });

    var numberGraphs = 3;
    var percentage = 94 / numberGraphs;
    
    
    var graph1 = new ContentPane({
	region: "center",
	id: "graph1", "class": "graph",
	content:"hi",
	style: "height: " + percentage.toString() + "%"
    });

    var graph2 = new ContentPane({
	region: "center",
	id: "graph2", "class": "graph",
	content:"hi",
	style: "height: " + percentage.toString() + "%"
    });
    var graph3 = new ContentPane({
	region: "center",
	id: "graph3", "class": "graph",
	content:"hi",
	style: "height: " + percentage.toString() + "%"
    });
    var graphs = [graph1, graph2, graph3];
    //----------------tabs-----------------------------------------------------------------------------------------------
    var display = new ContentPane({
        title: "Display",
	content: new DataGrid()
    });

    var download = new ContentPane({
        title: "Download"
    });
    var time = new ContentPane({
        title: "Time"
    });


    //----------------content-----------------------------------------------------------------------------------------------
    function addSet(setName){ //add data field later with graphs.
	var percentage = 94 / (graphs.length + 1);
	graphs.map( function (item) {
	    item.style = "height: " + percentage.toString() + "%";
	});
	var holder = new ContentPane({
	    region: "center",
	    id: setName, "class": "graph",
	    content:setName,
	    style: "height: " + percentage.toString() + "%"
	});
	domConstruct.create(holder);
	graphs.push(holder);
    }
    var downloadButton = new Button({
	label: "Download",
	id: "downloadButton"
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
    
    var setMaker = new Button({
	label: "Add Set",
	id: "tempSet"
    });

    //=====--building the dom--=======
    display.addChild(setMaker);
    time.addChild(startTime);
    time.addChild(endTime);
    download.addChild(downloadButton);
    menu.addChild(display);
    menu.addChild(download);
    menu.addChild(time);
//    graphHolder.addChild(collapseButton);
//    graphHolder.addChild(showButton);
    graphs.map(function(item) { graphHolder.addChild(item);});
    graphHolder.addChild(graph1);
    graphHolder.addChild(graph2);
    appLayout.addChild(menu);
    appLayout.addChild(graphHolder);

    //=====Button Behavior=====


    on(collapseButton, "change", function(e) {
	menuToggler.hide();
    });

    on(showButton, "change", function(e) {
	menuToggler.show();
    });
    var labelAndPublish = function (start) {
	var label = start;
	var anon = function () {
	    topic.publish("addDataSet", label);
	    label= label+1;
	};
	return anon;
    }(0);

    on(setMaker, "click", function (e) {
	var label = 0;
	var anon = function (y) {
	    topic.publish("addDataSet", label);
	    label= label+1;
	};
	anan();
    });

    //------------event handling -------------- 
    topic.subscribe("addDataSet", function (text) {
	addSet(text);
    });

    // start up and do layout
    appLayout.startup();


});
