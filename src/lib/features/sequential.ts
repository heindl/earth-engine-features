import ee from '@google/earthengine';

const imageCollections = () => {
  const MODIS_006_MOD13Q1 = ee.ImageCollection('MODIS/006/MOD13Q1');
  const MODIS_006_MYD13Q1 = ee.ImageCollection('MODIS/006/MYD13Q1');
  const NOAA_CFSV2_FOR6H = ee.ImageCollection('NOAA/CFSV2/FOR6H');
  // const MODIS_006_MCD15A3H = ee.ImageCollection("MODIS/006/MCD15A3H");

  const MODIS_006_BANDS = ee.List([
    'NDVI',
    'EVI',
    'sur_refl_b01',
    'sur_refl_b02',
    'sur_refl_b03',
    'sur_refl_b07'
  ]);

  return ee.Dictionary({
    'MODIS/006/MOD13Q1': ee.Dictionary({
      bands: MODIS_006_BANDS,
      collection: MODIS_006_MOD13Q1,
      vector_labels: ee.List([
        'terra_normalized_vegetation_indices',
        'terra_enhanced_vegetation_indices',
        'terra_red_surface_reflectance',
        'terra_nir_surface_reflectance',
        'terra_blue_surface_reflectance',
        'terra_mir_surface_reflectance'
      ])
    }),
    'MODIS/006/MYD13Q1': ee.Dictionary({
      bands: MODIS_006_BANDS,
      collection: MODIS_006_MYD13Q1,
      vector_labels: ee.List([
        'aqua_normalized_vegetation_indices',
        'aqua_enhanced_vegetation_indices',
        'aqua_red_surface_reflectance',
        'aqua_nir_surface_reflectance',
        'aqua_blue_surface_reflectance',
        'aqua_mir_surface_reflectance'
      ])
    }),
    'NOAA/CFSV2/FOR6H': ee.Dictionary({
      bands: ee.List([
        'Latent_heat_net_flux_surface_6_Hour_Average',
        'Sensible_heat_net_flux_surface_6_Hour_Average',
        'Temperature_height_above_ground',
        'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
        'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
        'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
        'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
        'Specific_humidity_height_above_ground',
        'Precipitation_rate_surface_6_Hour_Average',
        'Pressure_surface',
        'u-component_of_wind_height_above_ground',
        'v-component_of_wind_height_above_ground',
        'Geopotential_height_surface' // Note that the ordering is important here.
      ]),
      collection: NOAA_CFSV2_FOR6H,
      index_labels: ee.List([
        // Geopotential height is a vertical coordinate
        // referenced to Earth's mean sea level, an adjustment
        // to geometric height (elevation above mean sea level)
        // using the variation of gravity with latitude and
        // elevation. Thus, it can be considered a
        // "gravity-adjusted height".
        // It should be the same for each day.
        'Geopotential_height_surface'
      ]),
      vector_labels: ee.List([
        // Latent heat is the heat moved by water evaporating and
        // condensing higher up in the atmosphere. Heat is absorbed
        // in evaporation and released by condensation – so
        // the result is a movement of heat from the surface
        // to higher levels in the atmosphere.
        'Latent_heat_net_flux_surface_6_Hour_Average',

        // “Sensible” heat is that caused by conduction and convection.
        // For example, with a warm surface and a cooler atmosphere,
        // at the boundary layer heat will be conducted into the atmosphere
        // and then convection will move the heat higher up into the atmosphere.
        'Sensible_heat_net_flux_surface_6_Hour_Average',

        // 'Maximum_temperature_height_above_ground_6_Hour_Interval',
        // 'Minimum_temperature_height_above_ground_6_Hour_Interval',
        'Temperature_height_above_ground',

        // Incoming ultraviolet, visible, and a limited portion of
        // infrared energy (together sometimes called "shortwave
        // radiation") from the Sun drive the Earth's climate system.
        // Some of this incoming radiation is reflected off clouds,
        // some is absorbed by the atmosphere, and some passes through
        // to the Earth's surface. Larger aerosol particles in the
        // atmosphere interact with and absorb some of the radiation,
        // causing the atmosphere to warm.
        'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
        'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',

        // Heat resulting from the absorption of incoming shortwave
        // radiation is emitted as longwave radiation. Radiation
        // from the warmed upper atmosphere, along with a small amount
        // from the Earth's surface, radiates out to space. Most of the
        // emitted longwave radiation warms the lower atmosphere, which
        // in turn warms our planet's surface.
        'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
        'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',

        // 'Maximum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
        // 'Minimum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
        'Specific_humidity_height_above_ground',

        'Precipitation_rate_surface_6_Hour_Average',

        'Pressure_surface',

        // For winds, the u wind is parallel to the x axis.
        // A positive u wind is from the west.
        // A negative u wind is from the east.
        'u-component_of_wind_height_above_ground',

        // The v wind runs parallel to the y axis.
        // A positive v wind is from the south,
        // and a negative v wind is from the north.
        'v-component_of_wind_height_above_ground'
      ])
    })
  });
};

const vectorFeatureLabels = (): ee.UncastList => {
  return ee
    .List(imageCollections().values())
    .map(v => {
      return ee.Dictionary(v).get('vector_labels');
    })
    .flatten();
};

const parseImageCollection = (
  collections: ee.UncastDictionary,
  startDate: ee.Date,
  endDate: ee.Date,
  geometry: ee.UncastGeometry
): ee.UncastList => {
  const collectionDictionary = ee.Dictionary(collections);
  const ic = ee
    .ImageCollection(collectionDictionary.get('collection'))
    .filterDate(ee.Date(startDate), ee.Date(endDate))
    .select(
      collectionDictionary.get('bands'),
      ee
        .List(collectionDictionary.get('vector_labels'))
        .cat(
          ee.Algorithms.If(
            collectionDictionary.contains('index_labels'),
            collectionDictionary.get('index_labels'),
            ee.List([])
          )
        )
    );

  const regions = ic.getRegion({
    geometry: ee.Geometry(geometry),
    scale: 30
  });

  const labels = ee
    .List(regions.get(0))
    .slice(3)
    .set(0, 'system:time_start');
  return regions.slice(1).map(regionList => {
    const list = ee.List(regionList);
    const lng = ee.Number(list.get(1));
    const lat = ee.Number(list.get(2));
    return ee.Feature(
      ee.Geometry.Point([lng, lat]),
      ee.Dictionary.fromLists(labels, list.slice(3))
    );
  });
};

const fetchFeature = (uf: ee.UncastFeature) => {
  const f = ee.Feature(uf);

  const startDate = ee.Date(f.get('system:time_start')).advance(-180, 'day');
  const endDate = ee.Date(f.get('system:time_start'));

  const valueFeatures = ee
    .FeatureCollection(
      imageCollections()
        .values()
        .map(v => {
          return parseImageCollection(v, startDate, endDate, f.geometry());
        })
        .flatten()
    )
    .sort('system:time_start');

  const vectors = ee.List(vectorFeatureLabels()).map(s => {
    return valueFeatures.aggregate_array(ee.String(s));
  });

  return f.setMulti(
    ee.Dictionary.fromLists(
      ee.List(vectorFeatureLabels()).cat(['Geopotential_height_surface']),
      vectors.cat([
        valueFeatures.aggregate_first('Geopotential_height_surface')
      ])
    )
  );
};

export default function(fc: ee.FeatureCollection): ee.FeatureCollection {
  return ee.FeatureCollection(fc).map(fetchFeature);
}
