require(
    ["dojo/topic",
     "dojox/lang/functional",
     "dojo/request/xhr",
     "dijit/registry",
     "dojo/date",
     "dojo/dom-style",
     "dojo/domReady!"
    ], function (topic, funct, xhr, registry, date, style) {
        var dataTypes = {
	    airTemp : "t",
	    relativeHumidity: "rh",
	    dewPoint: "td",
	    wind_speed: "spd",
	    wind_direction: "dir",
	    accumulated_precipitation: "accum_precip",
	    pressure: "p",
	    altimeter: "altm",
	    solar_flux: "flux"
	};

	function stringDate (dt) {
	    var fin = "";
	    fin += dt.getUTCFullYear();
	    fin += "-";
	    fin += twoDigitString(parseInt(dt.getUTCMonth()) + 1);
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

	function Direction(names, unit, conversionFunction, otherLabel) {
	    this.names = names;
	    this.unit = unit;
	    this.conversionFunction = conversionFunction;
	    this.otherLabel = otherLabel;
	}
	function getHiddenPlots () {
	    return funct.filter(registry.byClass("graph"), function (item) {
		return style.get(item.id, "display") === "none";
	    });
	}
	var maxPoints = 200;
        topic.subscribe("getData", function (start, end) {
	    topic.publish("addLoading");
	    var url = "http://metobs.ssec.wisc.edu/app/rig/tower/data/json";
	    var q = "symbols=";
	    funct.forEach(dataTypes, function (item) {
		q = q + item + ":";
	    });
	    q = q.slice(0, -1);
	    q = q + "&begin=" + stringDate(start) + "&end=" + stringDate(end);
	    console.log(url + "?" + q);
            xhr.get(url, {
		query: q,
	        handleAs: "json",
	        timeout: 100000
	    }).then(function (response) {
		var hidden = getHiddenPlots();
		topic.publish("removePlots");
		topic.publish("removeOptions");
		topic.publish("removeLegends");
		topic.publish("removeIndicators");
		topic.publish("Controls");		
		//formatting the time data
		response.stamps = funct.map(response.stamps, function (item) {//"2014-05-20 16:07:01"
		    item = item.replace(/-/g, "/") + " UTC";
		    return new Date(item); 
		});

		var fullStructure = [new Direction (["accumulated_precipitation"], "in", function (item) {return item * 25.4;}, "mm"),
				     new Direction (["altimeter"], "inHg", function (item) {return item * 33.86;}, "hPa"),
				     new Direction (["wind_speed"], "m/s", function (item) {return item * 1.94384;}, "knots"),
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
				     new Direction (["solar_flux"], "W/m^2"),
				     new Direction (["relative_humidity"], "%"),
				     new Direction (["air_temp", "dewpoint"], "ºC", function (item) {return item * 9 / 5 + 32;}, "ºF")];

		funct.map(fullStructure, function (plt) {
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
			seriesObject.min = funct.reduce(seriesObject.series, function (a, b) {return a.y > b.y ? b : a;}).y;
			seriesObject.max = funct.reduce(seriesObject.series, function (a, b) {return a.y > b.y ? a : b;}).y;
			return seriesObject;
		    });
		    plotHolder.otherLabel = plt.otherLabel;
		    plotHolder.height = Math.floor((style.get("graphHolder", "height") - 35) / (fullStructure.length - hidden.length));
		    plotHolder.width = Math.floor(style.get("graphHolder", "width") * .97);
		    plotHolder.title = plotHolder.title.slice(0,-5);
		    plotHolder.conversionFunction = plt.conversionFunction;
		    plotHolder.unit = plt.unit;
		    plotHolder.min = funct.reduce(plotHolder.plots, 
						  function (a, b) {return a.min > b.min ? b : a;}).min;
		    plotHolder.max = funct.reduce(plotHolder.plots, 
						  function (a, b) {return a.max > b.max ? a : b;}).max;
		    topic.publish("addDataSet", plotHolder);
		});

		funct.forEach(hidden, function (plot) {
		    style.set(plot.id, "display", "none");
		    plot.enabled = false;
		});
		topic.publish("updateLegend");
		topic.publish("removeLoading");
		//topic.publish("hardrsize");
		topic.publish("addIndicators");
		topic.publish("configureIndicators");
	    }, function (error) {
		alert("Problem fectching data.");
		topic.publish("removeLoading");
		console.log(error);
	    });
        });

	//adding a method to change strings to their proper case. 
	String.prototype.toProperCase = function () {
	    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	};

	function dataUpdate() {
	    var n = new Date();
	    topic.publish("dateChange", date.add(n, "hour", -1 * registry.byId("timeOptionsSelect").value), n);
	};
	dataUpdate();
    });
