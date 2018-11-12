import { Request, Response } from 'express';
import graphqlHTTP from 'express-graphql';
import { initializeEarthEngine } from '../earth-engine/initialize';
import { OccurrenceQuerySchema } from '../schema/schema';

// TODO: Consider using the apollo engine for middleware, which automatically handles caching.
// https://www.apollographql.com/engine/#plans
// This could be useful when it comes to putting into production quickly in order to not worry about any kind
// of local occurrence storage, and to avoid small issues like invalidating the google cache if earth-engine change.
// May be able to use it freely at first with Kubernetes:https://www.apollographql.com/docs/engine/setup-standalone.html#docker

// TODO: In documentation, mention that it is currently only available for the united states of america, which will change soon.

const graphqlMiddleware: graphqlHTTP.Middleware = graphqlHTTP({
  graphiql: true,
  schema: OccurrenceQuerySchema
});

export const geographql = async (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  );
  await initializeEarthEngine();
  return graphqlMiddleware(req, res);
};
