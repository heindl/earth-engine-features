import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { schema } from './schema';

// TODO: Consider using the apollo engine for middleware, which automatically handles caching.
// https://www.apollographql.com/engine/#plans
// This could be useful when it comes to putting into production quickly in order to not worry about any kind
// of local occurrence storage, and to avoid small issues like invalidating the google cache if features change.
// May be able to use it freely at first with Kubernetes:https://www.apollographql.com/docs/engine/setup-standalone.html#docker

export const server = new ApolloServer({ schema });
export const app = express();
server.applyMiddleware({ app });
