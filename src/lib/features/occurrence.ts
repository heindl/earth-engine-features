import ee from '@google/earthengine';
import * as crypto from 'crypto';
import { Request } from 'express';
import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';
import { GraphQLDate } from 'graphql-iso-date';
import { normalizeCoordinates } from '../utils/geo';
import { ILocationArgs } from './args';

export const Labels = {
  Date: 'Date',
  ID: 'ID',
  IntervalStartDate: 'StartDate',
  Latitude: 'Latitude',
  Longitude: 'Longitude',
  Uncertainty: 'CoordinateUncertainty'
};

export interface ILocationFields {
  Date: Date;
  ID: string;
  IntervalStartDate: Date;
  Latitude: number;
  Longitude: number;
  CoordinateUncertainty: number;
}

export const LocationFields = {
  CoordinateUncertainty: {
    description: `Area in meters around the point that represents uncertainty in the coordinate precision.`,
    type: GraphQLInt
  },
  Date: {
    description: `Datetime of the example.`,
    type: GraphQLDate
  },
  ID: {
    description: `Either provided or automatically generated string id for the occurrence.`,
    type: GraphQLString
  },
  IntervalStartDate: {
    description: `Start of the of the aggregation interval.`,
    type: GraphQLDate
  },
  Latitude: {
    description: `Latitude of example.`,
    type: GraphQLFloat
  },
  Longitude: {
    description: `Longitude of example.`,
    type: GraphQLFloat
  }
};

export type Context = Request;

export class Occurrence {
  public readonly id: string;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly date: Date;
  public readonly uncertainty: number;
  // protected properties: { [key: string]: any } = {};

  constructor(args: ILocationArgs) {
    const coords = normalizeCoordinates(args);
    this.latitude = coords.lat;
    this.longitude = coords.lng;
    this.uncertainty = coords.uncertainty || 0;
    this.date = args.date;
    this.id = args.id || crypto.randomBytes(10).toString('hex');
  }

  public intervalStartTime = (intervalDaysBefore: number): number => {
    const inMilliseconds = intervalDaysBefore * 86400 * 1000;
    return this.date.valueOf() - inMilliseconds;
  };

  // public setProperties = (props: { [key: string]: any }) => {
  //   if (!props[Labels.ID] || props[Labels.ID] !== this.id) {
  //     return;
  //   }
  //   this.properties = props;
  // };

  // public resolve = () => {
  //   return {
  //     Date: this.date,
  //     ID: this.id,
  //     Latitude: this.latitude,
  //     Longitude: this.longitude,
  //     Radius: this.radius,
  //     ...this.properties
  //   };
  // };

  public toEarthEngineFeature = (cfg?: {
    intervalInDays?: number;
  }): ee.Feature => {
    return ee.Feature(
      ee.Geometry.Point(this.longitude, this.latitude).buffer(this.uncertainty),
      {
        [Labels.ID]: this.id,
        [Labels.Latitude]: this.latitude,
        [Labels.Longitude]: this.longitude,
        [Labels.Uncertainty]: this.uncertainty,
        [Labels.Date]: this.date.valueOf(), // convert to milliseconds
        [Labels.IntervalStartDate]:
          cfg && cfg.intervalInDays
            ? this.intervalStartTime(cfg.intervalInDays)
            : this.date.valueOf()
      }
    );
  };
}
