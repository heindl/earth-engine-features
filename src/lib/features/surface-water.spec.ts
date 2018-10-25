import ee from '@google/earthengine';
import test from 'ava';
import * as dotenv from 'dotenv';
import { initialize } from './initialize';
import { fetch } from './surface-water';
dotenv.config();

test('check surface water', async t => {
  await initialize();

  const data = await fetch(
    ee.FeatureCollection([
      ee.Feature(
        ee.Geometry.Point([-97.8072, 30.159573]),
        ee.Dictionary({
          time_start: ee.Date.fromYMD(2014, 4, 2)
        })
      )
    ])
  );
  // tslint:disable:no-console
  console.log('data', data);

  t.is(true, true);
});
