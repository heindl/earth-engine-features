import ee from '@google/earthengine';
import test from 'ava';
import { initialize } from '../utils/initialize';
import fetch from './sequential';

test.skip('check sequential', async t => {
  await initialize();

  const gj: GeoJSON.FeatureCollection = await fetch(
    ee.FeatureCollection(
      ee.Feature(
        ee.Geometry.Point([-97.8072, 30.159573]),
        ee.Dictionary({
          time_start: ee.Date.fromYMD(2017, 4, 2)
        })
      )
    )
  );

  gj.features.forEach(feature => {
    const props = feature.properties || {};

    const keys = Object.keys(props);

    keys.forEach(k => {
      // tslint:disable:no-console
      console.log(k);
    });
  });

  t.is(true, false);
});
