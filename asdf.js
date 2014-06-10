require(["dijit/registry",
	 "dijit/layout/BorderContainer",
         "dijit/layout/TabContainer", 
	 "dijit/layout/ContentPane",
	 "dijit/form/Button",
	 "dijit/form/CheckBox",
	 "dojo/dom",
	 "dojox/grid/DataGrid",
	 "dojo/domReady!"
], function(registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid){
    //create the BorderContainer and attach it to our appLayout div
    var appLayout = new BorderContainer({
	design: "headline"
    }, "appLayout");

    //------------------sections------------------------------------------------------------------------------------------
    var menu = new TabContainer({
	region: "center",
	id: "menu",
	tabPosition: "top",
	"class": "edgePanel"
    });
    
    var graphHolder = new ContentPane({
        region: "right",
        id: "leftCol", "class": "centerPanel",
        splitter: true
    });

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
    function addDataset(setName, data){
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

    var collapseButton = new CheckBox({
	name: "Menu",
	checked : false,
	onChange: function () {
	    if (this.checked) {
		dom.byId("menu").style("width:30%;");
	    } else {
		dom.byId("menu").style("width:0%;");
	    }
	    appLayout.resize();
	    menu.resize();
	    graphHolder.resize();
	}
    });

    
    download.addChild(downloadButton);
    menu.addChild(display);
    menu.addChild(download);
    menu.addChild(time);
    graphHolder.addChild(collapseButton);
    appLayout.addChild(menu);
    appLayout.addChild(graphHolder);
    // start up and do layout
    appLayout.startup();
});
