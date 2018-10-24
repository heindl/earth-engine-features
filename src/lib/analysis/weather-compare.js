var jsonfile = require('jsonfile');
var _ = require('lodash');
var moment = require('moment');
var math = require('mathjs');

var Rutland_Vermont_20151101_MinTemp =
    [30,27,36,19,18,25,34,37,28,27,18,19,37,36,30,28,23,25,25,28,43,41,39,37,46,37,36,37,32,27,25,25,43,43,41,34,28,30,18,18,30,34,28,28,27,1,1,3,14,19,34,36,18,14,10,10,18,30,25,10,9,5,7,5,7,3,9,25,21,18,28,23,30,30,27,34,30,18,17,21,21,18,25,3,-4,-8,-17,-9,21,28,12,9,30,30,14,10,30,30,16,10,32,37,16,16,9,10,10,16,25,34,41,43,28,25,34,34,36,34,36,27,19,14,30,27,30,28,32,28,30,37,27,21,45,45,34,19,12,5,14,36,28,23,21,36,37,30,27,27,30,34,37,39,36,32,54,36,30,30,30,28,27,30,34,43,39,44,45,44,46,49,39,35,30,36,40,50,47,38,36,46];

var Rutland_Vermont_20151101_AvgTemp = [42,36,41,28,27,35,44,50,43,31,27,29,42,40,36,37,35,34,33,37,48,48,46,43,49,46,38,43,39,31,30,38,48,49,56,45,37,38,24,25,33,36,32,29,32,14,9,20,26,28,36,43,27,21,18,18,27,34,30,17,14,14,14,15,14,12,19,37,29,29,30,30,39,44,33,40,44,25,27,30,26,23,30,14,8,4,-8,6,37,31,20,23,42,38,22,24,37,43,23,23,42,46,28,29,16,20,19,27,34,44,57,54,37,41,43,39,41,45,46,35,27,27,35,36,39,37,41,39,46,41,33,38,56,58,41,28,17,18,26,47,36,31,31,41,44,38,40,43,47,53,55,47,46,53,62,46,41,43,37,42,40,46,49,46,43,50,48,50,58,56,47,45,49,53,61,59,60,45,44,56];

// function precisionRound(number, precision) {
//     var factor = Math.pow(10, precision);
//     return Math.round(number * factor) / factor;
// }

function getDateArray(feature) {

    var endDate = moment(feature.properties.time_start);
    var currentDate = endDate.clone().add(-180, 'days');
    var dateArray = [];
    while (currentDate < endDate) {
        dateArray.push( currentDate.format('YYYYMMDD') );
        currentDate = moment(currentDate).add(1, 'days');
    }
    return dateArray;
}

function compare() {

    jsonfile.readFile('/Users/m/Desktop/morels.geojson', function(err, feature_collection) {
        if (err) {
            return reject(err);
        }

        _.each(feature_collection.features, function (feature) {

            // console.log(precisionRound(feature.geometry.coordinates[0], 2))
            // -73.063467
            if (feature.geometry.coordinates[0] !== -73.063467) {
                return
            }

            var obj = aggregate(feature);

            // console.log(obj.idaho.slice(0, 20))
            // console.log(obj.oregon.slice(0, 20))

            var stats = {
                mean: {},
                median: {},
                max: {},
                min: {},
                std: {},
                variance: {},
                maxDate: {}
            };

            _.each([
                ['oregon/idaho', obj.idaho, obj.oregon],
                ['oregon/noaa', obj.oregon, obj.noaa],
                ['idaho/noaa', obj.idaho, obj.noaa],
                ['wu/noaa', Rutland_Vermont_20151101_AvgTemp, obj.noaa],
                ['wu/idaho', Rutland_Vermont_20151101_MinTemp, obj.idaho],
                ['wu/oregon', Rutland_Vermont_20151101_MinTemp, obj.oregon]
            ], function(a){

                var w1 = math.add(a[1].slice(0), 200);
                var w2 = math.add(a[2].slice(0), 200);

                var diff = math.abs(math.subtract(w1.slice(0), w2.slice(0)));
                //
                var i = diff.indexOf(math.max(diff));

                stats.mean[a[0]] = math.mean(diff),
                stats.median[a[0]] = math.median(diff);
                stats.max[a[0]] = math.max(diff);
                stats.min[a[0]] = math.min(diff);
                stats.std[a[0]] = math.std(diff);
                stats.variance[a[0]] = math.var(diff);
                stats.maxDate[a[0]] = obj.dates[i];
            });

            console.log(stats)




            // var matrix = math.matrix([
            //     dates, dates.idaho, dates.oregon, dates.noaa, Rutland_Vermont_20151101_MinTemp
            // ]);
            //
            // var subset = matrix.subset(
            //     math.index(
            //         math.range(0,4), math.range(0,10)
            //     )
            // );

        })
    })
}

function aggregate(feature) {
    var IDAHO_EPSCOR_GRIDMET_MIN_TEMP = feature['properties']['IDAHO_EPSCOR_GRIDMET']['tmmn'];

    var OREGONSTATE_PRISM_AN81d_MIN_TEMP = feature['properties']['OREGONSTATE/PRISM/AN81d']['tmin'];

    if (_.isNull(IDAHO_EPSCOR_GRIDMET_MIN_TEMP) || _.isNull(OREGONSTATE_PRISM_AN81d_MIN_TEMP)) {
        return [];
    }

    var IDAHO_EPSCOR_GRIDMET_MAX_TEMP = feature['properties']['IDAHO_EPSCOR_GRIDMET']['tmmx'];
    var OREGONSTATE_PRISM_AN81d_MAX_TEMP = feature['properties']['OREGONSTATE/PRISM/AN81d']['tmax'];


    var IDAHO_EPSCOR_GRIDMET = math.mean([IDAHO_EPSCOR_GRIDMET_MIN_TEMP, IDAHO_EPSCOR_GRIDMET_MAX_TEMP], 0);
    var OREGONSTATE_PRISM_AN81d = math.mean([OREGONSTATE_PRISM_AN81d_MIN_TEMP, OREGONSTATE_PRISM_AN81d_MAX_TEMP], 0);

    var dates = getDateArray(feature);

    // Convert to farenheight for sanity check.
    IDAHO_EPSCOR_GRIDMET = IDAHO_EPSCOR_GRIDMET.map(function(k){return k * (9/5) - 459.67});
    OREGONSTATE_PRISM_AN81d = OREGONSTATE_PRISM_AN81d.map(function(c){return c + 273.15}).map(function(k){return k * (9/5) - 459.67});

    var NOAA = feature['properties']['NOAA/CFSV2/FOR6H']['Temperature_height_above_ground'];

    // print(JSON.stringify({
    //     'a': noaaTmin.slice(0, 40),
    //     'b': math.reshape(noaaTmin, [180, 4]).slice(0, 10),
    //     'c': math.mean(math.reshape(noaaTmin, [180, 4]), 1).slice(0, 10)
    // }));

    NOAA = math.mean(math.reshape(NOAA, [180, 4]), 1);
    NOAA = NOAA.map(function(k){return k * (9/5) - 459.67});

    return {
        'date': moment(feature.properties.time_start).format('YYYY-MM-DD'),
        'dates': dates,
        'geo': feature.geometry.coordinates,
        'idaho': IDAHO_EPSCOR_GRIDMET,
        'oregon': OREGONSTATE_PRISM_AN81d,
        'noaa': NOAA
    }
}