import { GraphQLFieldConfigMap, GraphQLFloat } from 'graphql';
import {
  ClimateIndexType,
  fetchClimateData,
  GeoPotentialHeightLabel
} from './climate';
import {
  EarthEngineRequestService,
  getEarthEngineResolveFunction,
  IOccurrence
} from './resolve';
import { resolveSurfaceWater, SurfaceWaterType } from './surface-water';
import { ElevationFields, LandcoverFields } from './terrain';
import {
  fetchAquaVegetationIndices,
  fetchTerraVegetationIndices,
  VegetationIndexType
} from './vegetation';
import { WildfireType } from './wildfire';

export const EarthEngineFields: GraphQLFieldConfigMap<
  IOccurrence,
  { ee: EarthEngineRequestService }
> = {
  ...LandcoverFields,
  ...ElevationFields,
  AquaVegetation: {
    description: 'MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m',
    resolve: getEarthEngineResolveFunction(
      'AquaVegetation',
      fetchAquaVegetationIndices
    ),
    type: VegetationIndexType
  },
  Climate: {
    description: ClimateIndexType.description,
    resolve: getEarthEngineResolveFunction('Climate', fetchClimateData),
    type: ClimateIndexType
  },
  SurfaceWater: {
    description: SurfaceWaterType.description,
    resolve: getEarthEngineResolveFunction('SurfaceWater', resolveSurfaceWater),
    type: SurfaceWaterType
  },
  [GeoPotentialHeightLabel]: {
    description: `A vertical coordinate referenced to Earth's mean sea level, an adjustment
     to geometric height (elevation above mean sea level) using the variation of gravity with latitude and
     elevation. Thus, it can be considered a "gravity-adjusted height".
    `,
    resolve: getEarthEngineResolveFunction('Climate', fetchClimateData),
    type: GraphQLFloat
  },
  TerraVegetation: {
    description: 'MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m',
    resolve: getEarthEngineResolveFunction(
      'TerraVegetation',
      fetchTerraVegetationIndices
    ),
    type: VegetationIndexType
  },
  Wildfire: {
    description: WildfireType.description,
    type: WildfireType
  }
};
