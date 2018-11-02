// tslint:disable:object-literal-sort-keys
import {
  FieldNode,
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema
} from 'graphql';
import { Example, IExample } from '../features/example';
import { resolveTerrain, TerrainType } from '../features/terrain';

function selections(info: GraphQLResolveInfo): string[] {
  const arrs: string[][] = info.fieldNodes.map(node => {
    if (!node.selectionSet) {
      return [];
    }
    return node.selectionSet.selections.map(selection => {
      return (selection as FieldNode).name.value;
    });
  });
  return ([] as string[]).concat(...arrs);
}

const ExampleFields = {
  latitude: {
    type: GraphQLFloat,
    description: `Latitude of example.`
  },
  longitude: {
    type: GraphQLFloat,
    description: `Longitude of example.`
  },
  radius: {
    type: GraphQLInt,
    // defaultValue: 30,
    description: `Radius of example coordinate in meters.`
  },
  timestamp: {
    type: GraphQLInt,
    description: `Unix timestamp in milliseconds of the example.`
  }
};

const ExampleType: GraphQLObjectType = new GraphQLObjectType({
  name: 'example',
  description: 'Features related to the terrain of the example coordinates.',
  fields: {
    ...ExampleFields,
    ...{
      terrain: {
        type: TerrainType,
        description: TerrainType.description,
        // tslint:disable:variable-name
        resolve: async (
          source: IExample,
          _args: object,
          _context: object,
          info: GraphQLResolveInfo
        ) => {
          const ex = new Example(source);

          const terrainFeatures = await resolveTerrain([ex], selections(info));
          // tslint:disable:no-console
          console.log('features', terrainFeatures);

          return terrainFeatures[0];
        }
      }
    }
  }
});

const ExampleArgs: GraphQLFieldConfigArgumentMap = ExampleFields;

interface IExampleArgs {
  latitude: number;
  longitude: number;
  radius?: number;
  timestamp: number;
}

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    example: {
      type: ExampleType,
      description: ExampleType.description,
      args: ExampleArgs,
      resolve: (_: IExample, args: { [key: string]: any }) => {
        const a = args as IExampleArgs;
        return {
          latitude: a.latitude,
          longitude: a.longitude,
          radius: a.radius || 30,
          timestamp: a.timestamp
        };
      }
    }
  })
});

export const schema = new GraphQLSchema({
  query: QueryType,
  types: [ExampleType]
});

// interface Example{
//   Latitude: number,
//   Longitude: number,
//   Radius: number,
//   Elevation: {
//     Aspect: number,
//     Elevation: number,
//     HillShade: number,
//     Slope: number,
//   },
//   LandCover: number
//   SurfaceWater: {
//     DistanceToNearest: number
//     PercentInRegions: number[]
//   }
//   Wildfire: {
//     DaysSince: number
//   }
//   TerraVegetationIndices: {
//     NormalizedVegetationIndices: number[]
//     EnhancedVegetationIndices: number[]
//     RedSurfaceReflectance: number[]
//     NirSurfaceReflectance: number[]
//     BlueSurfaceReflectance: number[]
//     MirSurfaceReflectance: number[]
//   }
//   AquaVegetationIndices: {
//     NormalizedVegetationIndices: number[]
//     EnhancedVegetationIndices: number[]
//     RedSurfaceReflectance: number[]
//     NirSurfaceReflectance: number[]
//     BlueSurfaceReflectance: number[]
//     MirSurfaceReflectance: number[]
//   }
//   Climate: {
//     LatentHeatNetFluxSurface6HourAverage: number[]
//     SensibleHeatNetFluxSurface6HourAverage: number[]
//     TemperatureHeightAboveGround: number[]
//     DownwardShortWaveRadiationFluxSurface6HourAverage: number[]
//     UpwardShortWaveRadiationFluxSurface6HourAverage: number[]
//     UpwardLongWaveRadpFluxSurface6HourAverage: number[]
//     DownwardLongWaveRadpFluxSurface6HourAverage: number[]
//     SpecificHumidityHeightAboveGround: number[]
//     PrecipitationRateSurface6HourAverage: number[]
//     PressureSurface: number[]
//     UComponentOfWindHeightAboveGround: number[]
//     VComponentOfWindHeightAboveGround: number[]
//     GeoPotentialHeightSurface: number[]
//   }
// }
