import * as ee from '@google/earthengine';
import test from 'ava';
import { initialize } from '../earth-engine/initialize';
import { generateRandomFeatures } from './random';

const evalFC = async (fc: ee.FeatureCollection) => {
  return new Promise((resolve, reject) => {
    ee.FeatureCollection(fc).evaluate((data, err) => {
      if (err) {
        return reject(err);
      }
      resolve(
        (data as GeoJSON.FeatureCollection).features.map(f => f.properties)
      );
    });
  });
};

// TODO: Test with only one point requested. This broke the build.

test.skip('get random occurrence points', async t => {
  await initialize();

  const fc = generateRandomFeatures({
    count: 30,
    endDate: new Date(2016, 1, 5),
    intervalInDays: 60,
    startDate: new Date(2015, 1, 5)
  });

  const props = await evalFC(fc);

  t.log(props);

  t.truthy(props);
});
