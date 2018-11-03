// tslint:disable:object-literal-sort-keys
import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema
} from 'graphql';
import { GraphQLDate } from 'graphql-iso-date';
import { IExample } from '../features/example';
import { TerrainFields } from '../features/terrain';
import { VegetationIndices } from '../features/vegetation';

const ExampleFields = {
  latitude: {
    type: GraphQLFloat,
    description: `Latitude of example.`
  },
  longitude: {
    type: GraphQLFloat,
    description: `Longitude of example.`
  },
  radius: {
    type: GraphQLInt,
    defaultValue: 30,
    description: `Radius of example coordinate in meters.`
  },
  date: {
    type: GraphQLDate,
    description: `Datetime of the example.`
  }
};

const ExampleType: GraphQLObjectType = new GraphQLObjectType({
  name: 'example',
  description: 'Features related to the terrain of the example coordinates.',
  fields: {
    ...ExampleFields,
    ...VegetationIndices,
    ...TerrainFields
  }
});

const ExampleArgs: GraphQLFieldConfigArgumentMap = ExampleFields;

interface IExampleArgs {
  latitude: number;
  longitude: number;
  radius?: number;
  date: Date;
}

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    example: {
      type: ExampleType,
      description: ExampleType.description,
      args: ExampleArgs,
      resolve: (_: IExample, args: { [key: string]: any }) => {
        const a = args as IExampleArgs;
        return {
          latitude: a.latitude,
          longitude: a.longitude,
          radius: a.radius || 30,
          date: a.date
        };
      }
    }
  })
});

export const schema = new GraphQLSchema({
  query: QueryType,
  types: [ExampleType]
});
