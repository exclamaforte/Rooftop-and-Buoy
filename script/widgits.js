require (
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
     "dijit/form/DateTextBox",
     "dijit/form/Select",
     "dojo/domReady!"
    ], function (registry, BorderContainer, TabContainer, ContentPane, Button, CheckBox, dom, DataGrid, Toggler,
 	         on, TimeTextBox, topic, domConstruct, query, style, Calendar, DropDownButton, DropDownMenu, MenuItem,
	         Chart, theme, Lines, ChartWidgit, funct, VTB, xhr, request, Default, DataStore, TableContainer,
                 ToggleButton, Tooltip, Magnify, ObservableStore, MemoryStore, date, DateTextBox, Select) {
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
	    id: "controls"
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
        var timeControls = new ContentPane({
	    id: "timeControls"
	});
	var customTime = new ContentPane({
	    id: "customTime"
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
	    value: "X Size", 
	    regExp:"^[0-9]+|X Size$",
	    style: "width: 100px"
	    
        });
        var downloadSizeY = new VTB({
	    type: "text",
	    name: "downloadSizeY", id: "downloadSizeY",
	    value: "Y Size", 
	    regExp:"^[0-9]+|Y Size$",
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
	    value: date.add(new Date(), "minute", -15),
	    label: date.add(new Date(), "minute", -15).toString(),
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
	    value: new Date(),
	    regExp:"^(0[0-9]|[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$",
	    constraints: {
	        timePattern: 'HH:mm:ss',
	        clickableIncrement: 'T00:15:00',
	        visibleIncrement: 'T00:15:00',
	        visibleRange: 'T01:00:00'
	    }
        });
        
        var startDate = new DateTextBox({
	    id: "startDate",
	    value: new Date(),
	    style: {
		width: "100px"
	    }
	});

        var endDate = new DateTextBox({
	    id: "endDate",
	    value: new Date(),
	    style: {
		width: "100px"
	    }
        });
        
        var timeUpdateButton = new Button({
	    id: "timeUpdateButton",
	    label: "Update Time"
        });
	var timeOptionsSelect = new Select({
	    id: "timeOptionsSelect",
	    options: [
		{label: "Past 1 Hours", value: 1},
		{label: "Past 3 Hours", value: 3},
		{label: "Past 6 Hours", value: 6},
		{label: "Past 12 Hours", value: 12},
		{label: "Past 24 Hours", value: 24},
		{label: "Custom", value: -1}
	    ]
	});
	var timeAutoUpdate = new CheckBox ({
	    id:"timeAutoUpdate"
	});

        //=====--building the dom--=======

	display.addChild(optionsGrid);
        

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


	timeControls.addChild(timeOptionsSelect);
	timeControls.addChild(timeAutoUpdate);

	customTime.addChild(startDate);
	customTime.addChild(endDate);
        customTime.addChild(startTime);
        customTime.addChild(endTime);
        customTime.addChild(timeUpdateButton);

	time.addChild(timeControls);
	time.addChild(customTime);

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
	var customTimeToggler = new Toggler({
	    node: "customTime", id:"customTimeToggler"
	});
	registry.add(customTimeToggler);
	customTimeToggler.hide();
	appLayout.startup();

    });
