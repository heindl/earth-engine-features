import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  getResolveFunction,
  IEarthEngineContext,
  IOccurrence
} from './resolve';
import { EarthEngineSource } from './source';

const cutsetGeometry = (): ee.Geometry => {
  return ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });
};

const LandcoverImage = 'ESA/GLOBCOVER_L4_200901_200912_V2_3';

// TODO: Consider converting the landcover to a key value pair to be more inline with GraphQL style.

class LandcoverSource extends EarthEngineSource {
  public label = () => {
    return 'Landcover';
  };
  protected evaluate = (fc: ee.FeatureCollection): ee.FeatureCollection => {
    return ee
      .Image(LandcoverImage)
      .select('landcover')
      .reduceRegions({
        collection: ee.FeatureCollection(fc),
        reducer: ee
          .call('Reducer.frequencyHistogram')
          .setOutputs(['Landcover']),
        scale: 30
      });
  };
}

export const LandcoverFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Landcover: {
    description: `The landcover category generated from ${LandcoverImage}.`,
    resolve: getResolveFunction({
      fieldName: 'Landcover',
      source: new LandcoverSource()
    }),
    type: GraphQLJSON
  }
};

const DigitalElevationModelImage = `CGIAR/SRTM90_V4`;

// TODO: Should mean reduce elevation rather than first. But the others need to be considered more carefully.
// tslint:disable:max-classes-per-file
class TerrainSource extends EarthEngineSource {
  public label = () => {
    return 'Terrain';
  };
  protected evaluate = (fc: ee.FeatureCollection): ee.FeatureCollection => {
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
}

export const ElevationFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Aspect: {
    description: `Aspect in degrees calculated from ${DigitalElevationModelImage}.`,
    resolve: getResolveFunction({
      fieldName: 'Aspect',
      source: new TerrainSource()
    }),
    type: GraphQLInt
  },
  Elevation: {
    description: `Elevation in meters from ${DigitalElevationModelImage}.`,
    resolve: getResolveFunction({
      fieldName: 'Elevation',
      source: new TerrainSource()
    }),
    type: GraphQLInt
  },
  Hillshade: {
    description: `Simple hillshade from ${DigitalElevationModelImage}.`,
    resolve: getResolveFunction({
      fieldName: 'Hillshade',
      source: new TerrainSource()
    }),
    type: GraphQLInt
  },
  Slope: {
    description: `Slope in degrees from ${DigitalElevationModelImage}.`,
    resolve: getResolveFunction({
      fieldName: 'Slope',
      source: new TerrainSource()
    }),
    type: GraphQLInt
  }
};
