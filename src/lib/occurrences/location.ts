import ee from '@google/earthengine';
import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import * as iots from 'io-ts';
// tslint:disable:no-submodule-imports
import { ThrowReporter } from 'io-ts/lib/ThrowReporter';

// Important that these are the same as the ILocationFields interface.
export const LocationLabels = {
  CoordinateUncertainty: 'CoordinateUncertainty',
  Date: 'Date',
  ID: 'ID',
  IntervalStartDate: 'IntervalStartDate',
  Latitude: 'Latitude',
  Longitude: 'Longitude'
};

export const Location = iots.type({
  CoordinateUncertainty: iots.number,
  Date: iots.number,
  ID: iots.string,
  IntervalStartDate: iots.number,
  Latitude: iots.number,
  Longitude: iots.number
});

export interface ILocationFields {
  CoordinateUncertainty: number;
  Date: number;
  ID: string;
  IntervalStartDate: number;
  Latitude: number;
  Longitude: number;
}

export const LocationFields = {
  CoordinateUncertainty: {
    description: `Area in meters around the point that represents uncertainty in the coordinate precision.`,
    type: GraphQLInt
  },
  Date: {
    description: `Datetime of the example.`,
    type: GraphQLDateTime
  },
  ID: {
    description: `Either provided or automatically generated string id for the occurrence.`,
    type: GraphQLString
  },
  IntervalStartDate: {
    description: `Start of the of the aggregation interval.`,
    type: GraphQLDateTime
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

export class LocationCollection {
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
      this.locations.map(loc => {
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
