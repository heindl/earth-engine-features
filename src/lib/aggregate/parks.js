function fetchWeather(occurrenceTime, occurrenceGeometry) {

    var properties = ee.List([
        ee.ImageCollection('NASA/NLDAS/FORA0125_H002'),
        ee.ImageCollection('NOAA/CFSV2/FOR6H'),
        ee.ImageCollection('OREGONSTATE/PRISM/AN81d')
    ]).map(function(c) {

        var weatherCollection = ee.ImageCollection(c);

        var bands = ee.Image(weatherCollection.first()).bandNames();

        var sequence = ee.List.sequence({start: 1, end: 180, step: 1}).map(function(i){
            var days_to_advance = ee.Number(i).multiply(-1);
            // appears to be 00:00:00 ...
            var date = occurrenceTime.advance(days_to_advance, 'day');
            var end = date.advance(24, 'hour');

            var img = weatherCollection.filterDate(date, end).map(function(image){
                return ee.Image(image).clip(occurrenceGeometry)
            }).mean();

            var region = img.reduceRegion({
                reducer: ee.Reducer.first(),
                geometry: occurrenceCoords,
                scale: 30,
            }).set('time_start', date)

            return ee.Feature(occurrenceCoords, region)

        });

        var sorted = ee.FeatureCollection(sequence).sort('time_start');

        var aggregated = bands.map(function(band){
            return sorted.aggregate_array(ee.String(band))
        })

        return ee.Dictionary.fromLists(bands, aggregated);

    });

    return properties.iterate(function(props, res){
        return ee.Dictionary(res).combine(ee.Dictionary(props))
    }, ee.Dictionary({}))


}





// var states = ee.FeatureCollection('ft:1fRY18cjsHzDgGiJiS2nnpUU3v9JPDc2HNaR7Xk8')
//   .filter(ee.Filter.and(
//       ee.Filter.neq('Name', 'Hawaii')));
//       // ee.Filter.neq('Name', 'Alaska')));


// var nations = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw')
//   .filter(ee.Filter.or(
//       ee.Filter.eq('Country', 'Canada'),
//       ee.Filter.eq('Country', 'Mexico')));

// var boundaries = states.merge(nations).geometry()

var minDate = '2000-01-01';
var maxDate = '2019-01-01';

var northAmerica = ee.FeatureCollection('USDOS/LSIB/2013').filter(
    ee.Filter.or(
        ee.Filter.eq('cc', 'MX'),
        ee.Filter.eq('cc', 'US'),
        ee.Filter.eq('cc', 'CA')
    )
);

// Every 16 days // So maybe four times within period.
var vegetationIndex = ee.ImageCollection('MODIS/006/MOD13Q1')
    .filterDate(minDate, maxDate);

// ee.FeatureCollection('ft:usstates-alaska,hawaii+canada lower states')
// .randomPoints(occurrences.length * 10)
// .map(random_dates);

var occurrences = ee.FeatureCollection('ft:1P5obit-elnFpwISENVbXDYUiIdQXBZmVKgsvBhfC')
    .filterDate(minDate, maxDate);


// print(occurrences)

var elevation = ee.Terrain.products(ee.Image('CGIAR/SRTM90_V4').clipToCollection(northAmerica));
// var elevationUpgraded = ee.Terrain.products(elevation);

// elevationImage.getInfo(function(i){print(i)})

// var clippedElevationImage = elevationImage.clipToCollection(occurrences);

// console.log(clippedElevationImage)

// var features = elevation.reduceRegions({
//   collection: occurrences,
//   reducer: ee.Reducer.first(),
//   scale: 30
// });

print(vegetationIndex.first())

// var list = vegetationIndex.getRegion(
//   occurrences.geometry(),
//   30
// );

// console.log(list.slice(1,100))