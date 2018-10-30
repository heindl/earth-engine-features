import test from 'ava';
import { initialize } from '../utils/initialize';
import fetchRandom from './generate';

test('get fire data', async t => {
  await initialize();
  const features = await fetchRandom(100);
  // tslint:disable:no-console
  console.log(features);

  t.is(true, true);
});
