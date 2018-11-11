import * as ee from '@google/earthengine';
import test from 'ava';
import { GraphQLFieldConfigMap } from 'graphql';
import { TestLocations } from '../__testdata__/locations';
import { TestExpectedData } from '../__testdata__/response';
import { EarthEngineFields } from './fields';
import { initialize } from './initialize';
import { EarthEngineRequestService } from './resolver';
import { EarthEngineResolver, IEarthEngineContext, IOccurrence } from './types';

interface IResolverDictionary {
  [key: string]: EarthEngineResolver;
}

function gatherResolvers(
  fieldConfigMap?: GraphQLFieldConfigMap<IOccurrence, IEarthEngineContext>
): IResolverDictionary {
  const res: IResolverDictionary = {};
  if (!fieldConfigMap) {
    return res;
  }
  return Object.keys(fieldConfigMap).reduce(
    (o: IResolverDictionary, label: string) => {
      if (fieldConfigMap[label].resolve) {
        o[label] = fieldConfigMap[label].resolve as EarthEngineResolver;
        return o;
      }
      return o;
    },
    res
  );
}

test.skip('test earth engine resolver', async t => {
  await initialize();

  const eeFeatures = ee.FeatureCollection(
    TestLocations.map(loc => {
      return ee.Feature(ee.Geometry.Point(loc.Longitude, loc.Latitude), loc);
    })
  );

  const eeService = new EarthEngineRequestService(eeFeatures);

  const resolvers = gatherResolvers(EarthEngineFields);

  const promises: Array<Promise<any>> = [];
  ['a', 'b'].forEach((id: string) => {
    const expectedOutput = TestExpectedData[id] as { [key: string]: any };
    delete expectedOutput.ID;
    promises.push(
      ...Object.keys(expectedOutput).map(async key => {
        if (!(key in resolvers)) {
          t.fail(`field ${key} not in known resolvers`);
        }

        const o = await resolvers[key]({ ID: id }, {}, { ee: eeService });

        const e = expectedOutput[key];
        if (e instanceof Object) {
          Object.keys(e).forEach(f => {
            t.deepEqual(
              e[f],
              (o as { [k: string]: number })[f],
              `unequal values for id [${id}] fields [${key}, ${f}]`
            );
          });
        } else {
          t.deepEqual(e, o, `unequal values for id [${id}] field [${key}]`);
        }
      })
    );
  });
  await Promise.all(promises);

  t.is(await eeService.requestCount(), 7);
});
