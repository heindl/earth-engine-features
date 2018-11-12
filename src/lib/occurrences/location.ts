import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import * as iots from 'io-ts';

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
