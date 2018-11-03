import ee from '@google/earthengine';

export const combineFeatureCollections = (
  original: ee.FeatureCollection,
  mergedDataCollection: ee.FeatureCollection
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
    secondary: ee.FeatureCollection(mergedDataCollection)
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