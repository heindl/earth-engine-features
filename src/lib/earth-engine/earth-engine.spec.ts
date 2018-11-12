import test from 'ava';
import { GraphQLFieldConfigMap } from 'graphql';
import { TestLocations } from '../__testdata__/locations';
import { TestExpectedData } from '../__testdata__/response';
import {
  EarthEngineFields,
  getImageCollectionAvailableDateRanges
} from './fields';
import { EarthEngineRequestService } from './request-service';
import { EarthEngineResolver, IEarthEngineContext, IOccurrence } from './types';

interface IResolverDictionary {
  [key: string]: EarthEngineResolver;
}

function resolverMapFromFields(
  fieldConfigMap: GraphQLFieldConfigMap<IOccurrence, IEarthEngineContext>
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

test('test earth engine image data', async t => {
  const data = await getImageCollectionAvailableDateRanges('MODIS/006/MYD13Q1');
  t.is(data['MODIS/006/MYD13Q1'][0], 950832000000);
});

test('test single earth engine resolver', async t => {
  const eeService = new EarthEngineRequestService(TestLocations);

  const fields = await EarthEngineFields();

  const resolvers = resolverMapFromFields(fields);

  const data = await resolvers.Climate({ ID: 'a' }, {}, { ee: eeService });

  t.log(data);

  t.is(await eeService.requestCount(), 1);
});

test.skip('test earth engine resolver', async t => {
  const eeService = new EarthEngineRequestService(TestLocations);

  const resolvers = resolverMapFromFields(await EarthEngineFields());

  const promises: Array<Promise<any>> = [];
  ['a'].forEach((id: string) => {
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
