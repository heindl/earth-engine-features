import { GraphQLFloat } from 'graphql';
import {
  ClimateIndexType,
  ClimateSource,
  GeoPotentialHeightLabel
} from './climate';
import { getResolveFunction } from './resolve';
import { SurfaceWaterSource, SurfaceWaterType } from './surface-water';
import { ElevationFields, LandcoverFields } from './terrain';
import {
  AquaVegetationSource,
  TerraVegetationSource,
  VegetationIndexType
} from './vegetation';
import { WildfireFields } from './wildfire';

export const EarthEngineFields = {
  ...LandcoverFields,
  ...ElevationFields,
  ...WildfireFields,
  AquaVegetation: {
    description: 'MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m',
    resolve: getResolveFunction({ source: new AquaVegetationSource() }),
    type: VegetationIndexType
  },
  Climate: {
    description: ClimateIndexType.description,
    resolve: getResolveFunction({ source: new ClimateSource() }),
    type: ClimateIndexType
  },
  SurfaceWater: {
    description: SurfaceWaterType.description,
    resolve: getResolveFunction({ source: new SurfaceWaterSource() }),
    type: SurfaceWaterType
  },
  [GeoPotentialHeightLabel]: {
    description: `A vertical coordinate referenced to Earth's mean sea level, an adjustment
     to geometric height (elevation above mean sea level) using the variation of gravity with latitude and
     elevation. Thus, it can be considered a "gravity-adjusted height".
    `,
    resolve: getResolveFunction({
      fieldName: GeoPotentialHeightLabel,
      source: new ClimateSource()
    }),
    type: GraphQLFloat
  },
  TerraVegetation: {
    description: 'MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m',
    resolve: getResolveFunction({ source: new TerraVegetationSource() }),
    type: VegetationIndexType
  }
};
