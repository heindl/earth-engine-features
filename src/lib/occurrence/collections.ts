import ee from '@google/earthengine';
import * as crypto from 'crypto';
import * as GeoJSON from 'geojson';
import { IOccurrenceQueryArgs, IRandomQueryArgs } from '../server/query-args';
import { normalizeCoordinates } from '../utils/geo';
import { ILocationFields } from './occurrence';
import { generateRandomFeatures } from './random';

const intervalStartTime = (date: Date, intervalDaysBefore: number): Date => {
  const inMilliseconds = intervalDaysBefore * 86400 * 1000;
  return new Date(date.valueOf() - inMilliseconds);
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export class OccurrenceCollection {
  public readonly locations: Promise<ILocationFields[]>;

  constructor(args: IRandomQueryArgs | IOccurrenceQueryArgs) {
    this.locations = (args as IOccurrenceQueryArgs).locations
      ? this.constructLocationsFromRandom(args as IRandomQueryArgs)
      : this.constructLocationsFromArgs(args as IOccurrenceQueryArgs);
  }

  public featureCollection = async (): Promise<ee.FeatureCollection> => {
    const locs = await this.locations;

    return ee.FeatureCollection(
      locs.map(loc => {
        return ee
          .Feature(
            // Buffer feature collection to at least 30, which is the minimum resolution of any dataset.
            // Terrain products require adjacent cells to make calculations, so may as well make the adjustment here.
            ee.Geometry.Point(loc.Longitude, loc.Latitude),
            loc
          )
          .buffer(ee.Number(Math.max(loc.CoordinateUncertainty, 30)));
      })
    );
  };

  protected constructLocationsFromRandom = (
    args: IRandomQueryArgs
  ): Promise<ILocationFields[]> => {
    return new Promise((resolve, reject) => {
      return ee
        .FeatureCollection(generateRandomFeatures(args))
        .evaluate((data, err) => {
          if (err) {
            reject(err);
            return;
          }
          const properties = (data as GeoJSON.FeatureCollection).features
            .map(f => {
              const props = f.properties as ILocationFields;
              props.ID = crypto.randomBytes(10).toString('hex');
              return props;
            })
            .filter(notEmpty);
          resolve(properties);
        });
    });
  };

  protected constructLocationsFromArgs = (
    args: IOccurrenceQueryArgs
  ): Promise<ILocationFields[]> => {
    return new Promise(resolve => {
      // TODO: Validate data and coordinates.
      // TODO: Test coordinate uncertainty.
      const formatted: ILocationFields[] = args.locations.map(l => {
        const coords = normalizeCoordinates(l);
        return {
          CoordinateUncertainty: coords.uncertainty || 0,
          Date: l.date,
          ID: l.id || crypto.randomBytes(10).toString('hex'),
          IntervalStartDate: intervalStartTime(
            l.date,
            Math.max(args.intervalInDays || 0, 1)
          ),
          Latitude: coords.lat,
          Longitude: coords.lng
        };
      });
      return resolve(formatted);
    });
  };
}
