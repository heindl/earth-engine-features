import { GraphQLFieldConfigMap, GraphQLFloat } from 'graphql';
import {
  ClimateIndexType,
  GeoPotentialHeightLabel,
  resolveClimateData
} from './climate';
import { resolveSurfaceWater, SurfaceWaterType } from './surface-water';
import { ElevationFields, LandcoverFields } from './terrain';
import {
  getResolveFieldFunction,
  getResolveSourceFunction,
  IEarthEngineContext,
  IOccurrence
} from './types';
import {
  resolveAquaVegetationIndices,
  resolveTerraVegetationIndices,
  VegetationIndexType
} from './vegetation';
import { resolveWildfire, WildfireType } from './wildfire';

export const EarthEngineFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  ...LandcoverFields,
  ...ElevationFields,
  AquaVegetation: {
    description: 'MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m',
    resolve: getResolveSourceFunction(
      'AquaVegetation',
      resolveAquaVegetationIndices
    ),
    type: VegetationIndexType
  },
  Climate: {
    description: ClimateIndexType.description,
    resolve: getResolveSourceFunction('Climate', resolveClimateData),
    type: ClimateIndexType
  },
  SurfaceWater: {
    description: SurfaceWaterType.description,
    resolve: getResolveSourceFunction('SurfaceWater', resolveSurfaceWater),
    type: SurfaceWaterType
  },
  [GeoPotentialHeightLabel]: {
    description: `A vertical coordinate referenced to Earth's mean sea level, an adjustment
     to geometric height (elevation above mean sea level) using the variation of gravity with latitude and
     elevation. Thus, it can be considered a "gravity-adjusted height".
    `,
    resolve: getResolveFieldFunction(
      'Climate',
      resolveClimateData,
      GeoPotentialHeightLabel
    ),
    type: GraphQLFloat
  },
  TerraVegetation: {
    description: 'MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m',
    resolve: getResolveSourceFunction(
      'TerraVegetation',
      resolveTerraVegetationIndices
    ),
    type: VegetationIndexType
  },
  Wildfire: {
    description: WildfireType.description,
    resolve: getResolveSourceFunction('Wildfire', resolveWildfire),
    type: WildfireType
  }
};
