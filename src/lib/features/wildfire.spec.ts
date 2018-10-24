import ee from '@google/earthengine';
import test from 'ava';
import * as dotenv from 'dotenv';
import {initialize} from './initialize';
import { fetch } from './wildfire';
dotenv.config();

test('get fire data', async () => {

  await initialize();

  const feature = await fetch(ee.Feature(
      ee.Geometry.Point([-97.8072,30.159573]),
      ee.Dictionary({'time_start': ee.Date.fromYMD(2017, 12, 2)})
  ));
  // tslint:disable:no-console
  console.log(feature)
});
