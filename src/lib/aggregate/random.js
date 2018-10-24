
function boundary() {
    var cutset_geometry = ee.Geometry.Rectangle({
        coords: [-145.1767463, 24.5465169,-49.0, 59.5747563],
        geodesic: false,
    });

    var north_america_geometry = north_america.filter(
        ee.Filter.or(
            ee.Filter.eq('Country', 'Canada'),
            ee.Filter.eq('Country', 'Mexico'),
            ee.Filter.eq('Country', 'United States')
        )
    ).geometry(500)

    return north_america_geometry
        .intersection(cutset_geometry, 500);
}

var random_time_start = 1262304000000; // 2010
var random_time_end = 1388534400000; // 2014
var random_time_span = 126230400000; // 4 yrs

function divisions_next(number_of_points) {

    var bounds = ee.Geometry(boundary());

    var img = ee.Image.pixelArea()
        .addBands(
            ee.Image()
                .byte()
                .paint(ecoregions, 'ECO_NUM')
                .rename('ECO_NUM')
        )
        .clip(bounds);

    var groups = ee.List(
        img.reduceRegion({
            reducer: ee.Reducer.sum().group({
                groupField: 1,
                groupName: 'label',
            }),
            scale: 30,
            bestEffort: true
        }).get('groups'));

    var labels = groups.map(function(r){
        return ee.Number(ee.Dictionary(r).get('label'))
    });

    var group_summations = groups.map(function(r){
        return ee.Number(ee.Dictionary(r).get('sum'))
    });

    var total_area = group_summations.reduce(ee.Reducer.sum());

    var class_points = group_summations.map(function(v){
        v = ee.Number(v)
        v = v.divide(total_area)
        return v.multiply(number_of_points).round()
    });

    var stratified = img
        .addBands(
            ee.Image.pixelLonLat()
        )
        .stratifiedSample({
            numPoints: number_of_points,
            classValues: labels,
            classPoints: class_points,
            classBand: 'ECO_NUM',
            // projection: 'EPSG:4326',
            scale: 500,
            dropNulls: true,
        })
        .map(function(f) {
            return f.setGeometry(
                ee.Geometry.Point([
                    f.get('longitude'),
                    f.get('latitude')
                ])
            )
        });


    stratified = stratified.randomColumn('random');

    stratified = stratified.map(function(f){
        f = ee.Feature(f);
        var timestamp = ee.Number(
            f.get('random')
        ).multiply(
            random_time_span
        )
            .round()
            .add(
                random_time_start
            );
        var date = ee.Date(timestamp).update({
            hour: 12,
            minute: 0,
            second: 0
        }).millis();
        return f.setMulti({
            'random': null,
            'time_start': date,
            'time_end': date,
            'system:time_start': date,
            'system:time_end': date
        })
    })

    return stratified

    //   Map.addLayer(
    //   ee.Image()
    //     .byte()
    //     .paint(stratified, 'ECO_NUM')
    //     .randomVisualizer()
    // );

}

exports.fetch = function(i) {
    return divisions_next(i)
}

// var out = divisions_next(500)
// .aggregate_array('time_start')

// out = ee.List(out)
// .map(function(i) {
//   return ee.Date(i).format('YYYYMM')
// })

// out = ee.List(out).sort()

// print(out)

