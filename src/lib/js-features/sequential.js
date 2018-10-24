var MODIS_006_MOD16A2 = ee.ImageCollection("MODIS/006/MOD16A2"),
    OREGONSTATE_PRISM_AN81d = ee.ImageCollection("OREGONSTATE/PRISM/AN81d"),
    MODIS_006_MOD13Q1 = ee.ImageCollection("MODIS/006/MOD13Q1"),
    MODIS_006_MYD13Q1 = ee.ImageCollection("MODIS/006/MYD13Q1"),
    NOAA_CDR_AVHRR_NDVI_V4 = ee.ImageCollection("NOAA/CDR/AVHRR/NDVI/V4"),
    MODIS_006_MCD15A3H = ee.ImageCollection("MODIS/006/MCD15A3H"),
    NOAA_CFSV2_FOR6H = ee.ImageCollection("NOAA/CFSV2/FOR6H"),
    IDAHO_EPSCOR_GRIDMET = ee.ImageCollection("IDAHO_EPSCOR/GRIDMET");

// Vegetation Indexes
var vegetation_collections = ee.List([

    // MOD13A1.006 Terra Vegetation Indices 16-Day Global 500m
    // MODIS/006/MOD13A1 // Should be covered by 250m resolution version.

    // MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m
    MODIS_006_MOD13Q1.select(['EVI', 'NDVI', 'sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b07']),

    // MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m
    MODIS_006_MYD13Q1.select(['EVI', 'NDVI', 'sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b07']),

    // MOD16A2.006: Terra Net Evapotranspiration 8-Day Global 500m
    MODIS_006_MOD16A2,

    // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    // NASA_NLDAS_FORA0125_H002, // Ignored because it should be included in IDAHO_EPSCOR_GRIDMET

    // NOAA CDR AVHRR NDVI: Normalized Difference Vegetation Index, Version 4
    NOAA_CDR_AVHRR_NDVI_V4.select(['NDVI']),

    // MCD15A3H.006 MODIS Leaf Area Index/FPAR 4-Day Global 500m
    MODIS_006_MCD15A3H,

    // MCD15A3H.006 MODIS Leaf Area Index/FPAR 4-Day Global 500m
])


// Weather Indexes
var weather_collections = ee.List([
    // PRISM Daily Spatial Climate Dataset AN81d
    OREGONSTATE_PRISM_AN81d,

    // CFSV2: NCEP Climate Forecast System Version 2, 6-Hourly Products
    NOAA_CFSV2_FOR6H,

    // GRIDMET: University of Idaho Gridded Surface Meteorological Dataset
    IDAHO_EPSCOR_GRIDMET,

    // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    // NASA_NLDAS_FORA0125_H002, // Ignored because it should be included in IDAHO_EPSCOR_GRIDMET

])



function parse(feature, collection) {

    var ic = ee.ImageCollection(collection);
    feature = ee.Feature(feature);

    var date = ee.Date(feature.get('system:time_start'));

    ic = ic
        .filterDate(date.advance(-180, 'day'), date)
        .sort('system:time_start');

    var img = ee.Image(ic.toArrayPerBand(0))

    var region = img.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: feature.geometry(),
        scale: 30
    });

    return ee.Dictionary.fromLists(
        [ee.String(ic.get('system:id'))],
        [region]
    );
}

exports.fetch = function(f) {

    var imageCollections = ee.List(
        vegetation_collection
            .cat(weather_collections)
    )

    return imageCollections.iterate(function(imageCollection, feature) {
        feature = ee.Feature(feature);
        return feature.setMulti(
            ee.Dictionary(
                parse(feature, imageCollection)
            )
        )
    }, ee.Feature(f))
}