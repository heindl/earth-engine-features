import { Request, Response } from 'express';
import graphqlHTTP from 'express-graphql';
import { initialize } from '../utils/initialize';
import { schema } from './schema';

// TODO: Consider using the apollo engine for middleware, which automatically handles caching.
// https://www.apollographql.com/engine/#plans
// This could be useful when it comes to putting into production quickly in order to not worry about any kind
// of local occurrence storage, and to avoid small issues like invalidating the google cache if features change.
// May be able to use it freely at first with Kubernetes:https://www.apollographql.com/docs/engine/setup-standalone.html#docker

const graphqlMiddleware: graphqlHTTP.Middleware = graphqlHTTP({ schema });

export const geographql = async (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  );
  await initialize();
  return graphqlMiddleware(req, res);
};
