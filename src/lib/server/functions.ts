import { Request, Response } from 'express';
import graphqlHTTP from 'express-graphql';
import '../features/climate';
import { schema } from '../features/query';
import '../features/surface-water';
import '../features/terrain';
import '../features/vegetation';
import '../features/wildfire';
import { initialize } from '../utils/initialize';

// TODO: Consider using the apollo engine for middleware, which automatically handles caching.
// https://www.apollographql.com/engine/#plans
// This could be useful when it comes to putting into production quickly in order to not worry about any kind
// of local occurrence storage, and to avoid small issues like invalidating the google cache if features change.
// May be able to use it freely at first with Kubernetes:https://www.apollographql.com/docs/engine/setup-standalone.html#docker

const graphqlMiddleware: graphqlHTTP.Middleware = graphqlHTTP({
  graphiql: true,
  schema: schema()
});

export const geographql = async (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  );
  await initialize();
  return graphqlMiddleware(req, res);
};
