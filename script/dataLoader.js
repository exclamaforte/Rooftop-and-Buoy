require(
    ["dojo/topic",
     "dojox/lang/functional",
     "dojo/request",
     "dijit/registry",
     "dojo/domReady!"
    ], function (topic, funct, request, registry) {
        var dataTypes = {
	    airTemp : "t",
	    relativeHumidity: "rh",
	    dewPoint: "td",
	    wind_speed: "spd"
	};

	function stringDate (date) {
	    var fin = "";
	    fin += date.getUTCFullYear();
	    fin += "-";
	    fin += twoDigitString(date.getUTCMonth());
	    fin += "-";
	    fin += twoDigitString(date.getUTCDate());
	    fin += "+";
	    fin += twoDigitString(date.getUTCHours());
	    fin += ":";
	    fin += twoDigitString(date.getUTCMinutes());
	    fin += ":";
	    fin += twoDigitString(date.getUTCSeconds());
	    return fin;
	}
	function twoDigitString (intr) {
	    var fin = "";
	    if (intr < 10) {
		fin += "0" + intr.toString();
	    } else {
		fin += intr.toString();
	    }
	    return fin;
	}

	funct.filteredMap = function (arry, f, filter) {
	    return funct.filter(funct.map(arry, f), filter);
	};
	//arry is an array, f is a function that takes an array and returns a number, and period is the period that you split the array.
	funct.rollingFold = function (arry, f, period) {
	    var stop = arry.length - (arry.length % period);
	    var fin = funct.filteredMap(arry, function (item, index) {
		if (index >= stop) {
		    return f(arry.slice(index));
		} else {
		    return f(arry.slice(index, index + period));
		}
	    }, function (item, index) {
		return index % period === 0;
	    });
	    return fin;
	};

	function averagePointsArray (arry) {
	    if (arry.length === 1) {
		return arry[0];
	    }
	    var hi = {
		"x": arry[0].x,
		"y": funct.reduce(arry, function (pv, cv) { return pv + cv.y; }, 0) / arry.length 
	    }; return hi;
	}

	function averagePoints (arry, period) { //period is the number of points that are being averaged
	    return funct.rollingFold(arry, averagePointsArray, period);
	}

	function Direction(names, unit) {
	    this.names = names;
	    this.unit = unit;
	}
	var maxPoints = 100;
        topic.subscribe("getData", function (start, end) {
	    var url = "http://metobs.ssec.wisc.edu/app/rig/tower/data/json";
	    var q = "symbols=";
	    funct.forEach(dataTypes, function (item) {
		q = q + item + ":";
	    });
	    q = q.slice(0, -1);
	    q = q + "&begin=" + stringDate(start) + "&end=" + stringDate(end);
	    console.log(url + "?"+ q);
            request.get("data/realData.json", {
	        handleAs: "json",
	        timeout: 5000
	    }).then(function (response) {
                topic.publish("removePlots");
		topic.publish("removeOptions");
		
		//formatting the time data
		response.stamps = funct.map(response.stamps, function (item) {//"2014-05-20 16:07:01"
		    var parsed = funct.map(item.split(/:| |-/), function (item) {
			return parseInt(item);
		    });
		    return new Date(parsed[0], parsed[1], parsed[2], parsed[3], parsed[4], parsed[5], 0); 
		    	});
/*
		var realStructure = [new Direction (["air_temp", "dewpoint"], "ºC"), 
				     new Direction (["pressure"], "hPa"), 
				     new Direction (["wind_speed"], "m/s"),
				     new Direction (["wind_direction"], "deg"),
				     new Direction (["solar_flux"], "flux")];
		funct.map(realStructure, function (plt) {//plt is an object containing strings that represent plot groupings.
		    var plotHolder = {};
		    plotHolder.title = "";
		    funct.forEach(plt, function (pltName) {
			plotHolder.title += pltName.name.replace("_", " ").toProperCase() + " and ";
		    });
		    plotHolder.title = plotHolder.title.slice(0,-5);
		    plotHolder.plots = funct.map(plt, function (pltdir) {
			var index = response.symbols.indexOf(pltdir.name);
			//remove underscore, add space, change to proper case. 
			pltdir.name = pltdir.name.replace("_", " ").toProperCase();
			var seriesObject = {
			    title: pltdir.name,
			    series: funct.map(response.data, function (set, ind) { 
				//data is in the form of tuples that match with the names, so we get the tuple at certain index, and then get the time value for that 
				return {"x": response.stamps[ind], "y": set[index]};
			    })
			};
			var period = Math.ceil(seriesObject.series.length / maxPoints);
			if (period > 1) {
			    seriesObject.series = averagePoints(seriesObject.series, period);
			}
			return seriesObject;
		    });
		    plotHolder.unit = plt.unit;
		    topic.publish("addDataSet", plotHolder);
		});
*/
		var structure = [["dewpoint", "relative_humidity", "air_temp"]]; 

		funct.map(structure, function (plt) {//plt is an array containing strings that represent plot groupings.
		    var plotHolder = {};
		    plotHolder.title = "";
		    funct.forEach(plt, function (pltName) {
			plotHolder.title += pltName.replace("_", " ").toProperCase() + " and ";
		    });
		    plotHolder.title = plotHolder.title.slice(0,-5);
		    plotHolder.plots = funct.map(plt, function (pltName) {
			var index = response.symbols.indexOf(pltName);
			//remove underscore, add space, change to proper case. 
			pltName = pltName.replace("_", " ").toProperCase();
			var seriesObject = {
			    title: pltName,
			    series: funct.map(response.data, function (set, ind) { 
				//data is in the form of tuples that match with the names, so we get the tuple at certain index, and then get the time value for that 
				return {"x": response.stamps[ind], "y": set[index]};
			    })
			};
			var period = Math.ceil(seriesObject.series.length / maxPoints);
			if (period > 1) {
			    seriesObject.series = averagePoints(seriesObject.series, period);
			}
			return seriesObject;
		    });
		    topic.publish("addDataSet", plotHolder);
		});

	    }, function (error) {
		alert(error);
		console.log(error);
	    });
        });

	//adding a method to change strings to their proper case. 
	String.prototype.toProperCase = function () {
	    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};

        topic.publish("getData", registry.byId("startTime").value, registry.byId("endTime").value);
    });
