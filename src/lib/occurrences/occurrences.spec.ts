import test from 'ava';
import { OccurrenceCollection } from './collections';

// Generally runs between 15 and 30 seconds.
test.skip('random occurrence generator should provide locations', async t => {
  const params = {
    count: 100,
    endDate: new Date(2016, 12, 5),
    intervalInDays: 30,
    startDate: new Date(2013, 1, 5)
  };

  const collection = new OccurrenceCollection(params);

  const locs = await collection.locations;
  t.is(locs.length, 100);
});

test.skip('random occurrence generator should provide expected number of locations', async t => {
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
  const collection = new OccurrenceCollection({
    intervalInDays: 30,
    locations: [
      {
        date: new Date(2015, 3).valueOf(),
        lat: 33.7676338,
        lng: -84.5606888
      }
    ]
  });

  const locs = await collection.locations;

  // t.log(locs);

  t.is(locs.length, 1);
});
