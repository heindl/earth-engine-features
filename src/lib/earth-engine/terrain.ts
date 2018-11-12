import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  getResolveFieldFunction,
  IEarthEngineContext,
  IOccurrence
} from './types';

const cutsetGeometry = (): ee.Geometry => {
  return ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });
};

const LandcoverImage = 'ESA/GLOBCOVER_L4_200901_200912_V2_3';

// TODO: Consider converting the landcover to a key value pair to be more inline with GraphQL style.
export const resolveLandcover = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return ee
    .Image(LandcoverImage)
    .select('landcover')
    .reduceRegions({
      collection: ee.FeatureCollection(fc),
      reducer: ee.call('Reducer.frequencyHistogram').setOutputs(['Landcover']),
      scale: 30
    });
};

export const LandcoverFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Landcover: {
    description: `The landcover category generated from ${LandcoverImage}.`,
    resolve: getResolveFieldFunction({
      featureResolver: resolveLandcover,
      fieldName: 'Landcover',
      sourceLabel: 'Landcover'
    }),
    type: GraphQLJSON
  }
};

const DigitalElevationModelImage = `CGIAR/SRTM90_V4`;

// TODO: Should mean reduce elevation rather than first. But the others need to be considered more carefully.
export const resolveTerrain = (
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
    resolve: getResolveFieldFunction({
      featureResolver: resolveTerrain,
      fieldName: 'Aspect',
      sourceLabel: 'Terrain'
    }),
    type: GraphQLInt
  },
  Elevation: {
    description: `Elevation in meters from ${DigitalElevationModelImage}.`,
    resolve: getResolveFieldFunction({
      featureResolver: resolveTerrain,
      fieldName: 'Elevation',
      sourceLabel: 'Terrain'
    }),
    type: GraphQLInt
  },
  Hillshade: {
    description: `Simple hillshade from ${DigitalElevationModelImage}.`,
    resolve: getResolveFieldFunction({
      featureResolver: resolveTerrain,
      fieldName: 'Hillshade',
      sourceLabel: 'Terrain'
    }),
    type: GraphQLInt
  },
  Slope: {
    description: `Slope in degrees from ${DigitalElevationModelImage}.`,
    resolve: getResolveFieldFunction({
      featureResolver: resolveTerrain,
      fieldName: 'Slope',
      sourceLabel: 'Terrain'
    }),
    type: GraphQLInt
  }
};
