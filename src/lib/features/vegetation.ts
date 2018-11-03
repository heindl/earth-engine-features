// tslint:disable:object-literal-sort-keys variable-name

import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import {
  Example,
  ExampleIntervalStartTimeLabel,
  ExampleTimeLabel,
  IExample
} from './example';

const TerraImageName = 'MODIS/006/MOD13Q1';
const AquaImageName = 'MODIS/006/MYD13Q1';

export const VegetationIndicesFields = {
  Normalized: {
    description: `Normalized Difference Vegetation Index`,
    type: new GraphQLList(GraphQLFloat)
  },
  Enhanced: {
    description: `Enhanced Vegetation Index`,
    type: new GraphQLList(GraphQLFloat)
  },
  RedSurfaceReflectance: {
    description: 'Red surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  NirSurfaceReflectance: {
    description: 'NIR surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  BlueSurfaceReflectance: {
    description: 'Blue surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  },
  MirSurfaceReflectance: {
    description: 'MIR surface reflectance',
    type: new GraphQLList(GraphQLFloat)
  }
};

// MOD13Q1.006 Terra Vegetation Indices 16-Day Global 250m
// MODIS/006/MOD13Q1
// Resolution: 250m
const VegetationIndicesType: GraphQLObjectType = new GraphQLObjectType({
  fields: () => VegetationIndicesFields,
  name: 'VegetationIndices'
});

// tslint:disable:variable-name
export const VegetationIndices: {
  [key: string]: GraphQLFieldConfig<IExample, object>;
} = {
  TerraVegetation: {
    description:
      'The MOD13Q1 V6 product provides a Vegetation Index (VI) value at a per pixel basis. There are two primary vegetation layers. The first is the Normalized Difference Vegetation Index (NDVI) which is referred to as the continuity index to the existing National Oceanic and Atmospheric Administration-Advanced Very High Resolution Radiometer (NOAA-AVHRR) derived NDVI. The second vegetation layer is the Enhanced Vegetation Index (EVI) that minimizes canopy background variations and maintains sensitivity over dense vegetation conditions. The EVI also uses the blue band to remove residual atmosphere contamination caused by smoke and sub-pixel thin cloud clouds. The MODIS NDVI and EVI products are computed from atmospherically corrected bi-directional surface reflectances that have been masked for water, clouds, heavy aerosols, and cloud shadows.',
    resolve: async (source: IExample, _args: object, _context: object) => {
      const ex = new Example(source);
      // TODO: Set this as argument
      const data = await fetchFeatureCollection(TerraImageName, [ex], 60);
      return data[0];
    },
    type: VegetationIndicesType
  },
  AquaVegetation: {
    description:
      'The MYD13Q1 V6 product provides a Vegetation Index (VI) value at a per pixel basis. There are two primary vegetation layers. The first is the Normalized Difference Vegetation Index (NDVI) which is referred to as the continuity index to the existing National Oceanic and Atmospheric Administration-Advanced Very High Resolution Radiometer (NOAA-AVHRR) derived NDVI. The second vegetation layer is the Enhanced Vegetation Index (EVI) that minimizes canopy background variations and maintains sensitivity over dense vegetation conditions. The EVI also uses the blue band to remove residual atmosphere contamination caused by smoke and sub-pixel thin cloud clouds. The MODIS NDVI and EVI products are computed from atmospherically corrected bi-directional surface reflectances that have been masked for water, clouds, heavy aerosols, and cloud shadows.',
    resolve: async (source: IExample, _args: object, _context: object) => {
      const ex = new Example(source);
      // TODO: Set this as argument
      const data = await fetchFeatureCollection(AquaImageName, [ex], 60);
      return data[0];
    },
    type: VegetationIndicesType
  }
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
): (feature: ee.Feature) => ee.Feature {
  const vectorLabels = ee.List(Object.keys(VegetationIndicesFields));

  const uic = ee
    .ImageCollection(imageCollectionName)
    .select(ee.List(MODIS_BANDS), ee.List(vectorLabels));

  return (feature: ee.Feature): ee.Feature => {
    feature = ee.Feature(feature);
    const endDate = ee.Date(feature.get(ExampleTimeLabel));
    const startDate = ee.Date(feature.get(ExampleIntervalStartTimeLabel));

    const properties = ee.FeatureCollection(
      ee
        .ImageCollection(uic)
        .filterDate(startDate, endDate)
        .map(i => {
          return ee.Feature(
            ee.Geometry.Point(0, 0),
            i.reduceRegion({
              reducer: ee.call('Reducer.mean'),
              geometry: ee.Feature(feature).geometry()
            })
          );
        })
    );

    return ee.Feature(
      ee.List(vectorLabels).iterate((label, current) => {
        return ee
          .Feature(current)
          .set(
            ee.List([
              ee.String(label),
              ee.FeatureCollection(properties).aggregate_array(ee.String(label))
            ])
          );
      }, feature)
    );
  };
}

// TODO: Really should group by date and run concurrently because examples will fall on same day in daily search.
function fetchFeatureCollection(
  imageCollectionName: string,
  examples: Example[],
  intervalDaysBefore: number // Default -180
): Promise<object[]> {
  const initialFC = ee.FeatureCollection(
    ee.List(examples.map(e => e.toEarthEngineFeature({ intervalDaysBefore })))
  );
  const fn = getFeatureFetchFunction(imageCollectionName);
  return new Promise((resolve, reject) => {
    initialFC.map(fn).evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      const rf = (data as GeoJSON.FeatureCollection).features;
      resolve(rf.map(f => f.properties || {}));
    });
  });
}
