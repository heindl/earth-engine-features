// tslint:disable:object-literal-sort-keys variable-name

import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import {
  Example,
  ExampleIntervalStartTimeLabel,
  ExampleTimeLabel,
  IExample
} from './example';

const ClimateImageName = 'NOAA/CFSV2/FOR6H';

const BANDS = [
  'Latent_heat_net_flux_surface_6_Hour_Average',
  'Sensible_heat_net_flux_surface_6_Hour_Average',
  'Temperature_height_above_ground',
  'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
  'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
  'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
  'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
  'Specific_humidity_height_above_ground',
  'Precipitation_rate_surface_6_Hour_Average',
  'Pressure_surface',
  'u-component_of_wind_height_above_ground',
  'v-component_of_wind_height_above_ground',
  'Geopotential_height_surface'
];

export const ClimateIndicesFields = {
  LatentHeatNetFlux: {
    description: `
      Latent heat is the heat moved by water evaporating and
      condensing higher up in the atmosphere. Heat is absorbed
      in evaporation and released by condensation – so
      the result is a movement of heat from the surface
      to higher levels in the atmosphere.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  SensibleHeatNetFlux: {
    description: `
      Sensible heat is caused by conduction and convection.
      For example, with a warm surface and a cooler atmosphere,
      at the boundary layer heat will be conducted into the atmosphere
      and then convection will move the heat higher up into the atmosphere.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  Temperature: {
    description: `Temperature 2m above ground`,
    type: new GraphQLList(GraphQLFloat)
  },
  DownwardShortWaveRadiationFlux: {
    description: `
      Incoming ultraviolet, visible, and a limited portion of
      infrared energy (together sometimes called "shortwave
      radiation") from the Sun drive the Earth's climate system.
      Some of this incoming radiation is reflected off clouds,
      some is absorbed by the atmosphere, and some passes through
      to the Earth's surface. Larger aerosol particles in the
      atmosphere interact with and absorb some of the radiation,
      causing the atmosphere to warm.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  UpwardShortWaveRadiationFlux: {
    description: `
      Incoming ultraviolet, visible, and a limited portion of
      infrared energy (together sometimes called "shortwave
      radiation") from the Sun drive the Earth's climate system.
      Some of this incoming radiation is reflected off clouds,
      some is absorbed by the atmosphere, and some passes through
      to the Earth's surface. Larger aerosol particles in the
      atmosphere interact with and absorb some of the radiation,
      causing the atmosphere to warm.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  UpwardLongWaveRadiationFlux: {
    description: `
      Heat resulting from the absorption of incoming shortwave
      radiation is emitted as longwave radiation. Radiation
      from the warmed upper atmosphere, along with a small amount
      from the Earth's surface, radiates out to space. Most of the
      emitted longwave radiation warms the lower atmosphere, which
      in turn warms our planet's surface.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  DownwardLongWaveRadiationFlux: {
    description: `
      Heat resulting from the absorption of incoming shortwave
      radiation is emitted as longwave radiation. Radiation
      from the warmed upper atmosphere, along with a small amount
      from the Earth's surface, radiates out to space. Most of the
      emitted longwave radiation warms the lower atmosphere, which
      in turn warms our planet's surface.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  Humidity: {
    description: `Specific humidity 2m above ground`,
    type: new GraphQLList(GraphQLFloat)
  },
  Precipitation: {
    description: `Precipitation rate at surface, 6-hour average`,
    type: new GraphQLList(GraphQLFloat)
  },
  Pressure: {
    description: `Pressure at surface`,
    type: new GraphQLList(GraphQLFloat)
  },
  UComponentOfWind: {
    description: `
      For winds, the u wind is parallel to the x axis.
      A positive u wind is from the west.
      A negative u wind is from the east.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  VComponentOfWind: {
    description: `
       The v wind runs parallel to the y axis.
       A positive v wind is from the south,
       and a negative v wind is from the north.
    `,
    type: new GraphQLList(GraphQLFloat)
  },
  // TODO: Consider moving to elevation.
  GeopotentialHeight: {
    description: `Geopotential height is a vertical coordinate referenced to Earth's mean sea level, an adjustment
     to geometric height (elevation above mean sea level) using the variation of gravity with latitude and
     elevation. Thus, it can be considered a "gravity-adjusted height". It should be the same for each day.
    `,
    resolve: async (source: { GeopotentialHeight: number[] }) => {
      return {
        ...{ GeopotentialHeight: source.GeopotentialHeight[0] },
        ...source
      };
    },
    type: GraphQLFloat
  }
};

const ClimateIndicesType: GraphQLObjectType = new GraphQLObjectType({
  fields: () => ClimateIndicesFields,
  name: 'ClimateIndices'
});

// tslint:disable:variable-name
export const ClimateIndices: {
  [key: string]: GraphQLFieldConfig<IExample, object>;
} = {
  Climate: {
    description: `The National Centers for Environmental Prediction (NCEP) Climate Forecast System (CFS) is a fully 
      coupled model representing the interaction between the Earth's atmosphere, oceans, land, and sea ice. 
      
      CFS was developed at the Environmental Modeling Center (EMC) at NCEP. 
      The operational CFS was upgraded to version 2 (CFSv2) on March 30, 2011.
  
      Forecasts are initialized four times per day (0000, 0600, 1200, and 1800 UTC). 
      This is the same model that was used to create the NCEP Climate Forecast System 
      Reanalysis (CFSR), and the purpose of the CFSv2 dataset is to extend CFSR. We ingest 
      only a subset of bands from files matching cdas1.t??z.sfluxgrbf06.grib2.`,
    resolve: async (source: IExample, _args: object, _context: object) => {
      const ex = new Example(source);
      // TODO: Set this as argument
      const data = await fetchFeatureCollectionData([ex], 7);
      return data[0];
    },
    type: ClimateIndicesType
  }
};

function getFeature(feature: ee.Feature): ee.Feature {
  const vectorLabels = ee.List(Object.keys(ClimateIndicesFields));

  const uic = ee
    .ImageCollection(ClimateImageName)
    .select(ee.List(BANDS), ee.List(vectorLabels));

  feature = ee.Feature(feature);
  const endDate = ee.Date(feature.get(ExampleTimeLabel));
  const startDate = ee.Date(feature.get(ExampleIntervalStartTimeLabel));

  const properties = ee.FeatureCollection(
    ee
      .ImageCollection(uic)
      .filterDate(startDate, endDate)
      .map(i => {
        return ee.Feature(
          ee.Geometry.Point(0, 0),
          i.reduceRegion({
            reducer: ee.call('Reducer.mean'),
            geometry: ee.Feature(feature).geometry()
          })
        );
      })
  );

  return ee.Feature(
    ee.List(vectorLabels).iterate((label, current) => {
      return ee
        .Feature(current)
        .set(
          ee.List([
            ee.String(label),
            ee.FeatureCollection(properties).aggregate_array(ee.String(label))
          ])
        );
    }, feature)
  );
}

// TODO: Really should group by date and run concurrently because examples will fall on same day in daily search.
function fetchFeatureCollectionData(
  examples: Example[],
  intervalDaysBefore: number // Default -180
): Promise<object[]> {
  const initialFC = ee.FeatureCollection(
    ee.List(examples.map(e => e.toEarthEngineFeature({ intervalDaysBefore })))
  );
  return new Promise((resolve, reject) => {
    initialFC.map(getFeature).evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      const rf = (data as GeoJSON.FeatureCollection).features;
      resolve(rf.map(f => f.properties || {}));
    });
  });
}
