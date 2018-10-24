var USGS_NLCD = ee.ImageCollection("USGS/NLCD");

var collections = ee.List([
    // NLCD: USGS National Land Cover Database
    USGS_NLCD
]);

function parse(feature, collection) {

    var ec = ee.ImageCollection(collection);
    var id = ec.get('system:id');

    var img = ec.map(function(ei){
        ei = ee.Image(ei);
        var difference = ee.Number(ei.date().difference(dt, 'day')).abs();
        return ee.Image(ei.set({'time-since': difference}));
        // return ee.Image(difference).float().select([0], ['time-difference']).addBands(ee.Image(landcover))
    }).sort('time-since').first();

    var region = ee.Image(img).reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: gm,
        scale: 30
    });

    // Map to filter null key value pairs.
    // region = region.map(function(k, v){
    //   return v
    // })

    return ee.Dictionary.fromLists([id], [region])
}

exports.fetch = function(feature) {

    return collections.iterate(function(collection, f) {
        f = ee.Feature(f);
        return f.setMulti(
            ee.Dictionary(
                parse(f, collection)
            )
        )
    }, ee.Feature(feature))
};