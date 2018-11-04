import { buildGraphQLServer } from './lib/server/server';

export const geoSpatialFeaturesGraphQL = async (req: any, res: any) => {
  const server = await buildGraphQLServer();
  server(req, res);
};

// TODO: Load test the function to determine max connections and rate limit:
// https://cloud.google.com/functions/docs/bestpractices/networking
