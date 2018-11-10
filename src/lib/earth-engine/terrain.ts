import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  EarthEngineAggregationFunction,
  EarthEngineRequestService,
  EarthEngineResolver,
  IEarthEngineContext,
  IOccurrence
} from './resolver';

const cutsetGeometry = (): ee.Geometry => {
  return ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });
};

function getEarthEngineResolveFunction(
  sectionKey: string,
  fn: EarthEngineAggregationFunction
): EarthEngineResolver {
  // tslint:disable:variable-name
  return (
    parent: IOccurrence,
    _args: any,
    context: { ee: EarthEngineRequestService }
  ): object => {
    return context.ee.resolve(sectionKey, parent.ID, fn);
  };
}

const LandcoverImage = 'ESA/GLOBCOVER_L4_200901_200912_V2_3';

// TODO: Consider converting the landcover to a key value pair to be more inline with GraphQL style.
const fetchLandcover = (fc: ee.FeatureCollection): ee.FeatureCollection => {
  return ee
    .Image(LandcoverImage)
    .select('landcover')
    .reduceRegions({
      collection: ee.FeatureCollection(fc),
      reducer: ee.call('Reducer.frequencyHistogram'),
      scale: 30
    })
    .select(['histogram'], ['Landcover']);
};

export const LandcoverFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Landcover: {
    description: `The landcover category generated from ${LandcoverImage}.`,
    resolve: getEarthEngineResolveFunction('Landcover', fetchLandcover),
    type: GraphQLJSON
  }
};

const DigitalElevationModelImage = `CGIAR/SRTM90_V4`;

// TODO: Should mean reduce elevation rather than first. But the others need to be considered more carefully.
export const fetchTerrain = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return ee.Terrain.products(
    ee.Image(ee.String(DigitalElevationModelImage)).clip(cutsetGeometry())
  )
    .select(
      ['aspect', 'elevation', 'hillshade', 'slope'],
      [...Object.keys(ElevationFields)]
    )
    .reduceRegions({
      collection: ee.FeatureCollection(fc),
      reducer: ee.call('Reducer.first'),
      scale: 30
    });
};

export const ElevationFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Aspect: {
    description: `Aspect in degrees calculated from ${DigitalElevationModelImage}.`,
    resolve: getEarthEngineResolveFunction('Terrain', fetchTerrain),
    type: GraphQLInt
  },
  Elevation: {
    description: `Elevation in meters from ${DigitalElevationModelImage}.`,
    resolve: getEarthEngineResolveFunction('Terrain', fetchTerrain),
    type: GraphQLInt
  },
  Hillshade: {
    description: `Simple hillshade from ${DigitalElevationModelImage}.`,
    resolve: getEarthEngineResolveFunction('Terrain', fetchTerrain),
    type: GraphQLInt
  },
  Slope: {
    description: `Slope in degrees from ${DigitalElevationModelImage}.`,
    resolve: getEarthEngineResolveFunction('Terrain', fetchTerrain),
    type: GraphQLInt
  }
};
