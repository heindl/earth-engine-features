import * as ee from '@google/earthengine';
import test from 'ava';
import { initialize } from './initialize';
import { EarthEngineRequestService } from './resolver';
import { fetchTerrain } from './terrain';

test('test earth engine resolver', async t => {
  await initialize();

  const eeService = new EarthEngineRequestService(
    ee.FeatureCollection([
      ee.Feature(ee.Geometry.Point(-82.7054901, 35.538851), {
        CoordinateUncertainty: 0,
        Date: new Date(2017, 6).valueOf(),
        ID: 'a',
        IntervalStartDate: new Date(2015, 5).valueOf(),
        Latitude: 35.538851,
        Longitude: -82.7054901
      }),
      ee.Feature(ee.Geometry.Point(-109.586438, 38.5743927), {
        CoordinateUncertainty: 0,
        Date: new Date(2017, 2).valueOf(),
        ID: 'b',
        IntervalStartDate: new Date(2017, 1).valueOf(),
        Latitude: 38.5743927,
        Longitude: -109.586438
      })
    ])
  );

  const b = await eeService.resolve('Elevation', 'b', fetchTerrain);

  const a = await eeService.resolve('Elevation', 'a', fetchTerrain);

  t.log(a, b);
  t.truthy(a);
});
