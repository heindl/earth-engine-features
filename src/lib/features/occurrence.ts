import ee from '@google/earthengine';
import * as crypto from 'crypto';
import { Request } from 'express';
import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull
} from 'graphql';
import { GraphQLDate } from 'graphql-iso-date';

export const OccurrenceFields = {
  Date: {
    description: `Datetime of the example.`,
    type: GraphQLDate
  },
  Latitude: {
    description: `Latitude of example.`,
    type: GraphQLFloat
  },
  Longitude: {
    description: `Longitude of example.`,
    type: GraphQLFloat
  },
  Radius: {
    description: `Radius of example coordinate in meters.`,
    type: GraphQLInt
  }
};

export const OccurrenceArgs: GraphQLFieldConfigArgumentMap = {
  date: {
    description: 'The date of the occurrence: YYYY-MM-DD.',
    type: new GraphQLNonNull(GraphQLDate)
  },
  id: {
    description: 'An optional id for this occurrence.',
    type: GraphQLID
  },
  latitude: {
    description: 'The latitude of the occurrence.',
    type: new GraphQLNonNull(GraphQLFloat)
  },
  longitude: {
    description: 'The longitude of the occurrence.',
    type: new GraphQLNonNull(GraphQLFloat)
  },
  radius: {
    defaultValue: 30,
    description: 'The buffer around the occurrence in meters.',
    type: GraphQLFloat
  }
};

export interface IOccurrenceArgs {
  latitude: number;
  longitude: number;
  radius?: number;
  date: Date;
  id?: string;
}

export const ExampleIDLabel = 'system:id';
export const ExampleTimeLabel = 'system:time';
export const ExampleIntervalStartTimeLabel = 'interval_start_time';

export type Context = Request;

export class Occurrence {
  public readonly id: string;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly date: Date;
  public readonly radius: number;
  protected properties: { [key: string]: any } = {};

  constructor(args: IOccurrenceArgs) {
    this.latitude = args.latitude;
    this.longitude = args.longitude;
    this.date = args.date;
    this.radius = args.radius || 30;
    this.id = args.id || crypto.randomBytes(10).toString('hex');
  }

  public intervalStartTime = (intervalDaysBefore: number): number => {
    const inMilliseconds = intervalDaysBefore * 86400 * 1000;
    return this.date.valueOf() - inMilliseconds;
  };

  public setProperties = (props: { [key: string]: any }) => {
    if (!props[ExampleIDLabel] || props[ExampleIDLabel] !== this.id) {
      return;
    }
    this.properties = props;
  };

  public resolve = () => {
    return {
      Date: this.date,
      ID: this.id,
      Latitude: this.latitude,
      Longitude: this.longitude,
      Radius: this.radius,
      ...this.properties
    };
  };

  public toEarthEngineFeature = (cfg?: {
    intervalDaysBefore?: number;
  }): ee.Feature => {
    return ee.Feature(
      ee.Geometry.Point(this.longitude, this.latitude).buffer(this.radius),
      {
        [ExampleIDLabel]: this.id,
        [ExampleTimeLabel]: this.date.valueOf(), // convert to milliseconds
        [ExampleIntervalStartTimeLabel]:
          cfg && cfg.intervalDaysBefore
            ? this.intervalStartTime(cfg.intervalDaysBefore)
            : this.date.valueOf()
      }
    );
  };
}
