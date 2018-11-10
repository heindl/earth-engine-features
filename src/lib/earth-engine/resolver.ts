import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import { LocationLabels } from '../occurrences/location';
import {
  AllowedFieldTypes,
  EarthEngineAggregationFunction,
  IRequestResponse,
  IResolveFieldParams,
  IResolveSourceParams
} from './types';

export class EarthEngineRequestService {
  protected aggregationRequestCount = 0;

  protected readonly features: ee.FeatureCollection;
  protected requests: Map<string, Promise<IRequestResponse[]>> = new Map();

  constructor(features: ee.FeatureCollection) {
    this.features = ee.FeatureCollection(features);
  }

  public requestCount = async (): Promise<number> => {
    await Promise.all(this.requests);
    return this.aggregationRequestCount;
  };

  public resolveField = async (
    params: IResolveFieldParams
  ): Promise<AllowedFieldTypes> => {
    const source = await this.resolveSource(params);
    if (!(params.fieldName in source)) {
      throw new Error(
        `field name [${params.fieldName}] not found in occurrence [${
          params.occurrenceID
        }] data for section [${params.sourceName}]`
      );
    }
    return source[params.fieldName];
  };

  public resolveSource = async (
    params: IResolveSourceParams
  ): Promise<IRequestResponse> => {
    if (!this.requests.has(params.sourceName)) {
      this.requests.set(
        params.sourceName,
        this.initiateRequestPromise(params.aggregator)
      );
    }
    const promise = this.requests.get(params.sourceName);
    if (!promise) {
      throw new Error(
        `earth engine feature promise not found for section [${
          params.sourceName
        }]`
      );
    }
    const occurrences = await promise;
    const matches: IRequestResponse[] = occurrences.filter(
      o => o.ID === params.occurrenceID
    );
    if (matches.length !== 1) {
      throw new Error(
        `properties not found for occurrence [${
          params.occurrenceID
        }] and section [${params.sourceName}]`
      );
    }
    return matches[0];
  };

  public initiateRequestPromise = (
    requester: EarthEngineAggregationFunction
  ): Promise<IRequestResponse[]> => {
    return new Promise((resolve, reject) => {
      const fc = ee
        .FeatureCollection(requester(this.features))
        .sort(LocationLabels.ID);
      fc.evaluate((data, err) => {
        this.aggregationRequestCount += 1;
        if (err) {
          reject(err);
          return;
        }
        const properties = (data as GeoJSON.FeatureCollection).features
          .map(f => f.properties as IRequestResponse)
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
//       leftField: LocationLabels.ID,
//       rightField: LocationLabels.ID
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
