import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLSchema
} from 'graphql';
import { EarthEngineFields } from '../earth-engine/fields';
import { EarthEngineRequestService } from '../earth-engine/request-service';
import { IEarthEngineContext } from '../earth-engine/types';
import { OccurrenceCollection } from '../occurrences/collections';
import { ILocationFields, LocationFields } from '../occurrences/location';
import { logger } from '../utils/logger';
import {
  IOccurrenceQueryArgs,
  IRandomQueryArgs,
  OccurrenceQueryArgs,
  RandomQueryArgs
} from './query-args';

// TODO: Consider this for flattening results:
// https://github.com/chasingmaxwell/graphql-leveler

// TODO: This looks interesting for simplificaton, but not sure about adding another layer of uncertainty.
// https://www.npmjs.com/package/type-graphql

// export interface IQueryResult extends ILocationFields {
//   [key: string]: any;
// }

// TODO: Update the Context type to be stricter in handing earth engine. Avoiding for now because will like be broken dependency.
const OccurrenceTypeConfig: GraphQLObjectTypeConfig<any, any> = {
  description: 'Features related to the terrain of the occurrence coordinates.',
  fields: {
    ...EarthEngineFields,
    ...LocationFields
  },
  name: 'Occurrence'
};

const OccurrenceType = new GraphQLObjectType(OccurrenceTypeConfig);

const resolver = async (
  // tslint:disable:variable-name
  _source: any,
  args: { [argName: string]: any },
  context: IEarthEngineContext
): Promise<ILocationFields[]> => {
  const o = new OccurrenceCollection(args as
    | IOccurrenceQueryArgs
    | IRandomQueryArgs);
  const locations = await o.locations;
  logger.log({
    context: { count: locations.length },
    level: 'info',
    message: `resolving locations`
  });
  context.ee = new EarthEngineRequestService(locations);
  return o.locations;
};

const QueryType = new GraphQLObjectType({
  description: 'root query type',
  fields: () => ({
    occurrences: {
      args: OccurrenceQueryArgs,
      resolve: resolver,
      type: new GraphQLList(OccurrenceType)
    },
    random: {
      args: RandomQueryArgs,
      resolve: resolver,
      type: new GraphQLList(OccurrenceType)
    }
  }),
  name: 'Query'
});

export const OccurrenceQuerySchema = new GraphQLSchema({
  query: QueryType,
  types: [OccurrenceType]
});
