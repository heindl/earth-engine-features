

function parse(date, geom, ic) {


    var seq = ee.List.sequence({
        start: 1,
        end: 6,
        step: 1
    });

// print(date, geom, ic)

    ic = ee.ImageCollection(ic)

    date = ee.Date(date);
    geom = ee.Geometry(geom);
    var id = ee.String(ic.get('system:id'));

    var img = ic
        .filterDate(date.advance(-30, 'day'), date)
        .sort('system:time_start')
        .toArrayPerBand(0);

    var region = img.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: geom,
        scale: 30
    });



    // ic = ic.map(function(i){
    //   i = ee.Image(i)
    //   return i.setMulti({'mean_date': i.date().format("YYYY-MM-dd")})
    // })


    // var l = ic.toList(10000).reduce(ee.Reducer.toList().group({
    //   'groupField': 1,
    //   'groupName': 'mean_date'
    // }))

    print(ee.List(l))


    // ic = ic.sort('mean_date');

    // print(ee.ImageCollection(ic).limit(100))

    return ee.Dictionary({})

    // .toArrayPerBand(0)
    // .reduceRegion({
    //   reducer: ee.Reducer.first(),
    //   geometry: geom,
    //   scale: 30
    // });

    // return ee.Dictionary.fromLists(
    //   [id],
    //   [region]
    // );
}

print(parse(
    ee.Date('2014-04-02'),
    ee.Geometry.Point([-97.8072,30.159573]),
    NASA_NLDAS_FORA0125_H002
))

exports.fetch = function(f) {

    var d = parse(
        f.get('system:time_start'),
        f.geometry(),
        NASA_NLDAS_FORA0125_H002
    )

    return f


    // return ee.List([
    //   // CFSV2: NCEP Climate Forecast System Version 2, 6-Hourly Products
    //   // NOAA_CFSV2_FOR6H,
    //   // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    //   NASA_NLDAS_FORA0125_H002,
    // ]).iterate(function(imageCollection, feature) {

    //   print(imageCollection)

    //   return feature

    //   // feature = ee.Feature(feature);
    //   // return feature.setMulti(
    //   //   ee.Dictionary(
    //   //     parse(
    //   //       feature.get('system:time_start'),
    //   //       feature.geometry(),
    //   //       imageCollection
    //   //     )
    //   //   )
    //   // )
    // }, ee.Feature(f))
}


// function condenseImages(dateRange, fc, ic) {

//   ic = ee.ImageCollection(ic)

//   var id = ee.String(ic.get('system:id'));

//   dateRange = ee.DateRange(dateRange);
//   ic = ic.filterDate(
//     dateRange.start(),
//     dateRange.end()
//     ).map(function(i){
//     return ee.Image(i).clipToCollection(fc)
//   });

//   var seq = ee.List.sequence({
//     start: 0,
//     end: dateRange.end().difference(dateRange.start(), 'day'),
//     step: 1
//   });

//   var condensed = seq.map(function(i){
//       var days_to_advance = ee.Number(i);
//       // appears to be 00:00:00 ...
//       var start = dateRange.start().advance(days_to_advance, 'day')
//       var end = start.advance(24, 'hour');
//       i = ee.ImageCollection(ic.filterDate(start, end)).mean();
//       return i.set('system:time_start', start);
//     });

//   return ee.ImageCollection(condensed).set('system:id', id)

// }

// function updateFeature(f, ic) {
//   f = ee.Feature(f);
//   var end = ee.Date(f.get('system:time_start'));
//   var start = end.advance(-180, 'day');
//   ic = ee.ImageCollection(ic);
//   var bands = ee.Image(ic.first()).bandNames();
//   var id = ee.String(ic.get('system:id'));

//   var regions = ic.filterDate(start, end).map(function(i){
//     i = ee.Image(i);
//     return ee.Feature(f.geometry(), i.reduceRegion({
//       reducer: ee.Reducer.first(),
//       geometry: f.geometry(),
//       scale: 30,
//     })).set('system:time_start', i.get('system:time_start'))
//   })

//   regions = ee.FeatureCollection(regions).sort('system:time_start');

//   var aggregated = bands.map(function(band){
//     return regions.aggregate_array(ee.String(band))
//   })

//   return f.set(ee.Dictionary.fromLists(
//     [id],
//     [ee.Dictionary.fromLists(bands, aggregated)]
//   ))
// }

// exports.fetch = function(feature) {

//   feature = ee.Feature(feature);
//   var date = ee.Date(feature.get('system:time_start'));

//   // var id = ee.String(ic.get('system:id'));

//   var ic = NOAA_CFSV2_FOR6H
//   .filterDate(date.advance(-180, 'day'), date)
//   .sort('system:time_start')
//   .toArrayPerBand(0)
//   .reduceRegion({
//       reducer: ee.Reducer.first(),
//       geometry: feature.geometry(),
//       scale: 30
//     });

//   print(ic)

//   // return ee.Image(ic.first()).bandNames().iterate(function(band, f){

//   //   ic.getRegions()

//   // }, feature)

//   // var ic = NOAA_CFSV2_FOR6H
//   // .filterDate(
//   //   f.get('system:time_start').advance(-180, 'day'),
//   //   f.get('system:time_start')
//   // ).map(function(i){
//   //   i = ee.Image(i);
//   //   return i.g
//   // })
//   // .getRegion(f.geometry());



//   // .map(function(r){
//   //   r = ee.List(r);
//   //   return ee.Feature(
//   //     ee.Geometry.Point([r.get(1), r.get(2)]))
//   //   return
//   // })

//   // ic.get



// }

// // exports.fetch = function(fc) {

// //   fc = ee.FeatureCollection(fc);


  var dateRange = ee.DateRange(
    fc.aggregate_min('system:time_start'),
    fc.aggregate_max('system:time_start')
  );

// //   // var images = ee.ImageCollection(condenseImages(dateRange, fc, NOAA_CFSV2_FOR6H));

// //   // print(images.limit(100))
// //   // var datasets = collections.iterate(function(ic, list){
// //   //   var obj = condenseImages(dateRange, fc, ic);
// //   //   return list.add(condenseImages(dateRange, fc, ic))
// //   // }, ee.List([]));


// //   var v1 = ee.ImageCollection(condenseImages(dateRange, fc, NOAA_CFSV2_FOR6H));
// //   var v2 = ee.ImageCollection(condenseImages(dateRange, fc, NASA_NLDAS_FORA0125_H002));

// //   // print(v1.limit(100))

// //   // return fc

// //   return fc.map(function(f){

// //       f = ee.Feature(f)

// //         f = updateFeature(f, v1);
// //         f = updateFeature(f, v2);

// //         return f

// //   })

// // }