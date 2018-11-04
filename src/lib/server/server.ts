import express from 'express';
import graphqlHTTP from 'express-graphql';
import { initialize } from '../utils/initialize';
import { schema } from './schema';

// TODO: Consider using the apollo engine for middleware, which automatically handles caching.
// https://www.apollographql.com/engine/#plans
// This could be useful when it comes to putting into production quickly in order to not worry about any kind
// of local occurrence storage, and to avoid small issues like invalidating the google cache if features change.
// May be able to use it freely at first with Kubernetes:https://www.apollographql.com/docs/engine/setup-standalone.html#docker

let graphQLServer: express.Express;

export const buildGraphQLServer = (): Promise<express.Express> => {
  return new Promise((resolve, reject) => {
    if (graphQLServer) {
      // tslint:disable
      console.log('returning server immediately');
      return resolve(graphQLServer);
    }
    initialize()
      .then(() => {
        graphQLServer = express();
        graphQLServer.post(
          '/',
          graphqlHTTP({
            schema: schema,
            // graphiql: true
          })
        );
        resolve(graphQLServer);
      })
      .catch(reject);
  });
};

export const runGraphQLServerLocally = async () => {
  const app = await buildGraphQLServer();
  app.listen({ port: 4000 }, () => {
    // tslint:disable:no-console
    console.log(`🚀 Server ready at http://localhost:4000`);
  });
};
