import test from 'ava';
import Supertest, { Response } from 'supertest';
import { buildGraphQLServer } from './server';

// curl \
//   -X POST \
//   -H "Content-Type: application/json" \
//   --data '{ "query": "{ posts { title } }" }' \
//   https://1jzxrj179.lp.gql.zone/graphql

const q = {
  query: `{ 
  example(latitude: 30.159573, longitude: -97.8072, radius: 1000, date: "2015-05-09") {
    latitude
    longitude
    radius
    date
    terrain {
      daysSinceLastWildFire
      elevation
      landcover
      distanceToNearestSurfaceWater
      surfaceWaterCoverageByRadius
    }
    TerraVegetation {
      Normalized
    }
    AquaVegetation {
      Normalized
    }
    Climate {
      Temperature
    }
  }
}`
};

test.cb('fetch graphql', t => {
  buildGraphQLServer()
    .then(app => {
      Supertest(app)
        .post('/')
        .send(q)
        .expect(200)
        .expect((res: Response) => {
          // tslint:disable:no-console
          console.log(res.body);
        })
        .end(t.end);
    })
    .catch(t.fail);
});

// import test from 'ava';
// import * as GeoJSON from 'geojson';
// import { initialize } from '../utils/initialize';
// import fetchData from './features';
//
// interface TestValue {
//   lat: number;
//   lng: number;
//   ts: number;
//   props?: { [key: string]: number[] | number };
// }
//
// const testPoints: TestValue[] = [
//   {
//     lat: 30.159573,
//     lng: -97.8072,
//     props: {
//       aspect: 25,
//       elevation: 201,
//       fire_days_since: -1,
//       hillshade: 178,
//       landcover: 70,
//       slope: 2,
//       surface_water_distance: 1236.0765749225513,
//       surface_water_percentages: [
//         0,
//         0,
//         0.00013532287798438987,
//         0.00016830327111731197,
//         0.001781627077446817,
//         0.006956743334413209
//       ]
//     },
//     ts: new Date(Date.UTC(2015, 5, 9)).getTime()
//   },
//   {
//     lat: 35.3432005,
//     lng: -82.7473583,
//     props: {
//       aspect: 25,
//       elevation: 201,
//       fire_days_since: -1,
//       hillshade: 178,
//       landcover: 70,
//       slope: 2,
//       surface_water_distance: 1236.0765749225513
//     },
//     ts: new Date(Date.UTC(2016, 5, 9)).getTime()
//   },
//   {
//     lat: 38.6998341,
//     lng: -79.550338,
//     props: {
//       aspect: 25,
//       elevation: 201,
//       fire_days_since: -1,
//       hillshade: 178,
//       landcover: 70,
//       slope: 2,
//       surface_water_distance: 1236.0765749225513
//     },
//     ts: new Date(Date.UTC(2017, 5, 9)).getTime()
//   }
// ];
//
// test('feature generation', async t => {
//   await initialize();
//
//   const features = testPoints.map<GeoJSON.Feature>((p, i) => {
//     return {
//       geometry: {
//         coordinates: [p.lng, p.lat],
//         type: 'Point'
//       },
//       properties: {
//         'system:id': i,
//         'system:time_start': p.ts
//       },
//       type: 'Feature'
//     };
//   });
//
//   const data = await fetchData(features, {
//     NonSequential: true,
//     Sequential: true,
//     SurfaceWaterData: true
//   });
//   // tslint:disable:no-console
//
//   console.log('data', data.features[0]);
//
//   // const responseFeatures = data.features;
//
//   t.is(true, true);
// });
