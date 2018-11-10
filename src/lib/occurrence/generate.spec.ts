import test from 'ava';
import { initialize } from '../earth-engine/initialize';
import { OccurrenceCollection } from './collections';

// TODO: Test with only one point requested. This broke the build.

test.skip('get random occurrence points', async t => {
  await initialize();

  const collection = new OccurrenceCollection({
    count: 20,
    endDate: new Date(2016, 1, 5),
    intervalInDays: 30,
    startDate: new Date(2015, 1, 5)
  });

  const locs = await collection.locations;

  // t.log(locs);

  t.is(locs.length, 20);
});

test.skip('get feature collection from known points', async t => {
  await initialize();

  const collection = new OccurrenceCollection({
    intervalInDays: 30,
    locations: [
      {
        date: new Date(2015, 3),
        lat: 33.7676338,
        lng: -84.5606888
      }
    ]
  });

  const locs = await collection.locations;

  // t.log(locs);

  t.is(locs.length, 1);
});
