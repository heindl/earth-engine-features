import * as ee from '@google/earthengine';
import * as GeoJSON from 'geojson';

export default function(
  features: ee.FeatureCollection
): Promise<GeoJSON.FeatureCollection> {
  const elevationImage = ee.Image('CGIAR/SRTM90_V4');
  const terrainImage = ee.Image('ESA/GLOBCOVER_L4_200901_200912_V2_3');
  const cutsetGeometry = ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });

  const terrain = ee.Terrain.products(elevationImage.clip(cutsetGeometry))
    .select(['slope', 'aspect', 'elevation'])
    .addBands(terrainImage, ['landcover']);

  const res = terrain.reduceRegions({
    collection: features,
    reducer: ee.call('Reducer.first'),
    scale: 30
  });

  return new Promise((resolve, reject) => {
    return res.evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data as GeoJSON.FeatureCollection);
    });
  });
}
