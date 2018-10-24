
var cutset_geometry = ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169,-49.0, 59.5747563],
    geodesic: false,
});

function get_image(date, fc) {
    fc = ee.List(fc);
    date = ee.Date(date);

    var geometry = ee.FeatureCollection(fc).geometry().simplify(1000);

    var water_image = JRC_GSW1_0_MonthlyHistory.filter(ee.Filter.and(
        ee.Filter.eq('month', date.get('month')),
        ee.Filter.eq('year', date.get('year'))
    )).first();

    water_image = ee.Image(water_image)

    water_image = water_image.clip(geometry);

    var area_image = ee.Image.pixelArea().clip(geometry);

    var water_img = water_image.addBands(area_image)
        .updateMask(water_image.select('water').eq(2))
        .select(['area'], ['water_area']);

    var distance_img = water_img
        .fastDistanceTransform()
        .sqrt()
        .multiply(ee.Image.pixelArea().sqrt());

    return area_image
        .addBands(water_img)
        .addBands(distance_img, ['distance']);

}

var fetch_batch = function(img_date, fc) {

    fc = ee.List(fc);

    var region_fc = fc.iterate(function(f, res){
        f = ee.Feature(f)
        var list = ee.List([
            0, 120, 480, 960, 1920, 7680, 30720
        ]).map(function(i){
            i = ee.Number(i);
            var geometry = f.geometry().buffer({
                distance: i.multiply(2),
                maxError: 30,
            });
            var properties = ee.Dictionary({
                'buffer': i,
                'feature_id': f.get('system:index')
            });
            return ee.Feature(geometry, properties)
        })
        return ee.List(res).cat(list);
    }, ee.List([]))

    var img = get_image(img_date, region_fc)

    var regions = img.reduceRegions({
        collection: ee.FeatureCollection(ee.List(region_fc)),
        reducer: ee.Reducer.sum(),
        scale: 30,
    });

    var combined = ee.Join.saveAll({
        matchesKey: 'joined'
    }).apply(
        ee.FeatureCollection(fc),
        regions,
        ee.Filter.equals({
            leftField: 'system:index',
            rightField: 'feature_id'
        })
    );

    return combined.map(function(f){

        f = ee.Feature(f);
        var fc = ee.FeatureCollection(
            ee.List(f.get('joined'))
        ).sort('buffer');

        var water_area = ee.List(fc.aggregate_array('water_area')).slice(1);
        var area = ee.List(fc.aggregate_array('area')).slice(1);
        var distance = fc.aggregate_first('distance')

        return f.setMulti({
            'surface_water_percentages': ee.Array(
                water_area
            ).divide(ee.Array(area)),
            'surface_water_distance': distance,
            'joined': null
        })

    }).toList(combined.size());
}

function compile_batches(fc){
    fc = ee.List(fc);

    return fc.iterate(function(f, res){
        var date = ee.Date(ee.Feature(f).get('time_start'));
        date = date.update({
            year: ee.Array([date.get('year')]).min([2014]).get([0]),
            day: 15,
        });

        var key = date.format('YYYY-MM-dd');

        res = ee.Dictionary(res);

        var list = ee.Algorithms.If(
            res.contains(key),
            ee.List(res.get(key)),
            ee.List([])
        );

        list = ee.List(list).cat([f])

        return res.set(key, list);
    }, ee.Dictionary({}));
}

var fetch = function(fc) {
    return ee.Dictionary(
        compile_batches(fc))
        .map(fetch_batch)
        .values()
        .flatten();
}

var occurrences = ee.FeatureCollection("ft:1P5obit-elnFpwISENVbXDYUiIdQXBZmVKgsvBhfC");

var features = occurrences
    .filterDate('2002', '2019')
    .filterBounds(cutset_geometry)
    .sort('time_start')
    .limit(40);

print(fetch(features.toList(features.size())))

// var fc = ee.FeatureCollection([
//   ee.Feature(
//     ee.Geometry.Point([-97.8072,30.159573]),
//     ee.Dictionary({
//         'time_start': ee.Date.fromYMD(2014, 4, 2)
//     })
//   )
// ])

// print(fetch_batch(fc, ee.String('JRC/GSW1_0/MonthlyHistory/2014_04')));

// exports.fetch = function(fc) {

//   // Group features by month

//   fc = ee.FeatureCollection(fc);
//   return fc.map(function(f){
//     return fetch(f)
//   })
// }


