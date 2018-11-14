import test from 'ava';
import { TestLocationsCollection } from '../__testdata__/locations';
import { IRequestResponse } from './resolve';
import { SurfaceWaterSource } from './surface-water';

test.skip('earth engine source', async t => {
  const src = new SurfaceWaterSource();

  src.initiate(TestLocationsCollection);

  const res = await src.resolve('b');

  t.truthy(res);

  const s = res as IRequestResponse;

  t.is(s.ID, 'b');
  const field = 'DistanceToNearest';

  t.is(s[field], 468.93640896379054);
});
