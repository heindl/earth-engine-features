import test from 'ava';
import Supertest, { Response } from 'supertest';
import server from './server';

const RandomCount = 50;

const q = {
  query: `{
        random(count: ${RandomCount} intervalInDays: 15){
          ID
          Elevation
          Aspect
          Hillshade
          GeopotentialHeight
          SurfaceWater{
            DistanceToNearest
            CoverageByRadius
          }
          TerraVegetation {
            BlueSurfaceReflectance
            Enhanced
            MirSurfaceReflectance
            NirSurfaceReflectance
            Normalized
            RedSurfaceReflectance
          }
          AquaVegetation {
            BlueSurfaceReflectance
            Enhanced
            MirSurfaceReflectance
            NirSurfaceReflectance
            Normalized
            RedSurfaceReflectance
          }
          Climate{
            LatentHeatNetFlux
            SensibleHeatNetFlux
            Temperature
            DownwardShortWaveRadiationFlux
            UpwardShortWaveRadiationFlux
            UpwardLongWaveRadiationFlux
            DownwardLongWaveRadiationFlux
            Humidity
            Precipitation
            Pressure
            UComponentOfWind
            VComponentOfWind
          }
          Wildfire {
            DaysSinceLast
          }
        }
      }
    `
};

test.cb.skip('fetch graphql', t => {
  Supertest(server)
    .post('/')
    .send(q)
    .expect(200)
    .expect((response: Response) => {
      const res = response.body;
      t.truthy(res.data && res.data.random instanceof Array);
      const locs = (res.data && res.data.random) || [];
      t.is(locs.length, RandomCount);
    })
    .end(t.end);
});
