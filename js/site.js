var config = {
    data: "data/cash-june.json",
    whoFieldName: "Organization",
    whatFieldName: "Cluster",
    whereFieldName: "DIS_CODE",
    sum: true,
    sumField: "Beneficiaries",
    geo: "data/Somalia_District_Polygon.json",
    joinAttribute: "DIS_CODE",
    nameAttribute: "DIST_NAME",
    color: "#3B88C0",
    mechanismField: "Delivery mechanism",
    conditonalityField: "Conditionality",
    restrictionField: "Restriction",
    ruralField: "RURAL/URBAN",
    transferValue: "Beneficiaries",
    estimatedField: "Estimated"
};


function generate3WComponent(config, data, geom) {

    var lookup = genLookup(geom, config);

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var whoRegional = dc.rowChart('#regionalCash');

    var filterMechanismPie = dc.pieChart('#filterMechanism');
    var filtercondPie = dc.pieChart('#filterConditionality');
    var filterRestPie = dc.pieChart('#filterRestriction');
    var filterRuralUrban = dc.pieChart('#filterArea');




    var peopleAssisted = dc.numberDisplay('#peopleAssisted');
    var amountTransfered = dc.numberDisplay('#amountTransfered');
    var numberOrgs = dc.numberDisplay('#numberOrgs');
    var numberClusters = dc.numberDisplay('#numberClusters');

    var cf = crossfilter(data);

    var whoRegionalDim = cf.dimension(function (d) {
        return d["REGION"];
    });

    var whoDimension = cf.dimension(function (d) {
        return d[config.whoFieldName];
    });



    var whatDimension = cf.dimension(function (d) {
        return d[config.whatFieldName];
    });
    var whereDimension = cf.dimension(function (d) {
        return d[config.whereFieldName];
    });

    var dimMecha = cf.dimension(function (d) {
        return d[config.mechanismField];
    });
    var dimCond = cf.dimension(function (d) {
        return d[config.conditonalityField];
    });
    var dimRest = cf.dimension(function (d) {
        return d[config.restrictionField];
    });
    var dimRuralUrban = cf.dimension(function (d) {
        return d[config.ruralField];
    });

    // var whoGroup = whoDimension.group();
    // var whatGroup = whatDimension.group();
    // var whereGroup = whereDimension.group();

    // var sortedRegDim = whoRegionalDim.top(Infinity);
    var whoRegionalGroup = whoRegionalDim.group().reduceSum(function (d) {
        return d[config.sumField]
    });

    var groupMecha = dimMecha.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupCond = dimCond.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupRest = dimRest.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupRuralUrban = dimRuralUrban.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });


    var whoGroup = whoDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var whatGroup = whatDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var whereGroup = whereDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var whereGroupReduced = whereDimension.group().reduce(
        function (p, v) {
            p.benef += +v[config.sumField];
            p.amountTransfered += +v["Transfer value"];
            p.sum += +1;

            if (p.sum != 0)
                p.avg = p.amountTransfered / p.sum;

            return p;
        },
        function (p, v) {
            p.benef -= +v[config.sumField];
            p.amountTransfered -= +v["Transfer value"];
            p.sum -= +1;

            if (p.sum != 0)
                p.avg = p.amountTransfered / p.sum;

            return p;
        },
        function () {
            return {
                benef: 0,
                amountTransfered: 0,
                sum: 0,
                avg: 0
            }
        });



    var gp = cf.groupAll().reduce(
        function (p, v) {
            p.peopleAssisted += +v[config.sumField];
            p.amountTransfered += +v["Estimated"];
            p.totalHH += +v["Household"];

            if (v["Organization"] in p.orgas)
                p.orgas[v["Organization"]]++;
            else {
                p.orgas[v["Organization"]] = 1;
                p.numOrgs++;
            }

            if (p.totalHH != 0) {
                p.avg = p.amountTransfered / p.totalHH;
                // console.log(p.totalHH);
            } else
                p.avg = 0;
            //console.log(p.orgas);
            return p;
        },
        function (p, v) {
            p.peopleAssisted -= +v[config.sumField];
            p.amountTransfered -= +v["Estimated"];
            p.totalHH -= +v["Household"];


            p.orgas[v["Organization"]]--;
            if (p.orgas[v["Organization"]] == 0) {
                delete p.orgas[v["Organization"]];
                p.numOrgs--;
            }

            if (p.peopleAssisted < 0) p.peopleAssisted = 0;
            if (p.amountTransfered < 0) p.amountTransfered = 0;
            if (p.totalHH < 0) p.totalHH = 0;

            if (p.totalHH != 0)
                p.avg = p.amountTransfered / p.totalHH;

            return p;
        },
        function () {
            return {
                peopleAssisted: 0,
                amountTransfered: 0,
                totalHH: 0,
                avg: 0,
                numOrgs: 0,
                orgas: {}
            };

        }
    );

    var all = cf.groupAll();

    var formatComma = d3.format(',');
    var formatDecimalComma = d3.format(",.0f");
    var formatDecimal = function (d) {
        ret = d3.format(".1f");
        return "$ " + ret(d);
    };
    var formatMoney = function (d) {
        return "$ " + formatDecimalComma(d);
    };

    var colorScale = d3.scale.ordinal().range(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0', '#056CB6']);


    filterMechanismPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(25)
        .dimension(dimMecha)
        .group(groupMecha)
        .colors(colorScale)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        });

    var colorScale3 = d3.scale.ordinal().range(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0']);
    filtercondPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(25)
        .dimension(dimCond)
        .group(groupCond)
        .colors(colorScale3)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        });

    var colorScale4 = d3.scale.ordinal().range(['#A7C1D3', '#71A5CA', '#3B88C0']);

    filterRestPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(25)
        .dimension(dimRest)
        .group(groupRest)
        .colors(colorScale4)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        });


    filterRuralUrban.width(190)
        .height(190)
        .radius(80)
        .innerRadius(25)
        .dimension(dimRuralUrban)
        .group(groupRuralUrban)
        .colors(colorScale)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        });

    whoChart.width($('#hxd-3W-who').width()).height(400)
        .dimension(whoDimension)
        .group(whoGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(15);
        })
        .labelOffsetY(13)
        .colors([config.color])
        .colorAccessor(function (d, i) {
            return 0;
        })
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        })
        .xAxis().ticks(0);

    whatChart.width($('#hxd-3W-what').width()).height(250)
        .dimension(whatDimension)
        .group(whatGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(15);
        })
        .labelOffsetY(13)
        .colors([config.color])
        .colorAccessor(function (d) {
            return 0;
        })
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        })
        .xAxis().ticks(0);


    whoRegional.width(585).height(400)
        .dimension(whoRegionalDim)
        .group(whoRegionalGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(15);
        })
        .labelOffsetY(13)
        .colors([config.color])
        .colorAccessor(function (d) {
            return 0;
        })
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | No. beneficiaries : " + formatComma(d.value);
            return capitalizeFirstLetter(text);
        })
        .xAxis().ticks(0);




    dc.dataCount('#count-info')
        .dimension(cf)
        .group(all);

    whereChart.width($('#hxd-3W-where').width()).height(400)
        .dimension(whereDimension)
        .group(whereGroupReduced)
        .center([0, 0])
        .zoom(0)
        .geojson(geom)
        .colors(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0', '#056CB6'])
        .colorDomain([0, 4])
        .colorAccessor(function (d) {
            var c = 0
            if (d.benef > 150000) {
                c = 4;
            } else if (d.benef > 50000) {
                c = 3;
            } else if (d.benef > 1000) {
                c = 2;
            } else if (d.benef > 0) {
                c = 1;
            };
            return c
        })
        .featureKeyAccessor(function (feature) {
            return feature.properties[config.joinAttribute];
        }).popup(function (d) {
            text = lookup[d.key] +
                "<br/>No. beneficiaries : " + formatComma(d.value.benef)+
                "<br/>Avg transfer value : " + formatDecimal(d.value.avg);
            return text;
        })
        .renderPopup(true);



    var peopleA = function (d) {
        return d.peopleAssisted;
    };

    var amountT = function (d) {
        return d.amountTransfered;
    };

    var numO = function (d) {
        return d.numOrgs;
    };

    var numAvg = function (d) {
        return d.avg;
    };

    peopleAssisted.group(gp)
        .valueAccessor(peopleA)
        .formatNumber(formatComma);

    amountTransfered.group(gp)
        .valueAccessor(amountT)
        .formatNumber(formatMoney);

    numberOrgs.group(gp)
        .valueAccessor(numO)
        .formatNumber(formatComma);

    numberClusters.group(gp)
        .valueAccessor(numAvg)
        .formatNumber(formatDecimal);


    dc.renderAll();

    var map = whereChart.map();

    zoomToGeom(geom);


    var g = d3.selectAll('#hdx-3W-who').select('svg').append('g');



    function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]]);
    }

    function genLookup(geojson, config) {
        var lookup = {};
        geojson.features.forEach(function (e) {
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
        });
        return lookup;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


}

//function hxlProxyToJSON(input, headers) {
//    var output = [];
//    var keys = []
//    input.forEach(function (e, i) {
//        if (i == 0) {
//            e.forEach(function (e2, i2) {
//                var parts = e2.split('+');
//                var key = parts[0]
//                if (parts.length > 1) {
//                    var atts = parts.splice(1, parts.length);
//                    atts.sort();
//                    atts.forEach(function (att) {
//                        key += '+' + att
//                    });
//                }
//                keys.push(key);
//            });
//        } else {
//            var row = {};
//            e.forEach(function (e2, i2) {
//                row[keys[i2]] = e2;
//            });
//            output.push(row);
//        }
//    });
//    return output;
//}
//load 3W data

var dataCall = $.ajax({
    type: 'GET',
    url: config.data,
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({
    type: 'GET',
    url: config.geo,
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function (dataArgs, geomArgs) {
    var data = dataArgs[0]; //hxlProxyToJSON(dataArgs[0]);
    var geom = geomArgs[0];
    geom.features.forEach(function (e) {
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]);
    });
    generate3WComponent(config, data, geom);
});


//var formatComma = d3.format(","),
//    formatDecimal = d3.format(".1f"),
//    formatDecimalComma = d3.format(",.2f"),
//    formatSuffix = d3.format("s"),
//    formatSuffixDecimal1 = d3.format(".1s"),
//    formatSuffixDecimal2 = d3.format(".2s"),
//    formatMoney = function(d) { return "$" + formatDecimalComma(d); },
//    formatPercent = d3.format(",.2%");
