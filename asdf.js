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
	 "dojo/domReady!"
], function(registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler, on, TimeTextBox){
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

    var numberGraphs = 2;
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
    var graphs = [graph1, graph2];
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
    function addSet(setName, data){
	display.addChild(new ContentPane({
	    id: setName,
	    "class": "edgePanel",
	    content: new CheckBox({name: "1"})
	}));
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

    //=====Behavior=====


    on(collapseButton, "change", function(e) {
	menuToggler.hide();
    });

    on(showButton, "change", function(e) {
	menuToggler.show();
    });
    
    on(setMaker, "click", addSet());
    // start up and do layout
    appLayout.startup();


});
