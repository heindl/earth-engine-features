import ee from '@google/earthengine';

export default function(features: ee.FeatureCollection): ee.FeatureCollection {
  features = ee.FeatureCollection(features);

  const cutsetGeometry = ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });

  const elevationImage = ee.Image('CGIAR/SRTM90_V4').clip(cutsetGeometry);

  const terrainImage = ee.Image('ESA/GLOBCOVER_L4_200901_200912_V2_3');

  const terrain = ee.Terrain.products(elevationImage)
    .select(['slope', 'aspect', 'elevation', 'hillshade'])
    .addBands(terrainImage, ['landcover']);

  return terrain.reduceRegions({
    collection: features,
    reducer: ee.call('Reducer.first'),
    scale: 30
  });
}
