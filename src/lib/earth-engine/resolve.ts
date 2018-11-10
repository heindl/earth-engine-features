import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import { ILocationFields, Labels } from '../occurrence/occurrence';

export interface IEarthEngineContext {
  ee: EarthEngineRequestService;
}

export interface IOccurrence {
  ID: string;
}

type EarthEngineResolver = (
  parent: IOccurrence,
  args: { [k: string]: any },
  context: IEarthEngineContext
) => object;

type EarthEngineAggregationFunction = (
  fc: ee.FeatureCollection
) => ee.FeatureCollection;

export const getEarthEngineResolveFunction = (
  sectionKey: string,
  fn: EarthEngineAggregationFunction
): EarthEngineResolver => {
  // tslint:disable:variable-name
  return (
    parent: IOccurrence,
    _args,
    context: { ee: EarthEngineRequestService }
  ): object => {
    return context.ee.resolve(sectionKey, parent.ID, fn);
  };
};

export class EarthEngineRequestService {
  protected readonly features: ee.FeatureCollection;
  protected requests: Map<string, Promise<ILocationFields[]>> = new Map();

  constructor(features: ee.FeatureCollection) {
    this.features = features;
  }

  public resolve = async (
    sectionKey: string,
    occurrenceID: string,
    requester: EarthEngineAggregationFunction
  ): Promise<ILocationFields> => {
    if (!this.requests.has(sectionKey)) {
      this.requests.set(sectionKey, this.initiateRequestPromise(requester));
    }
    const promise = this.requests.get(sectionKey);
    if (!promise) {
      throw new Error(
        `earth engine feature promise not found for section [${sectionKey}]`
      );
    }
    const occurrences = await promise;
    const matches = occurrences.filter(o => o.ID === occurrenceID);
    if (matches.length !== 1) {
      throw new Error(
        `properties not found for occurrence [${occurrenceID}] and section [${sectionKey}]`
      );
    }
    return matches[0];
  };

  public initiateRequestPromise = (
    requester: EarthEngineAggregationFunction
  ): Promise<ILocationFields[]> => {
    return new Promise((resolve, reject) => {
      const fc = ee.FeatureCollection(requester(this.features)).sort(Labels.ID);
      fc.evaluate((data, err) => {
        if (err) {
          reject(err);
          return;
        }
        const properties = (data as GeoJSON.FeatureCollection).features
          .map(f => f.properties as ILocationFields)
          .filter(notEmpty);
        resolve(properties);
      });
    });
  };
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

// export const queryEarthEngine = (
//   initialFC: ee.FeatureCollection,
//   callers: EarthEngineCaller[]
// ): Promise<IQueryResult[]> => {
//   initialFC = ee.FeatureCollection(initialFC);
//
//   const mergedFC = callers.reduce(
//     (fc: ee.FeatureCollection, caller: EarthEngineCaller) => {
//       return ee.FeatureCollection(fc).merge(caller(initialFC));
//     },
//     ee.FeatureCollection([])
//   );
//
//   const joined = ee.Join.saveAll({
//     matchesKey: 'matches'
//   }).apply({
//     condition: ee.Filter.equals({
//       leftField: Labels.ID,
//       rightField: Labels.ID
//     }),
//     primary: ee.FeatureCollection(initialFC),
//     secondary: ee.FeatureCollection(mergedFC)
//   });
//
//   const reduced = joined.map(f => {
//     f = ee.Feature(f);
//     const list = ee.List(f.get('matches'));
//     return ee
//       .Feature(
//         list.iterate((m, previous) => {
//           return ee.Feature(previous).copyProperties(ee.Feature(m));
//         }, f)
//       )
//       .setMulti({ matches: null });
//   });
//
//   const res = ee.Algorithms.If(joined.size(), reduced, initialFC);
//
//
//   return new Promise((resolve, reject) => {
//
//     ee.FeatureCollection(res).evaluate((data, err) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//
//       const updated = (data as GeoJSON.FeatureCollection).featureCollection
//         .map(f => f.properties as IQueryResult)
//         .filter(notEmpty);
//       // tslint:disable:no-console
//       console.log('resolved feature collection', JSON.stringify(data));
//       resolve(updated);
//     });
//   });
// };
