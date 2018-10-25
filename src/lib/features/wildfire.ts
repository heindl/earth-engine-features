import ee from '@google/earthengine';

export function fetch(feature: ee.Feature): Promise<object> {
  const date = ee.Date(feature.get('time_start'));

  const FIRMS = ee.ImageCollection('FIRMS');

  const imgs = FIRMS.filterDate(
    date.advance(ee.Number(-6.5), ee.String('year')),
    date
  ).select(ee.String('T21'));

  const regions = imgs.getRegion({geometry: feature.geometry(), scale: 1000});

  const filteredRegions = ee
    .List(regions)
    .slice(1)
    .map(r => {
      const list = ee.List(r);
      return ee.Algorithms.If(list.get(4), list.get(3), ee.Number(0));
    })
    .removeAll([ee.Number(0)])
    .sort();

  const res = feature.set(
    ee.List([
      ee.String('fire_days_since'),
      ee.Algorithms.If(
        filteredRegions.length(),
        ee
          .Date(date)
          .difference(ee.Date(filteredRegions.get(0)), ee.String('day')),
        ee.Number(-1)
      )
    ])
  );

  return new Promise((resolve, reject) => {
    res.evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// export const fireRegions = (features: ee.FeatureCollection, startDate: ee.Date, endDate: ee.Date): ee.List<ee.Feature> => {
//
//     const FIRMS = ee.ImageCollection("IDAHO_EPSCOR/GRIDMET");
//
//     const geometry = features.geometry();
//
//     const imgs = FIRMS
//         .filterBounds(geometry)
//         .filterDate(startDate, endDate)
//         .select('T21');
//
//     const region = imgs.getRegion();
//
//     const dates = region.map<ee.Feature>((r: ee.List<string>) => {
//         return ee.Feature(
//             ee.Geometry.Point([parseFloat(r.get(1)), parseFloat(r.get(2))]),
//             ee.Dictionary({
//                 'fire_value': r.get(4),
//                 'time_start': r.get(3),
//             })
//         )
//     });
//
//     const c = ee.FeatureCollection(dates).filter(
//         ee.Filter.notNull(['fire_value'])
//     );
//
//     return c.toList(c.size().add(1))
// };

// export const parseRegions = (features: ee.FeatureCollection) => {
//
//     var collection_start = ee.Date(
//         features.aggregate_min('time_start')
//     ).advance(-5, 'year');
//
//     var collection_end = ee.Date(
//         features.aggregate_max('time_start')
//     );
//
//     var collection_difference = ee.Number(
//         collection_end.difference(collection_start, 'day')
//     );
//
//     return ee.List.sequence({
//         start: 0,
//         step: 2500,
//         count: collection_difference.divide(2500).ceil(),
//     }).map(function(d){
//         d = ee.Number(d);
//         var start = collection_start.advance(d, 'day');
//         var end = start.advance(2500, 'day');
//         return get_features_in_region(
//             features.filterDate(start, end),
//             start,
//             end
//         )
//     }).flatten();
// }
//
// exports.fetch = function(features) {
//
//     features = ee.FeatureCollection(features);
//
//     var regions = ee.FeatureCollection(
//         ee.List(
//             parse_regions(features)
//         )
//     );
//
//     var matched = ee.Join.saveFirst({
//         matchKey: 'fire_days_since',
//         ordering: 'time_start',
//         ascending: false,
//     }).apply(
//         features,
//         regions,
//         ee.Filter.and(
//             ee.Filter.greaterThan({
//                 leftField: 'time_start',
//                 rightField: 'time_start'
//             }),
//             ee.Filter.withinDistance({
//                 distance: 30,
//                 leftField: '.geo',
//                 rightField: '.geo',
//                 maxError: 10
//             })
//         )
//     )
//
//     return matched.map(function(f){
//         f = ee.Feature(f);
//         var d = ee.Feature(f.get('fire_days_since')).get('time_start');
//         return f.set(ee.Dictionary({
//             'fire_days_since': ee.Date(
//                 f.get('time_start')
//             ).difference(
//                 ee.Date(d),
//                 'day'
//             )
//         }))
//     })
// }
