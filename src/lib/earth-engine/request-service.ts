import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
// tslint:disable:no-submodule-imports
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';
import moment from 'moment';
import { TestLocations } from '../__testdata__/locations';
import {
  ILocationFields,
  Location,
  LocationLabels
} from '../occurrences/location';
import { initializeEarthEngine } from './initialize';
import {
  AllowedFieldTypes,
  EarthEngineAggregationFunction,
  IRequestResponse,
  IResolveFieldParams,
  IResolveSourceParams
} from './types';

class LocationCollection {
  public readonly minTime: number;
  public readonly maxTime: number;
  protected readonly locations: ILocationFields[];

  constructor(locations: ILocationFields[]) {
    this.locations = locations.sort((a, b) => {
      return a.ID < b.ID ? -1 : 1;
    });

    this.validate();

    this.minTime = locations.reduce(
      (min, b) => Math.min(min, b.IntervalStartDate),
      locations[0].IntervalStartDate
    );

    this.maxTime = locations.reduce(
      (max, b) => Math.max(max, b.Date),
      locations[0].Date
    );
  }

  public featureCollection = () => {
    return ee.FeatureCollection(
      TestLocations.map(loc => {
        return ee.Feature(ee.Geometry.Point(loc.Longitude, loc.Latitude), loc);
      })
    );
  };

  protected validate = () => {
    if (this.locations.length > 50) {
      throw new Error(
        'For now, only 50 locations are currently allowed per request'
      );
    }

    this.locations.forEach(loc => ThrowReporter.report(Location.decode(loc)));
  };
}

// tslint:disable:max-classes-per-file
export class EarthEngineRequestService {
  protected aggregationRequestCount = 0;

  protected requests: Map<string, Promise<IRequestResponse[]>> = new Map();
  protected readonly locations: LocationCollection;

  constructor(locations: ILocationFields[]) {
    this.locations = new LocationCollection(locations);
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
        }] data for section [${params.sourceLabel}]`
      );
    }
    return source[params.fieldName];
  };

  public resolveSource = async (
    params: IResolveSourceParams
  ): Promise<IRequestResponse> => {
    this.validateDateRange(params);

    if (!this.requests.has(params.sourceLabel)) {
      this.requests.set(
        params.sourceLabel,
        this.initiateRequestPromise(params.featureResolver)
      );
    }
    const promise = this.requests.get(params.sourceLabel);
    if (!promise) {
      throw new Error(
        `earth engine feature promise not found for section [${
          params.sourceLabel
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
        }] and section [${params.sourceLabel}]`
      );
    }
    return matches[0];
  };

  protected validateDateRange = (params: IResolveSourceParams) => {
    if (params.sourceStart && params.sourceStart > this.locations.minTime) {
      throw new Error(
        `occurrences [${moment(this.locations.minTime).format(
          'YYYY-MM-DD'
        )}] fall out of data range [${params.sourceLabel}, ${moment(
          params.sourceStart
        ).format('YYYY-MM-DD')}]`
      );
    }

    if (params.sourceEnd && params.sourceEnd < this.locations.maxTime) {
      throw new Error(
        `occurrences [${moment(this.locations.maxTime).format(
          'YYYY-MM-DD'
        )}] fall out of data range [${params.sourceLabel}, ${moment(
          params.sourceEnd
        ).format('YYYY-MM-DD')}]`
      );
    }
  };

  protected initiateRequestPromise = async (
    resolveFeatures: EarthEngineAggregationFunction
  ): Promise<IRequestResponse[]> => {
    await initializeEarthEngine();

    const fc = this.locations.featureCollection();
    const resolved = resolveFeatures(fc).sort(LocationLabels.ID);

    return new Promise<IRequestResponse[]>((resolve, reject) => {
      resolved.evaluate((data, err) => {
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
