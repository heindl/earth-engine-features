import { app, server } from './lib/server/server';
// const expressPort = Number(process.env.EXPRESS_PORT) || 3000;

app.listen({ port: 4000 }, () => {
  // tslint:disable:no-console
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
});
