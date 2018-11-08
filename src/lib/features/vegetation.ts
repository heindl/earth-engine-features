import ee from '@google/earthengine';
import {
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import { Context, Labels } from './occurrence';
import { IQueryResult, registerEarthEngineCaller } from './query';

export const VegetationIndicesFields = {
  BlueSurfaceReflectance: {
    description: 'Blue surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  Enhanced: {
    description: `Enhanced Vegetation Index (EVI) that minimizes canopy background variations and maintains sensitivity over dense vegetation conditions. The EVI also uses the blue band to remove residual atmosphere contamination caused by smoke and sub-pixel thin cloud clouds.`,
    type: new GraphQLList(GraphQLFloat)
  },
  MirSurfaceReflectance: {
    description: 'MIR surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  NirSurfaceReflectance: {
    description: 'NIR surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  Normalized: {
    description: `Normalized Difference Vegetation Index (NDVI), the continuity index to the existing National Oceanic and Atmospheric Administration-Advanced Very High Resolution Radiometer (NOAA-AVHRR) derived NDVI.`,
    type: new GraphQLList(GraphQLFloat)
  },
  RedSurfaceReflectance: {
    description: 'Red surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  }
};

const VegetationIndexType: GraphQLObjectType = new GraphQLObjectType({
  description:
    'The MODIS NDVI and EVI products are computed from atmospherically corrected bi-directional surface reflectances that have been masked for water, clouds, heavy aerosols, and cloud shadows.',
  fields: () => VegetationIndicesFields,
  name: 'VegetationIndices'
});

// tslint:disable:variable-name
export const VegetationIndexFields: GraphQLFieldConfigMap<
  IQueryResult,
  Context
> = {
  AquaVegetation: {
    description: 'MYD13Q1.006 Aqua Vegetation Indices 16-Day Global 250m',
    type: VegetationIndexType
  },
  TerraVegetation: {
    description: 'MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m',
    type: VegetationIndexType
  }
};

// TODO: Really should group by date and run concurrently because examples will fall on same day in daily search.
const fetchVegetationIndices = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return fc
    .map(getFeatureFetchFunction('TerraVegetation', 'MODIS/006/MOD13Q1'))
    .map(getFeatureFetchFunction('AquaVegetation', 'MODIS/006/MYD13Q1'));
};

registerEarthEngineCaller(VegetationIndexFields, fetchVegetationIndices);

const MODIS_BANDS = [
  'NDVI',
  'EVI',
  'sur_refl_b01',
  'sur_refl_b02',
  'sur_refl_b03',
  'sur_refl_b07'
];

function getFeatureFetchFunction(
  fieldLabel: string,
  imageCollectionName: string
): (feature: ee.Feature) => ee.Feature {
  const vectorLabels = ee.List(Object.keys(VegetationIndicesFields));

  const uic = ee
    .ImageCollection(imageCollectionName)
    .select(ee.List(MODIS_BANDS), ee.List(vectorLabels));

  return (feature: ee.Feature): ee.Feature => {
    feature = ee.Feature(feature);
    const endDate = ee.Date(feature.get(Labels.Date));
    const startDate = ee.Date(feature.get(Labels.IntervalStartDate));

    const reducedFeatures = ee.FeatureCollection(
      ee
        .ImageCollection(uic)
        .filterDate(startDate, endDate)
        .map(i => {
          return ee.Feature(
            ee.Geometry.Point(0, 0),
            i.reduceRegion({
              geometry: ee.Feature(feature).geometry(),
              reducer: ee.call('Reducer.mean')
            })
          );
        })
    );

    const properties = ee.List(vectorLabels).iterate((label, current) => {
      return ee
        .Dictionary(current)
        .set(
          ee.String(label),
          ee
            .FeatureCollection(reducedFeatures)
            .aggregate_array(ee.String(label))
        );
    }, ee.Dictionary({}));

    return feature.set(
      ee.Dictionary({
        [fieldLabel]: properties
      })
    );
  };
}
