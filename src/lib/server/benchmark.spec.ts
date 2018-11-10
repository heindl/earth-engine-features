// import test from 'ava';
// import suite from 'chuhai';
// import { graphql } from 'graphql';
// import { schema } from './query';
// import { initialize } from '../utils/initialize';
//
// interface Runner {
//   is: (v?: any, e?: any) => void;
//   truthy: (v?: any) => void;
// }
//
// const assertions = [
//   {
//     assert: (t: Runner, data: { [k: string]: any }) => {
//       t.truthy(data.Longitude);
//     },
//     fields: `
//     Longitude
//     Latitude
//     Date
//   `,
//     name: 'base fields'
//   },
//   {
//     assert: (t: Runner, data: { [k: string]: any }) => {
//       t.truthy(data.Elevation);
//     },
//     fields: `
//     Elevation
//   `,
//     name: 'terrain'
//   },
//
//   {
//     assert: (t: Runner, data: { [k: string]: any }) => {
//       t.truthy(data.Wildfire.DaysSinceLast);
//     },
//     fields: `
//     Wildfire {
//       DaysSinceLast
//     }
//   `,
//     name: 'wildfire'
//   },
//   {
//     assert: (t: Runner, data: { [k: string]: any }) => {
//       t.truthy(data.SurfaceWater.DistanceToNearest);
//     },
//     fields: `
//     SurfaceWater {
//       DistanceToNearest
//     }
//   `,
//     name: 'surface-water'
//   }
// ];
//
// test.skip('earth engine EarthEngineResolver benchmarks', async t => {
//   t.log('running test');
//   await initialize();
//
//   const gqlSchema = schema();
//
//   t.log('initialized');
//
//   await suite('earth engine resolvers', s => {
//     s.set('minSamples', 5);
//     s.set('defer', true);
//
//     s.bench(assertions[0].name, deferred => {
//       t.log('test begun');
//       // ${sectionTest.fields}
//       const q = `
//           {
//             random(count: 5, intervalInDays: 15) {
//               Elevation
//             }
//           }
//         `;
//       graphql(gqlSchema, q).then(res => {
//         t.log('raw data', JSON.stringify(res));
//         t.truthy(res.data);
//         t.truthy(res.data && res.data.random instanceof Array);
//         const locs = (res.data && res.data.locations) || [];
//         t.is(locs.length, 5);
//         locs.forEach((loc: { [k: string]: any }) => {
//           assertions[0].assert(t, loc);
//         });
//         return deferred.resolve();
//       });
//     });
//   });
// });
