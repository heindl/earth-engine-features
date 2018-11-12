import ee from '@google/earthengine';
import { GraphQLFloat, GraphQLList, GraphQLObjectType } from 'graphql';
import { LocationLabels } from '../occurrences/location';

// TODO: These satellites have a rich history, so would be better to learn more about them.
// http://blogs.discovermagazine.com/imageo/2018/06/10/nearly-two-decades-revealing-satellite-images-now-available-fingertips/
// https://worldview.earthdata.nasa.gov/?p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,Reference_Labels(hidden),Reference_Features(hidden),Coastlines&t=2018-11-10-T00%3A00%3A00Z&z=3&v=-182.7970727229513,-50.22621689744125,-18.61071129642241,54.87196263374375
// Would be a good post to write to learn more and call some of the original engineers.

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

export const VegetationIndexType: GraphQLObjectType = new GraphQLObjectType({
  description:
    'The MODIS NDVI and EVI products are computed from atmospherically corrected bi-directional surface reflectances that have been masked for water, clouds, heavy aerosols, and cloud shadows.',
  fields: () => VegetationIndicesFields,
  name: 'VegetationIndices'
});

export const AquaVegetationImageCollectionName = 'MODIS/006/MYD13Q1';
export const TerraVegetationImageCollectionName = 'MODIS/006/MOD13Q1';

// TODO: Really should group by date and run concurrently because examples will fall on same day in daily search.
export const resolveAquaVegetationIndices = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return fc.map(getFeatureFetchFunction(AquaVegetationImageCollectionName));
};

export const resolveTerraVegetationIndices = (
  fc: ee.FeatureCollection
): ee.FeatureCollection => {
  return fc.map(getFeatureFetchFunction(TerraVegetationImageCollectionName));
};

const MODIS_BANDS = [
  'NDVI',
  'EVI',
  'sur_refl_b01',
  'sur_refl_b02',
  'sur_refl_b03',
  'sur_refl_b07'
];

function getFeatureFetchFunction(
  imageCollectionName: string
): (feat: ee.Feature) => ee.Feature {
  const vectorLabels = ee.List(Object.keys(VegetationIndicesFields));

  const uic = ee
    .ImageCollection(imageCollectionName)
    .select(ee.List(MODIS_BANDS), ee.List(vectorLabels));

  return (feature: ee.Feature): ee.Feature => {
    feature = ee.Feature(feature);
    const endDate = ee.Date(feature.get(LocationLabels.Date));
    const startDate = ee.Date(feature.get(LocationLabels.IntervalStartDate));

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

    return feature.setMulti(properties);
  };
}
