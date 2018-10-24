
var ESA_GLOBCOVER_L4_200901_200912_V2_3 =  ee.Image('ESA/GLOBCOVER_L4_200901_200912_V2_3');
var CGIAR_SRTM90_V4 = ee.Image("CGIAR/SRTM90_V4");
var north_america = ee.Geometry.Rectangle([-178.2,6.6,-49.0,83.3]);

var images = ee.List([
    // SRTM Digital Elevation Data Version 4
    ee.Terrain.products(CGIAR_SRTM90_V4.clip(north_america)).select([
        'slope',
        'aspect',
        'elevation'
    ]),
    // GlobCover: Global Land Cover Map
    ESA_GLOBCOVER_L4_200901_200912_V2_3
]);

function parse(feature, img) {

    feature = ee.Feature(feature);
    img = ee.Image(img);

    var region = img.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: feature.geometry(),
        scale: 30
    });

    return ee.Dictionary.fromLists(
        [ee.String(img.get('system:id'))],
        [region]
    );
}

exports.fetch = function(feature) {

    return images.iterate(function(img, f) {
        f = ee.Feature(f);
        return f.setMulti(
            ee.Dictionary(
                parse(f, img)
            )
        )
    }, ee.Feature(feature))
};