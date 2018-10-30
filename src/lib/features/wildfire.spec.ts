import ee from '@google/earthengine';
import test from 'ava';
import { initialize } from '../utils/initialize';
import { fetch } from './wildfire';

test.skip('get fire data', async t => {
  await initialize();

  const feature = await fetch(
    ee.Feature(
      ee.Geometry.Point([-97.8072, 30.159573]),
      ee.Dictionary({ time_start: ee.Date.fromYMD(2017, 12, 2) })
    )
  );
  // tslint:disable:no-console
  console.log(feature);

  t.is(true, true);
});
