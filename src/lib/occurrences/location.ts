import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';
import { GraphQLDate } from 'graphql-iso-date';
import * as iots from 'io-ts';
import { date as iotsDate } from 'io-ts-types';

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
  Date: iotsDate,
  ID: iots.string,
  IntervalStartDate: iotsDate,
  Latitude: iots.number,
  Longitude: iots.number
});

export interface ILocationFields {
  CoordinateUncertainty: number;
  Date: Date;
  ID: string;
  IntervalStartDate: Date;
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
