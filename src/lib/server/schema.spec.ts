import test from 'ava';

test.skip('test random EarthEngineResolver', async t => {
  t.log('running test');
  t.truthy(true);

  // const q = `
  //     query {
  //       random(count: 5, intervalInDays: 15) {
  //         Elevation
  //       }
  //     }
  //   `;
  //
  // const res = await graphql(schema(), q);
  //
  // t.log('raw data', JSON.stringify(res));
  // t.truthy(res.data);
  // t.truthy(res.data && res.data.random instanceof Array);
  // const locs = (res.data && res.data.locations) || [];
  // t.is(locs.length, 5);
  // locs.forEach((loc: { [k: string]: any }) => {
  //   assertions[0].assert(t, loc);
  // });
});
