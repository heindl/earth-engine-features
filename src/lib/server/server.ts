import express from 'express';
import { geographql } from './functions';

const server = express();
server.use('/', geographql);

export default server;

if (require.main === module) {
  server.listen(4000);
}
