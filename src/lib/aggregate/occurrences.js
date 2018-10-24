var occurrences = ee.FeatureCollection("ft:1P5obit-elnFpwISENVbXDYUiIdQXBZmVKgsvBhfC");

var sequential = require('users/floracast-v1/occurrences:sequential-features');
// var nonsequential = require('users/floracast-v1/occurrences:nonsequential-features')
// var condensed = require('users/floracast-v1/occurrences:condensed-sequential-features')
// var epochal = require('users/floracast-v1/occurrences:epochal-features');

var features = occurrences
    .filterDate('2002', '2019')
    .limit(20).map(function(f){
        return sequential.fetch(f)
    })

print(features)

// print(features)

// print(f)

// .map(function(o){
//   o = ee.Feature(o);
//   var region = ee.Dictionary(
//     condensed.fetch(
//       o.get('system:time_start'),
//       o.geometry()
//     )
//   );
//   return ee.Feature(o.set(region));
// });

// print(features)