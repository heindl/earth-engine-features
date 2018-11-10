import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt, GraphQLObjectType } from 'graphql';
import { LocationLabels } from '../occurrence/occurrence';
import { IEarthEngineContext, IOccurrence } from './resolver';

const WildfireTypeFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  DaysSinceLast: {
    description:
      'Searches the last 6.5 years worth of Wildfire records and returns the number of days since the last, or -1 if no burn was found.',
    type: GraphQLInt
  }
};

export const WildfireType: GraphQLObjectType = new GraphQLObjectType({
  description: `
     The Fire Information for Resource Management System (FIRMS) dataset contains the LANCE fire 
     detection product in rasterized form. The near real-time (NRT) active fire locations are 
     processed by LANCE using the standard MODIS MOD14/MYD14 Fire and Thermal Anomalies product. 
  `,
  fields: () => WildfireTypeFields,
  name: 'Wildfire'
});

export const resolveWildfire = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return ee.FeatureCollection(fc).map(fetchWildfireHistory);
};

const fetchWildfireHistory = (uc: ee.Feature): ee.Feature => {
  const feature = ee.Feature(uc);

  const date = ee.Date(feature.get(LocationLabels.Date));

  const FIRMS = ee.ImageCollection('FIRMS');

  const imgs = FIRMS.filterDate(
    // TODO: Include this value as an arg.
    date.advance(ee.Number(-6.5), ee.String('year')),
    date
  ).select(ee.String('T21'));

  const regions = imgs.getRegion({ geometry: feature.geometry(), scale: 1000 });

  const filteredRegions = ee
    .List(regions)
    .slice(1)
    .map(r => {
      const list = ee.List(r);
      return ee.Algorithms.If(list.get(4), list.get(3), ee.Number(0));
    })
    .removeAll([ee.Number(0)])
    .sort();

  return feature.set(
    ee.Dictionary({
      [Object.keys(WildfireTypeFields)[0]]: ee.Algorithms.If(
        filteredRegions.length(),
        date.difference(filteredRegions.get(0), 'day'),
        ee.Number(-1)
      )
    })
  );
};

// export const fireRegions = (earth-engine: ee.FeatureCollection, startDate: ee.Date, endDate: ee.Date): ee.List<ee.Feature> => {
//
//     const FIRMS = ee.ImageCollection("IDAHO_EPSCOR/GRIDMET");
//
//     const geometry = earth-engine.geometry();
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
//                 'system:time_start': r.get(3),
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

// export const parseRegions = (earth-engine: ee.FeatureCollection) => {
//
//     var collection_start = ee.Date(
//         earth-engine.aggregate_min('system:time_start')
//     ).advance(-5, 'year');
//
//     var collection_end = ee.Date(
//         earth-engine.aggregate_max('system:time_start')
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
//             earth-engine.filterDate(start, end),
//             start,
//             end
//         )
//     }).flatten();
// }
//
// exports.fetch = function(earth-engine) {
//
//     earth-engine = ee.FeatureCollection(earth-engine);
//
//     var regions = ee.FeatureCollection(
//         ee.List(
//             parse_regions(earth-engine)
//         )
//     );
//
//     var matched = ee.Join.saveFirst({
//         matchKey: 'fire_days_since',
//         ordering: 'system:time_start',
//         ascending: false,
//     }).apply(
//         earth-engine,
//         regions,
//         ee.Filter.and(
//             ee.Filter.greaterThan({
//                 leftField: 'system:time_start',
//                 rightField: 'system:time_start'
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
//         var d = ee.Feature(f.get('fire_days_since')).get('system:time_start');
//         return f.set(ee.Dictionary({
//             'fire_days_since': ee.Date(
//                 f.get('system:time_start')
//             ).difference(
//                 ee.Date(d),
//                 'day'
//             )
//         }))
//     })
// }
