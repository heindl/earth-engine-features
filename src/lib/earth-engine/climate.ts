// tslint:disable:object-literal-sort-keys variable-name

import ee from '@google/earthengine';
import {
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import { LocationLabels } from '../occurrence/occurrence';
import { IEarthEngineContext, IOccurrence } from './resolver';

const ClimateImageName = 'NOAA/CFSV2/FOR6H';
// Note that GeoPotentialHeight is defined as a top level field,
// as it is more closely related to elevation.
export const GeoPotentialHeightLabel = 'GeopotentialHeight';

const ClimateIndexTypeFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
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
  }
};

const imgBandMap: { [k: string]: string } = {
  LatentHeatNetFlux: 'Latent_heat_net_flux_surface_6_Hour_Average',
  SensibleHeatNetFlux: 'Sensible_heat_net_flux_surface_6_Hour_Average',
  Temperature: 'Temperature_height_above_ground',
  DownwardShortWaveRadiationFlux:
    'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
  UpwardShortWaveRadiationFlux:
    'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
  UpwardLongWaveRadiationFlux:
    'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
  DownwardLongWaveRadiationFlux:
    'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
  Humidity: 'Specific_humidity_height_above_ground',
  Precipitation: 'Precipitation_rate_surface_6_Hour_Average',
  Pressure: 'Pressure_surface',
  UComponentOfWind: 'u-component_of_wind_height_above_ground',
  VComponentOfWind: 'v-component_of_wind_height_above_ground',
  [GeoPotentialHeightLabel]: 'Geopotential_height_surface'
};

const imgVectorLabels = {
  bands: [
    ...Object.keys(ClimateIndexTypeFields).map(k => imgBandMap[k]),
    imgBandMap[GeoPotentialHeightLabel]
  ],
  labels: [...Object.keys(ClimateIndexTypeFields), GeoPotentialHeightLabel]
};

export const ClimateIndexType: GraphQLObjectType = new GraphQLObjectType({
  description: `
  The National Centers for Environmental Prediction (NCEP) Climate Forecast System (CFS)
   A fully coupled model representing the interaction between the Earth's atmosphere, oceans, land, and sea ice. 
      
      CFS was developed at the Environmental Modeling Center (EMC) at NCEP. 
      The operational CFS was upgraded to version 2 (CFSv2) on March 30, 2011.
  
      Forecasts are initialized four times per day (0000, 0600, 1200, and 1800 UTC). 
      This is the same model that was used to create the NCEP Climate Forecast System 
      Reanalysis (CFSR), and the purpose of the CFSv2 dataset is to extend CFSR. We ingest 
      only a subset of bands from files matching cdas1.t??z.sfluxgrbf06.grib2.`,
  fields: () => ClimateIndexTypeFields,
  name: 'ClimateIndexFields'
});

// TODO: Really should group by date and run concurrently because examples will fall on same day in daily search.

export const fetchClimateData = (fc: ee.FeatureCollection) => {
  return ee.FeatureCollection(fc).map(getFeature);
};

function getFeature(feature: ee.Feature): ee.Feature {
  // const latitudeDegreeAvgMeters = 111000;
  // ClimateImageName resolution is 0.2 arc degree.
  // latitudeDegreeAvgMeters * 0.2 = 22200

  feature = ee.Feature(feature);

  // Appears not all areas are covered and this map has a lower resolution, so notch up buffer.
  feature = ee.Feature(
    ee.Algorithms.If(
      ee.Number(feature.get(LocationLabels.CoordinateUncertainty)).lt(2500),
      feature.buffer(2500),
      feature
    )
  );

  const endDate = ee.Date(feature.get(LocationLabels.Date));
  const startDate = ee.Date(feature.get(LocationLabels.IntervalStartDate));

  const reducedFeatures = ee.FeatureCollection(
    ee
      .ImageCollection(ClimateImageName)
      .select(imgVectorLabels.bands, imgVectorLabels.labels)
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

  const properties = imgVectorLabels.labels.reduce((obj, label) => {
    return {
      ...obj,
      ...{
        [label]: reducedFeatures.aggregate_array(ee.String(label))
      }
    };
  }, {});

  feature = feature.setMulti(properties);

  return feature.setMulti({
    [GeoPotentialHeightLabel]: ee
      .FeatureCollection(reducedFeatures)
      .aggregate_first(GeoPotentialHeightLabel)
  });
}
