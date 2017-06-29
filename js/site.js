var config = {
    data: "data/cash.json",
    whoFieldName: "Organization",
    whatFieldName: "Cluster",
    whereFieldName: "DIS_CODE",
    sum: true,
    sumField: "Individuals",
    geo: "data/Somalia_District_Polygon.json",
    joinAttribute: "DIS_CODE",
    nameAttribute: "DIST_NAME",
    color: "#03a9f4",
    mechanismField: "Modality",
    conditonalityField: "Conditionality",
    restrictionField: "Restriction",
    ruralField: "RURAL/URBAN"
};


function generate3WComponent(config, data, geom) {

    var lookup = genLookup(geom, config);

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var filterMechanismPie = dc.pieChart('#filterMechanism');
    var filtercondPie = dc.pieChart('#filterConditionality');
    var filterRestPie = dc.pieChart('#filterRestriction');
    var filterRuralUrban = dc.pieChart('#filterRural');

    var peopleAssisted = dc.numberDisplay('#peopleAssisted');
    var amountTransfered = dc.numberDisplay('#amountTransfered');
    var numberOrgs = dc.numberDisplay('#numberOrgs');

    var cf = crossfilter(data);

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

    if (config.sum) {
        var whoGroup = whoDimension.group().reduceSum(function (d) {
            return parseInt(d[config.sumField]);
        });
        var whatGroup = whatDimension.group().reduceSum(function (d) {
            return parseInt(d[config.sumField]);
        });
        var whereGroup = whereDimension.group().reduceSum(function (d) {
            return parseInt(d[config.sumField]);
        });
    } else {
        var whoGroup = whoDimension.group();
        var whatGroup = whatDimension.group();
        var whereGroup = whereDimension.group();
    }

    var all = cf.groupAll();

    filterMechanismPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(30)
        .dimension(dimMecha)
        .group(groupMecha)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
        });

    filtercondPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(30)
        .dimension(dimCond)
        .group(groupCond)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
        });

    filterRestPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(30)
        .dimension(dimRest)
        .group(groupRest)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
        });

    filterRuralUrban.width(190)
        .height(190)
        .radius(80)
        .innerRadius(30)
        .dimension(dimRuralUrban)
        .group(groupRuralUrban)
        .renderTitle(true)
        .title(function (d) {
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
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
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
        })
        .xAxis().ticks(5);

    whatChart.width($('#hxd-3W-what').width()).height(400)
        .dimension(whatDimension)
        .group(whatGroup)
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
            text = d.key + " | Beneficiaries : " + d.value;
            return text.toUpperCase();
        })
        .xAxis().ticks(5)

    dc.dataCount('#count-info')
        .dimension(cf)
        .group(all);

    whereChart.width($('#hxd-3W-where').width()).height(360)
        .dimension(whereDimension)
        .group(whereGroup)
        .center([0, 0])
        .zoom(0)
        .geojson(geom)
        .colors(['#CCCCCC', config.color])
        .colorDomain([0, 1])
        .colorAccessor(function (d) {
            if (d > 0) {
                return 1;
            } else {
                return 0;
            }
        })
        .featureKeyAccessor(function (feature) {
            return feature.properties[config.joinAttribute];
        }).popup(function (d) {
            return lookup[d.key];
        })
        .renderPopup(true);


    dim = cf.dimension(function (d) {
        return d[config.whoFieldName];
    });
    gp = cf.groupAll().reduce(
        function (p, v) {
            p.peopleAssisted += +v[config.sumField];
            p.amountTransfered += +v["Estimated"];
            p.numOrgs += 1;
            return p;
        },
        function (p, v) {
            p.peopleAssisted -= +v[config.sumField];
            p.amountTransfered -= +v["Estimated"];
            p.numOrgs -= 1;
            if (p.peopleAssisted < 0) p.peopleAssisted = 0;
            if (p.amountTransfered < 0) p.amountTransfered = 0;
            if (p.numOrgs < 0) p.numOrgs = 0;
            return p;
        },
        function () {
            return {
                peopleAssisted: 0,
                amountTransfered: 0,
                numOrgs: 0
            };

        }
    );

    var peopleA = function (d) {
        return d.peopleAssisted;
    };

    var amountT = function (d) {
        return d.amountTransfered;
    };

    var numO = function (d) {
        return d.numOrgs;
    };

    peopleAssisted.group(gp)
        .valueAccessor(peopleA);

    amountTransfered.group(gp)
        .valueAccessor(amountT);

    numberOrgs.group(gp)
        .valueAccessor(numO);

    dc.renderAll();

    var map = whereChart.map();

    zoomToGeom(geom);

    if (config.sum) {
        var axisText = config.sumField.substr(0);
    } else {
        var axisText = 'Activities';
    }


    var g = d3.selectAll('#hdx-3W-who').select('svg').append('g');

    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#hdx-3W-who').width() / 2)
        .attr('y', 400)
        .text(axisText);

    var g = d3.selectAll('#hdx-3W-what').select('svg').append('g');

    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#hdx-3W-what').width() / 2)
        .attr('y', 400)
        .text(axisText);

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
}

function hxlProxyToJSON(input, headers) {
    var output = [];
    var keys = []
    input.forEach(function (e, i) {
        if (i == 0) {
            e.forEach(function (e2, i2) {
                var parts = e2.split('+');
                var key = parts[0]
                if (parts.length > 1) {
                    var atts = parts.splice(1, parts.length);
                    atts.sort();
                    atts.forEach(function (att) {
                        key += '+' + att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function (e2, i2) {
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

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
