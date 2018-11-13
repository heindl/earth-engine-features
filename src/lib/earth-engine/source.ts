import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import moment from 'moment';
import { LocationCollection, LocationLabels } from '../occurrences/location';
import { initializeEarthEngine } from './initialize';
import { AllowedFieldTypes, IRequestResponse } from './resolve';

export abstract class EarthEngineSource {
  protected response: Promise<IRequestResponse[]> | undefined;

  public initiate(locations: LocationCollection) {
    this.response = initializeEarthEngine()
      .then(() => {
        return this.validateDateRange(locations);
      })
      .then(() => {
        return new Promise<IRequestResponse[]>((resolve, reject) => {
          this.evaluate(locations.featureCollection())
            .sort(LocationLabels.ID)
            .evaluate((data, err) => {
              if (err) {
                reject(err);
                return;
              }
              // tslint:disable:no-console
              // console.log("data", (data as GeoJSON.FeatureCollection).features
              //   .map(f => f.properties as IRequestResponse)
              //   .filter(notEmpty))
              resolve(
                (data as GeoJSON.FeatureCollection).features
                  .map(f => f.properties as IRequestResponse)
                  .filter(notEmpty)
              );
            });
        });
      });
    return this;
  }

  public abstract label(): string;

  public resolve = async (
    id: string,
    field?: string
  ): Promise<IRequestResponse | AllowedFieldTypes> => {
    if (!this.response) {
      throw new Error(
        `properties not found for occurrence [${id}] and section [${this.label()}]`
      );
    }

    const res: IRequestResponse | undefined = (await this.response).find(
      o => o.ID === id
    );

    if (!res) {
      throw new Error(
        `properties not found for occurrence [${id}] and section [${this.label()}]`
      );
    }
    if (field) {
      return res[field];
    }
    return res;
  };

  protected abstract evaluate(
    features: ee.FeatureCollection
  ): ee.FeatureCollection;

  // Earth Engine will provide the latest date for a collection through the API,
  // so this a proxy for that request.
  protected fetchDateRange = async (): Promise<[number, number]> => {
    return [0, new Date().valueOf()];
  };

  protected validateDateRange = async (locations: LocationCollection) => {
    const range = await this.fetchDateRange();

    if (range[0] > locations.minTime) {
      throw new Error(
        `occurrences [${moment(locations.minTime).format(
          'YYYY-MM-DD'
        )}] fall out of data range [${this.label()}, ${moment(range[0]).format(
          'YYYY-MM-DD'
        )}]`
      );
    }

    if (range[1] < locations.maxTime) {
      throw new Error(
        `occurrences [${moment(locations.maxTime).format(
          'YYYY-MM-DD'
        )}] fall out of data range [${this.label()}, ${moment(range[1]).format(
          'YYYY-MM-DD'
        )}]`
      );
    }
  };
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export const fetchImageCollectionDateRange = async (
  imgCollectionName: string
): Promise<[number, number]> => {
  await initializeEarthEngine();
  return new Promise<[number, number]>((resolve, reject) => {
    ee.ImageCollection(imgCollectionName)
      .get('date_range')
      .evaluate((data: [number, number], err: Error) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
  });
};
