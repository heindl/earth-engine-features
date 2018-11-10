import { GraphQLList, GraphQLObjectType, GraphQLSchema } from 'graphql';
import {
  EarthEngineRequestService,
  IEarthEngineContext
} from '../earth-engine/resolve';
import { OccurrenceCollection } from '../occurrence/collections';
import { ILocationFields, OccurrenceType } from '../occurrence/occurrence';
import { OccurrenceQueryArgs, RandomQueryArgs } from './query-args';

// TODO: Consider this for flattening results:
// https://github.com/chasingmaxwell/graphql-leveler

// TODO: This looks interesting for simplificaton, but not sure about adding another layer of uncertainty.
// https://www.npmjs.com/package/type-graphql

// export interface IQueryResult extends ILocationFields {
//   [key: string]: any;
// }

const resolver = async (
  // tslint:disable:variable-name
  _source: any,
  args: { [argName: string]: any },
  context: IEarthEngineContext
): Promise<ILocationFields[]> => {
  const o = new OccurrenceCollection(args);
  context.ee = new EarthEngineRequestService(await o.featureCollection());
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

export const schema = () => {
  const t = QueryType;
  return new GraphQLSchema({
    query: t,
    types: [t]
  });
};
