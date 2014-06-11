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
	 "dojo/domReady!"
], function(registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler, on, TimeTextBox, topic, domConstruct, query, style){
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

    var numberGraphs = 3;
    var percentage = 94 / numberGraphs;
    
    
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
    controls.addChild(display);
    controls.addChild(download);
    controls.addChild(time);
//    graphHolder.addChild(collapseButton);
//    graphHolder.addChild(showButton);
    appLayout.addChild(controls);
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
	    topic.publish("addDataSet", label.toString());
	    label= label+1;
	};
	return anon;
    }(0);

    on(setMaker, "click", labelAndPublish);


    //------------event handling -------------- 
    topic.subscribe("addDataSet", function (setName) { //add data field later with graphs. the sizing is still screwed up. it was fine before, but now i'm trying to get the value of the height of the container for the graphs and the whole things is breaking.
	var graphs = query(".graph");
	var percentage = Math.floor(style.get("graphHolder", "height") / (graphs.length + 1));
	var holder = new ContentPane({
	    region: "center",
	    id: setName, "class": "graph",
	    content:setName
	});
	graphHolder.addChild(holder);
	var i = 0;
	for (i = 0; i < graphs.length; i++) {
	    style.set(graphs[i].id, "height", percentage.toString());
	}

    });




    // start up and do layout
    appLayout.startup();


});
