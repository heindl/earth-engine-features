import test from 'ava';
import { initialize } from '../earth-engine/initialize';
import { OccurrenceCollection } from './collections';

test.skip('get random occurrence points', async t => {
  await initialize();

  const params = {
    endDate: new Date(2016, 1, 5),
    intervalInDays: 30,
    startDate: new Date(2015, 1, 5)
  };

  await Promise.all(
    [1, 2, 5, 10, 15, 20].map(async (i: number) => {
      const collection = new OccurrenceCollection({ ...params, count: i });
      const locs = await collection.locations;
      t.is(locs.length, i);
    })
  );
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
