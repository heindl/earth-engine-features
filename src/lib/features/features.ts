import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import fetchNonSequential from './nonsequential';
import fetchSequential from './sequential';
import fetchSurfaceWater from './surface-water';
import fetchWildFire from './wildfire';

const combine = (
  original: ee.FeatureCollection,
  dataCollection: ee.FeatureCollection
): ee.FeatureCollection => {
  const joined = ee.Join.saveAll({
    matchesKey: 'matches'
  }).apply({
    condition: ee.Filter.withinDistance({
      distance: 30,
      leftField: '.geo',
      maxError: 10,
      rightField: '.geo'
    }),
    primary: ee.FeatureCollection(original),
    secondary: ee.FeatureCollection(dataCollection)
  });

  return joined.map(f => {
    const list = ee.List(ee.Feature(f).get('matches'));

    const updated = list.iterate((m, current) => {
      return ee.Feature(current).copyProperties(ee.Feature(m));
    }, f);

    return ee.Feature(updated).setMulti({
      matches: null
    });
  });
};

interface RequestedDataFields {
  Sequential?: boolean;
  Wildfire?: boolean;
  NonSequential?: boolean;
  SurfaceWaterData?: boolean;
}

export default function(
  fc: GeoJSON.Feature[],
  fields: RequestedDataFields
): Promise<GeoJSON.FeatureCollection> {
  const features = ee.FeatureCollection(
    fc.map(f => {
      return ee.Feature(ee.Geometry(f.geometry), f.properties || {});
    })
  );

  let combined = ee.FeatureCollection([]);

  if (fields.Sequential) {
    combined = combined.merge(fetchSequential(features));
  }

  if (fields.NonSequential) {
    combined = combined.merge(
      fetchNonSequential(features).select([
        'aspect',
        'elevation',
        'landcover',
        'slope',
        'hillshade'
      ])
    );
  }

  if (fields.Wildfire) {
    combined = combined.merge(
      fetchWildFire(features).select(['fire_days_since'])
    );
  }

  if (fields.SurfaceWaterData) {
    combined = combined.merge(
      fetchSurfaceWater(features).select([
        'surface_water_distance',
        'surface_water_percentages'
      ])
    );
  }

  return new Promise((resolve, reject) => {
    combine(features, combined).evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data as GeoJSON.FeatureCollection);
    });
  });
}
