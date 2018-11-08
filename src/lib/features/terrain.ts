import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import { Context, Labels } from './occurrence';
import { IQueryResult, registerEarthEngineCaller } from './query';

const cutsetGeometry = (): ee.Geometry => {
  return ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });
};

const LandcoverImage = 'ESA/GLOBCOVER_L4_200901_200912_V2_3';

const LandcoverFields: GraphQLFieldConfigMap<IQueryResult, Context> = {
  Landcover: {
    description: `The landcover category generated from ${LandcoverImage}.`,
    type: GraphQLJSON
  }
};

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
    .select(
      ['histogram', ...Object.values(Labels)],
      ['Landcover', ...Object.values(Labels)]
    );
};

registerEarthEngineCaller(LandcoverFields, fetchLandcover);

const DigitalElevationModelImage = `CGIAR/SRTM90_V4`;

const ElevationFields: GraphQLFieldConfigMap<IQueryResult, Context> = {
  Aspect: {
    description: `Aspect in degrees calculated from ${DigitalElevationModelImage}.`,
    type: GraphQLInt
  },
  Elevation: {
    description: `Elevation in meters from ${DigitalElevationModelImage}.`,
    type: GraphQLInt
  },
  Hillshade: {
    description: `Simple hillshade from ${DigitalElevationModelImage}.`,
    type: GraphQLInt
  },
  Slope: {
    description: `Slope in degrees from ${DigitalElevationModelImage}.`,
    type: GraphQLInt
  }
};

// TODO: Should mean reduce elevation rather than first. But the others need to be considered more carefully.
const fetchElevation = (fc: ee.FeatureCollection): ee.FeatureCollection => {
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

registerEarthEngineCaller(ElevationFields, fetchElevation);
