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

interface IBaseQueryArgs {
  intervalInDays: number;
}

const BaseQueryArgs: GraphQLFieldConfigArgumentMap = {
  intervalInDays: {
    defaultValue: 1,
    description:
      'The time period to aggregate results in days, starting at the date of the occurrence and doing backward',
    type: GraphQLInt
  }
};

export interface ILocationQueryArgs {
  lat: number;
  lng: number;
  uncertainty?: number;
  date: Date;
  id?: string;
}

const LocationQueryArgs: GraphQLFieldConfigArgumentMap = {
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

export interface IOccurrenceQueryArgs extends IBaseQueryArgs {
  locations: ILocationQueryArgs[];
}

export const OccurrenceQueryArgs: GraphQLFieldConfigArgumentMap = {
  ...BaseQueryArgs,
  locations: {
    description: 'List of occurrences to fetch',
    type: new GraphQLNonNull(
      new GraphQLList(
        new GraphQLInputObjectType({
          fields: () => ({ ...LocationQueryArgs }),
          name: 'Location'
        })
      )
    )
  }
};

export interface IRandomQueryArgs extends IBaseQueryArgs {
  count: number;
  startDate: Date;
  endDate: Date;
}

export const RandomQueryArgs: GraphQLFieldConfigArgumentMap = {
  ...BaseQueryArgs,
  count: {
    defaultValue: 10,
    description: 'The number of random occurrences to generate.',
    type: GraphQLInt
  },
  endDate: {
    defaultValue: new Date(),
    description: 'Maximum date of the random range: YYYY-MM-DD',
    type: GraphQLDate
  },
  startDate: {
    defaultValue: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d;
    })(),
    description: 'Minimum date of the random selection range: YYYY-MM-DD',
    type: GraphQLDate
  }
};
