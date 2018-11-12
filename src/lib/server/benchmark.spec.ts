import test from 'ava';
import suite from 'chuhai';
import { graphql } from 'graphql';
import { initializeEarthEngine } from '../earth-engine/initialize';
import { OccurrenceQuerySchema } from '../schema/schema';

interface Runner {
  is: (v?: any, e?: any) => void;
  truthy: (v?: any) => void;
}

const assertions = [
  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.Longitude);
    },
    fields: `
    Longitude
    Latitude
    Date
  `,
    name: 'base fields'
  },
  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.Elevation);
    },
    fields: `
    Elevation
  `,
    name: 'terrain'
  },

  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.Wildfire.DaysSinceLast);
    },
    fields: `
    Wildfire {
      DaysSinceLast
    }
  `,
    name: 'wildfire'
  },
  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.SurfaceWater.DistanceToNearest);
    },
    fields: `
    SurfaceWater {
      DistanceToNearest
    }
  `,
    name: 'surface-water'
  },
  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.TerraVegetation.BlueSurfaceReflectance);
    },
    fields: `
    TerraVegetation {
      BlueSurfaceReflectance
    }
  `,
    name: 'terra-vegetation'
  },
  {
    assert: (t: Runner, data: { [k: string]: any }) => {
      t.truthy(data.Climate.Temperature);
    },
    fields: `
    Climate {
      Temperature
    }
  `,
    name: 'climate'
  }
];

const RandomCount = 20;

test.skip('earth engine EarthEngineResolver benchmarks', async t => {
  await initializeEarthEngine();

  await suite('earth engine resolvers', s => {
    // s.set('minSamples', 5);
    s.set('defer', true);

    assertions.forEach(a => {
      s.bench(a.name, deferred => {
        const q = `
          {
            random(count: ${RandomCount}, intervalInDays: 15) {
              ${a.fields}
            }
          }
        `;
        graphql(OccurrenceQuerySchema, q, {}, { ee: null }).then(res => {
          t.truthy(res.data && res.data.random instanceof Array);
          const locs = (res.data && res.data.random) || [];
          t.is(locs.length, RandomCount);
          locs.forEach((loc: { [k: string]: any }) => {
            a.assert(t, loc);
          });
          return deferred.resolve();
        });
      });
    });
  });
});
