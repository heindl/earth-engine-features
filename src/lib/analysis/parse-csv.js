// var GeoJSON = require('geojson');
var _ = require('lodash');
var jsonfile = require('jsonfile');
var math = require('mathjs');
var fs = require('fs');
var randomstring = require('randomstring');
var smooth = require('./smooth.js').Smooth;


var vegetation_features = {
    'terra_normalized_vegetation_indices': 9,
    'terra_enhanced_vegetation_indices': 9,
    'terra_red_surface_reflectance': 9,
    'terra_nir_surface_reflectance': 9,
    'terra_blue_surface_reflectance': 9,
    'terra_mir_surface_reflectance': 9,
    'aqua_normalized_vegetation_indices': 9,
    'aqua_enhanced_vegetation_indices': 9,
    'aqua_red_surface_reflectance': 9,
    'aqua_nir_surface_reflectance': 9,
    'aqua_blue_surface_reflectance': 9,
    'aqua_mir_surface_reflectance': 9
};

var weather_features = {
    'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average': 720,
    'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average': 720,
    'Latent_heat_net_flux_surface_6_Hour_Average': 720,
    'Precipitation_rate_surface_6_Hour_Average': 720,
    'Pressure_surface': 720,
    'Sensible_heat_net_flux_surface_6_Hour_Average': 720,
    'Specific_humidity_height_above_ground': 720,
    'Temperature_height_above_ground': 720,
    'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average': 720,
    'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average': 720,
    'u-component_of_wind_height_above_ground': 720,
    'v-component_of_wind_height_above_ground': 720
};

var index_features = {
    'aspect': 1,
    'elevation': 1,
    'slope': 1,
    'landcover': 1,
    // 'fire_days_since': 1,
    'surface_water_percentages': 5,
    'surface_water_distance': 1,
    'Geopotential_height_surface': 1
};

var features = Object.assign({}, vegetation_features, weather_features, index_features);

var isValid = function(occurrence) {
    var props = occurrence.properties;
    for (var featureName in features) {
        if (features.hasOwnProperty(featureName)) {
            var f = props[featureName];
            var expectedLength = features[featureName];

            if (_.isUndefined(f) || _.isNull(f)) {
                // console.log("null", featureName);
                return false
            }
            if (expectedLength === 1 && !_.isNumber(f)) {
                // console.log("expected number", featureName);
                return false
            }

            if (expectedLength > 1 && !_.isArray(f)) {
                // console.log("not an array", featureName);
                return false
            }

           if (expectedLength > 1 && f.length < expectedLength) {
                // console.log("less than expected", featureName, f.length)
               return false
           }
        }
    }
    return true
};
//
// var featureReducer = function(label) {
//     return function (accumulator, occurrence) {
//
//         if (!isValid(occurrence)) {
//             return accumulator
//         }
//
//         var props = occurrence.properties;
//
//         if (_.isUndefined(props['fire_days_since']) || _.isNull(props['fire_days_since'])) {
//             props['fire_days_since'] = -1;
//         }
//
//         var values = [label];
//         // var labels = ["label"];
//
//         [
//             "aspect",
//             "elevation",
//             "slope",
//             // 'fire_days_since',
//             // "landcover",
//             "surface_water_distance",
//             "Geopotential_height_surface"
//         ].forEach(function (l) {
//             // labels.push(l+",1,1");
//             values.push(props[l]);
//         });
//
//         props['surface_water_percentages'].forEach(function(v, i){
//             // labels.push("surface_water_percentages,5,"+i);
//             values.push(v);
//         });
//
//         _.forIn(vegetation_features, function(v, fName) {
//             var p = props[fName];
//             var l = p.length;
//             [
//                 p.slice(l - 9),
//                 math.mean(math.reshape(p.slice(l - 9), [3, 3]), 1),
//                 math.mean(math.reshape(p.slice(l - 6), [2, 3]), 1),
//                 math.mean(math.reshape(p.slice(l - 8), [4, 2]), 1)
//             ].forEach(function (vl) {
//                 vl.forEach(function (v, i) {
//                     // labels.push(fName + ',' + vl.length + ',' + i);
//                     values.push(v);
//                 });
//             })
//         });
//
//         _.forIn(weather_features, function(v, fName) {
//             var p = props[fName];
//             var l = math.mean(math.reshape(p.slice(p.length - 720), [180, 4]), 1);
//             [
//                 l,
//                 math.mean(math.reshape(l, [90, 2]), 1),
//                 math.mean(math.reshape(l, [60, 3]), 1),
//                 math.mean(math.reshape(l, [45, 4]), 1),
//                 math.mean(math.reshape(l, [30, 6]), 1),
//                 math.mean(math.reshape(l, [20, 9]), 1),
//                 math.mean(math.reshape(l, [18, 10]), 1)
//             ].forEach(function (vl) {
//                 vl.forEach(function (v, i) {
//                     // labels.push(fName + ',' + vl.length + ',' + i);
//                     values.push(v);
//                 });
//             })
//         });
//
//         accumulator.push(values);
//
//         return accumulator;
//     };
// };



// var parse = function(id, filepath, label) {
//
//     return new Promise(function (resolve, reject) {
//
//         jsonfile.readFile(filepath, function (err, obj) {
//             if (err) {
//                 return reject(err);
//             }
//
//             // var res = {
//             //     'index_properties': []
//             // };
//             //
//             // _.forIn(Object.assign({}, vegetation_features, weather_features), function(v, k){
//             //     res[k] = []
//             // });
//
//             return resolve(
//                 [id, obj.features.reduce(featureReducer(label), [])]
//             )
//         });
//     });
// };

var parse = function(filepath, reducer, filestream, iterations) {

    return new Promise(function (resolve, reject) {

        jsonfile.readFile(filepath, function (err, obj) {
            if (err) {
                return reject(err);
            }

            for (var i = 0; i < iterations; i++) {
                obj.features.reduce(reducer, []).forEach(function(vector) {
                    filestream.write(vector.join(',') + '\n');
                });
            }

            return resolve()
        });
    });
};

var vectorReducer = function(label) {
    return function (accumulator, occurrence) {

        if (!isValid(occurrence)) {
            return accumulator
        }

        var matrix = _.keys(weather_features).map(function(label){
            var prop = occurrence.properties[label];
            return prop.slice(prop.length - 720);
        });

        accumulator.push({"label": label, "matrix": math.transpose(matrix)});
        return accumulator

    };
};

var timeSeriesReducer = function(label) {
    return function (accumulator, occurrence) {
        if (!isValid(occurrence)) {
            return accumulator
        }

        var a = _.keys(weather_features).map(function(feature) {
            var intervalsToRemoveFromBeginning = occurrence.properties[feature].length - 720;
            // a.push(math.mean(math.reshape(p.slice(p.length - 720), [180, 4]), 1));
            return occurrence.properties[feature].slice(intervalsToRemoveFromBeginning);
        });

        _.keys(vegetation_features).forEach(function(feature){
            var domain = occurrence.properties[feature];
            if (domain.length === 0) {
                domain = [0, 0]
            }
            var s = smooth(domain, { period: [0, 719], method: smooth.METHOD_LINEAR });
            res = [];
            for (var i = 0; i<720; i++) {
                res.push(s(i));
            }
            a.push(res);
        });

        // var id = Date.now();

        var id = randomstring.generate(15);

        var rows = math.transpose(a).map(function(row, interval){
            return [label, id, interval].concat(row);
        });

        return accumulator.concat(rows);
    }
};

function count(filepath) {
    return new Promise(function (resolve, reject) {
        jsonfile.readFile(filepath, function (err, obj) {
            if (err) {
                return reject(err);
            }
            return resolve(obj.features.length)
        });
    })
}


var filestream = fs.createWriteStream('/Users/m/Desktop/ParsedOccurrences/standard.csv');

filestream.on('error', function(err) {
    console.error(err);
});

var promises = [
    '2xUhop2',
    'cFHSwIL',
    'MXRYVzj',
    // // 'PFxnNDJ',
    // // 'qJJ1T2R',
    'qW1T2bh'
].map(function(l, i){
    var label = i+1;
    return parse('/Users/m/Desktop/EarthEngineOccurrences/'+l+'.json', timeSeriesReducer(label), filestream, 2)
});

promises.push(
    parse('/Users/m/Desktop/EarthEngineOccurrences/random.json', timeSeriesReducer(0), filestream, 1)
);

Promise.all(promises).then(function(res){
    filestream.end();
}).catch(console.error);