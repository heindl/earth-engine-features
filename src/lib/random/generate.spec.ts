import test from 'ava';
import { initialize } from '../utils/initialize';
import fetchRandom from './generate';

test.skip('get random occurrence points', async t => {
  await initialize();
  const fc = await fetchRandom(30);
  // tslint:disable:no-console
  console.log(JSON.stringify(fc));

  t.is(fc.features.length, 30);

  // fc.features.forEach((f) => {
  //   // tslint:disable:no-console
  //   console.log(JSON.stringify(f))
  // });
});
