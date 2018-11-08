import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';
import { GraphQLDate } from 'graphql-iso-date';

interface IBaseArgs {
  intervalInDays: number;
}

const BaseArgs: GraphQLFieldConfigArgumentMap = {
  intervalInDays: {
    defaultValue: 0,
    description:
      'The time period to aggregate results in days, starting at the date of the occurrence and doing backward',
    type: GraphQLInt
  }
};

export interface ILocationArgs {
  lat: number;
  lng: number;
  uncertainty?: number;
  date: Date;
  id?: string;
}

const LocationArgs: GraphQLFieldConfigArgumentMap = {
  date: {
    description: 'The date of the occurrence: YYYY-MM-DD.',
    type: new GraphQLNonNull(GraphQLDate)
  },
  id: {
    description: 'An optional id for this occurrence.',
    type: GraphQLID
  },
  lat: {
    description: 'The latitude of the occurrence.',
    type: new GraphQLNonNull(GraphQLFloat)
  },
  lng: {
    description: 'The longitude of the occurrence.',
    type: new GraphQLNonNull(GraphQLFloat)
  },
  uncertainty: {
    defaultValue: 0,
    description: 'The buffer around the occurrence in meters.',
    type: GraphQLFloat
  }
};

export interface IOneOccurrenceArgs extends ILocationArgs, IBaseArgs {}

export const OneOccurrenceArgs: GraphQLFieldConfigArgumentMap = {
  ...BaseArgs,
  ...LocationArgs
};

export interface IManyOccurrenceArgs extends IBaseArgs {
  locations: ILocationArgs[];
}

export const ManyOccurrenceArgs: GraphQLFieldConfigArgumentMap = {
  ...BaseArgs,
  locations: {
    description: 'List of occurrences to fetch',
    type: new GraphQLNonNull(
      new GraphQLList(
        new GraphQLInputObjectType({
          fields: () => ({ ...LocationArgs }),
          name: 'Location'
        })
      )
    )
  }
};

const defaultRangeStartDate = (): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
};

export interface IRandomOccurrenceArgs extends IBaseArgs {
  count: number;
  startDate: Date;
  endDate: Date;
}

export const RandomOccurrenceArgs: GraphQLFieldConfigArgumentMap = {
  ...BaseArgs,
  count: {
    defaultValue: 10,
    description: 'The number of random occurrences to generate.',
    type: GraphQLInt
  },
  endDate: {
    defaultValue: new Date().toDateString(),
    description: 'Maximum date of the random range: YYYY-MM-DD',
    type: GraphQLDate
  },
  startDate: {
    defaultValue: defaultRangeStartDate(),
    description: 'Minimum date of the random selection range: YYYY-MM-DD',
    type: GraphQLDate
  }
};
