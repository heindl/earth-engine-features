import test from 'ava';
import { graphql } from 'graphql';
// tslint:disable:no-submodule-imports
import { PathReporter } from 'io-ts/lib/PathReporter';
import { locationsGraphQLString } from '../__testdata__/locations';
import { TestExpectedData } from '../__testdata__/response';
import { ILocationFields, Location } from '../occurrences/location';
import { OccurrenceQuerySchema } from './schema';

test('random graphql query', async t => {
  const q = `
      query {
        random(count: 5){
          Date
          ID
          CoordinateUncertainty
          IntervalStartDate
          Longitude
          Latitude
          Elevation
        }
      }
    `;

  const res = await graphql(OccurrenceQuerySchema, q, null, { ee: null });

  if (res.errors) {
    return t.fail(res.errors.toString());
  }

  if (!res.data) {
    return t.fail('data not found');
  }

  res.data.random.forEach((loc: ILocationFields & { Elevation: number }) => {
    const report = PathReporter.report(Location.decode(loc));
    if (report.length > 0 && report[0] !== 'No errors!') {
      return t.fail(report[0]);
    }
    t.truthy(loc.Elevation && loc.Elevation > 0);
  });
  t.is(res.data.random.length, 5);
});

test.skip('schema integration with known points', async t => {
  t.log(locationsGraphQLString());

  const q = `
      query {
        occurrences(intervalInDays: 10, locations: ${locationsGraphQLString()}){
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
    `;

  const res = await graphql(OccurrenceQuerySchema, q, null, { ee: null });

  if (res.errors) {
    return t.fail(res.errors.toString());
  }

  t.truthy(res.data);

  if (!res.data) {
    return;
  }

  t.is(res.data.occurrences.length, 2);

  res.data.occurrences.forEach((o: { ID: string; [k: string]: any }) => {
    const expected = TestExpectedData[o.ID];

    delete o.ID;

    t.deepEqual(expected, o);
  });
});
