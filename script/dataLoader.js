require(
    ["dojo/topic",
     "dojox/lang/functional",
     "dojo/request",
     "dijit/registry",
     "dojo/date",
     "dojo/domReady!"
    ], function (topic, funct, request, registry, date) {
        var dataTypes = {
	    airTemp : "t",
	    relativeHumidity: "rh",
	    dewPoint: "td",
	    wind_speed: "spd"
	};

	function stringDate (dt) {
	    var fin = "";
	    fin += dt.getUTCFullYear();
	    fin += "-";
	    fin += twoDigitString(dt.getUTCMonth());
	    fin += "-";
	    fin += twoDigitString(dt.getUTCDate());
	    fin += "+";
	    fin += twoDigitString(dt.getUTCHours());
	    fin += ":";
	    fin += twoDigitString(dt.getUTCMinutes());
	    fin += ":";
	    fin += twoDigitString(dt.getUTCSeconds());
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

	function Direction(names, unit, conversionFunction) {
	    this.names = names;
	    this.unit = unit;
	    this.conversionFunction = conversionFunction;
	}
	var maxPoints = 200;
        topic.subscribe("getData", function (start, end) {
	    var url = "http://metobs.ssec.wisc.edu/app/rig/tower/data/json";
	    var q = "symbols=";
	    funct.forEach(dataTypes, function (item) {
		q = q + item + ":";
	    });
	    q = q.slice(0, -1);
	    q = q + "&begin=" + stringDate(start) + "&end=" + stringDate(end);
	    console.log(url + "?"+ q);
            request.get("data/onehour.json", {
	        handleAs: "json",
	        timeout: 5000
	    }).then(function (response) {
                topic.publish("removePlots");
		topic.publish("removeOptions");
		topic.publish("removeLegends");

		//formatting the time data
		response.stamps = funct.map(response.stamps, function (item) {//"2014-05-20 16:07:01"
		    var parsed = funct.map(item.split(/:| |-/), function (item) {
			return parseInt(item);
		    });
		    return new Date(parsed[0], parsed[1], parsed[2], parsed[3], parsed[4], parsed[5], 0); 
		});

		var fullStructure = [new Direction (["accumulated_precipitation"], "in", function (item) {return item * 25.4;}),
				     new Direction (["altimeter"], "inHg", function (item) {return item * 1.33322368;}),
				     new Direction (["wind_speed"], "m/s", function (item) {return item * 1.94384;}),
				     new Direction (["wind_direction"], "deg", function (item) {
					 if (item === 0 || item === 360) {
					     return "N";
					 } else if (item === 90) {
					     return "E";
					 } else if (item === 180) {
					     return "S";
					 } else if (item === 270) {
					     return "W";
					 } else {
					     return "";
					 }
				     }),
				     new Direction (["solar_flux"], "flux"),
				     new Direction (["relative_humidity"], "%"),
				     new Direction (["air_temp", "dewpoint"], "ºC", function (item) {return item * 9 / 5 + 32;})];
		funct.map(fullStructure, function (plt) {//plt is an object containing strings that represent plot groupings.
		    var plotHolder = {title: ""};
		    plotHolder.plots = funct.map(plt.names, function (pltName) {
			plotHolder.title += pltName.replace("_", " ").toProperCase() + " and ";
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
			    if (plotHolder.title === "Wind Direction") {
				seriesObject.series = funct.filter(seriesObject.series, function (item, index) {
				    return index % period === 0;
				});
			    } else {
				seriesObject.series = averagePoints(seriesObject.series, period);
			    }
			}
			return seriesObject;
		    });
		    plotHolder.title = plotHolder.title.slice(0,-5);
		    plotHolder.unit = plt.unit;
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

        topic.publish("dataUpdate");
    });
