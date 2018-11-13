import { ILocationFields, LocationCollection } from '../occurrences/location';
import { AllowedFieldTypes, IRequestResponse, IResolveParams } from './resolve';
import { EarthEngineSource } from './source';

export class EarthEngineRequestService {
  protected aggregationRequestCount = 0;

  protected requests: Map<string, EarthEngineSource> = new Map();
  protected readonly locations: LocationCollection;

  constructor(locations: ILocationFields[]) {
    this.locations = new LocationCollection(locations);
  }

  public requestCount = async (): Promise<number> => {
    await Promise.all(this.requests);
    return this.aggregationRequestCount;
  };

  public resolve = async (
    params: IResolveParams
  ): Promise<IRequestResponse | AllowedFieldTypes> => {
    if (!params.locationID) {
      throw new Error(`missing location id`);
    }

    if (!this.requests.has(params.source.label())) {
      this.aggregationRequestCount += 1;
      this.requests.set(
        params.source.label(),
        params.source.initiate(this.locations)
      );
    }
    const src = this.requests.get(params.source.label());
    if (!src) {
      throw new Error(
        `earth engine feature promise not found for section [${params.source.label()}]`
      );
    }

    return src.resolve(params.locationID, params.fieldName);
  };
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
