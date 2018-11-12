import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLFloat } from 'graphql';
import {
  ClimateImageCollectionName,
  ClimateIndexType,
  GeoPotentialHeightLabel,
  resolveClimateData
} from './climate';
import { initializeEarthEngine } from './initialize';
import { resolveSurfaceWater, SurfaceWaterType } from './surface-water';
import { ElevationFields, LandcoverFields } from './terrain';
import {
  getResolveFieldFunction,
  getResolveSourceFunction,
  IEarthEngineContext,
  IOccurrence
} from './types';
import {
  AquaVegetationImageCollectionName,
  resolveAquaVegetationIndices,
  resolveTerraVegetationIndices,
  TerraVegetationImageCollectionName,
  VegetationIndexType
} from './vegetation';
import {
  resolveWildfire,
  WildfireImageCollection,
  WildfireType
} from './wildfire';

interface IImageCollectionDateRange {
  [id: string]: [number, number];
}

// TODO: Refactor this to be more flexible and available at the resolver file level.

export const getImageCollectionAvailableDateRanges = async (
  ...imgCollectionName: string[]
): Promise<IImageCollectionDateRange> => {
  await initializeEarthEngine();
  const res = await Promise.all(
    imgCollectionName.map<Promise<IImageCollectionDateRange>>(name => {
      return new Promise((resolve, reject) => {
        ee.ImageCollection(name)
          .get('date_range')
          .evaluate((data: [number, number], err: Error) => {
            if (err) {
              return reject(err);
            }
            resolve({ [name]: data });
          });
      });
    })
  );
  return res.reduce(
    (obj: IImageCollectionDateRange, i: IImageCollectionDateRange) => {
      return { ...obj, ...i };
    },
    {}
  );
};

export const EarthEngineFields = async (): Promise<
  GraphQLFieldConfigMap<IOccurrence, IEarthEngineContext>
> => {
  const imgRanges = await getImageCollectionAvailableDateRanges(
    WildfireImageCollection,
    AquaVegetationImageCollectionName,
    TerraVegetationImageCollectionName,
    ClimateImageCollectionName
  );

  return {
    ...LandcoverFields,
    ...ElevationFields,
    AquaVegetation: {
      description: 'MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m',
      resolve: getResolveSourceFunction({
        featureResolver: resolveAquaVegetationIndices,
        sourceEnd: imgRanges[AquaVegetationImageCollectionName][1],
        sourceLabel: 'AquaVegetation',
        sourceStart: imgRanges[AquaVegetationImageCollectionName][0]
      }),
      type: VegetationIndexType
    },
    Climate: {
      description: ClimateIndexType.description,
      resolve: getResolveSourceFunction({
        featureResolver: resolveClimateData,
        sourceEnd: imgRanges[ClimateImageCollectionName][1],
        sourceLabel: 'Climate',
        sourceStart: imgRanges[ClimateImageCollectionName][0]
      }),
      type: ClimateIndexType
    },
    SurfaceWater: {
      description: SurfaceWaterType.description,
      resolve: getResolveSourceFunction({
        featureResolver: resolveSurfaceWater,
        sourceLabel: 'SurfaceWater'
      }),
      type: SurfaceWaterType
    },
    [GeoPotentialHeightLabel]: {
      description: `A vertical coordinate referenced to Earth's mean sea level, an adjustment
     to geometric height (elevation above mean sea level) using the variation of gravity with latitude and
     elevation. Thus, it can be considered a "gravity-adjusted height".
    `,
      resolve: getResolveFieldFunction({
        featureResolver: resolveClimateData,
        fieldName: GeoPotentialHeightLabel,
        sourceEnd: imgRanges[ClimateImageCollectionName][1],
        sourceLabel: 'Climate',
        sourceStart: imgRanges[ClimateImageCollectionName][0]
      }),
      type: GraphQLFloat
    },
    TerraVegetation: {
      description: 'MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m',
      resolve: getResolveSourceFunction({
        featureResolver: resolveTerraVegetationIndices,
        sourceEnd: imgRanges[TerraVegetationImageCollectionName][1],
        sourceLabel: 'TerraVegetation',
        sourceStart: imgRanges[TerraVegetationImageCollectionName][0]
      }),
      type: VegetationIndexType
    },
    Wildfire: {
      description: WildfireType.description,
      resolve: getResolveSourceFunction({
        featureResolver: resolveWildfire,
        sourceEnd: imgRanges[WildfireImageCollection][1],
        sourceLabel: 'Wildfire',
        sourceStart: imgRanges[WildfireImageCollection][0]
      }),
      type: WildfireType
    }
  };
};
