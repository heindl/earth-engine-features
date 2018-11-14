
// TODO: consider smooth.js for making all arrays the same length.
// TODO: Focus alot on documentation.
// This will seperate the project from other GIS applications in that everything is very easy to use and clear.

// var timeSeriesReducer = function(label) {
//   return function (accumulator, occurrence) {
//     if (!isValid(occurrence)) {
//       return accumulator
//     }
//
//     var a = _.keys(weather_features).map(function(feature) {
//       var intervalsToRemoveFromBeginning = occurrence.properties[feature].length - 720;
//       // a.push(math.mean(math.reshape(p.slice(p.length - 720), [180, 4]), 1));
//       return occurrence.properties[feature].slice(intervalsToRemoveFromBeginning);
//     });
//
//     _.keys(vegetation_features).forEach(function(feature){
//       var domain = occurrence.properties[feature];
//       if (domain.length === 0) {
//         domain = [0, 0]
//       }
//       var s = smooth(domain, { period: [0, 719], method: smooth.METHOD_LINEAR });
//       res = [];
//       for (var i = 0; i<720; i++) {
//         res.push(s(i));
//       }
//       a.push(res);
//     });
//
//     // var id = Date.now();
//
//     var id = randomstring.generate(15);
//
//     var rows = math.transpose(a).map(function(row, interval){
//       return [label, id, interval].concat(row);
//     });
//
//     return accumulator.concat(rows);
//   }
// };

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