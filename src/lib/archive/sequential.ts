import ee from '@google/earthengine';

const parse = (
  f: ee.UncastFeature,
  collection: ee.UncastImageCollection
): ee.Object => {
  const feature = ee.Feature(f);

  const date = ee.Date(feature.get('system:time_start'));

  const ic = ee
    .ImageCollection(collection)
    .filterDate(date.advance(-180, 'day'), date)
    .sort('system:time_start');

  const img = ee.Image(ee.ImageCollection(ic).toArrayPerBand(0));

  const region = img.reduceRegion({
    geometry: feature.geometry(),
    reducer: ee.call('Reducer.first'),
    scale: 30
  });

  return ee.Dictionary.fromLists([ee.String(ic.get('system:id'))], [region]);
};

export const fetch = (f: ee.UncastFeature) => {
  const vegetationCollections = ee.List([
    // MOD13A1.006 Terra Vegetation Indices 16-Day Global 500m
    // MODIS/006/MOD13A1 // Should be covered by 250m resolution version.

    // MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m
    ee
      .ImageCollection('MODIS/006/MOD13Q1')
      .select([
        'EVI',
        'NDVI',
        'sur_refl_b01',
        'sur_refl_b02',
        'sur_refl_b03',
        'sur_refl_b07'
      ]),

    // MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m
    ee
      .ImageCollection('MODIS/006/MYD13Q1')
      .select([
        'EVI',
        'NDVI',
        'sur_refl_b01',
        'sur_refl_b02',
        'sur_refl_b03',
        'sur_refl_b07'
      ]),

    // MOD16A2.006: Terra Net Evapotranspiration 8-Day Global 500m
    // MODIS_006_MOD16A2,

    // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    // NASA_NLDAS_FORA0125_H002, // Ignored because it should be included in IDAHO_EPSCOR_GRIDMET

    // NOAA CDR AVHRR NDVI: Normalized Difference Vegetation Index, Version 4
    // NOAA_CDR_AVHRR_NDVI_V4.select(['NDVI']),

    // MCD15A3H.006 MODIS Leaf Area Index/FPAR 4-Day Global 500m
    ee.ImageCollection('MODIS/006/MCD15A3H')
  ]);

  // Weather Indexes
  const weatherCollections = ee.List([
    // PRISM Daily Spatial Climate Dataset AN81d
    // OREGONSTATE_PRISM_AN81d,

    // CFSV2: NCEP Climate Forecast System Version 2, 6-Hourly Products
    ee.ImageCollection('NOAA/CFSV2/FOR6H')

    // GRIDMET: University of Idaho Gridded Surface Meteorological Dataset
    // IDAHO_EPSCOR_GRIDMET,

    // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    // NASA_NLDAS_FORA0125_H002, // Ignored because it should be included in IDAHO_EPSCOR_GRIDMET
  ]);

  const res = vegetationCollections
    .cat(weatherCollections)
    .iterate((imageCollection, feature) => {
      const data = ee.Dictionary(parse(feature, imageCollection));
      return ee.Feature(feature).setMulti(data);
    }, ee.Feature(f));

  return new Promise((resolve, reject) => {
    return res.evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};
