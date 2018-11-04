import test from 'ava';
import Supertest, { Response } from 'supertest';
import { buildGraphQLServer } from './server';

// curl \
//   -X POST \
//   -H "Content-Type: application/json" \
//   --data '{ "query": "{ posts { title } }" }' \
//   https://1jzxrj179.lp.gql.zone/graphql

const q = {query:`{ 
  example(latitude: 30.159573, longitude: -97.8072, radius: 1000, date: "2015-05-09") {
    latitude
    longitude
    radius
    date
  }
}`};

test.cb('fetch graphql', t => {
  buildGraphQLServer()
    .then(app => {
      Supertest(app)
        .post('/')
        .send(q)
        .expect(200)
        .expect((res: Response) => {
          // tslint:disable:no-console
          console.log(res.body);
        })
        .end(t.end);
    })
    .catch(t.fail);
});
