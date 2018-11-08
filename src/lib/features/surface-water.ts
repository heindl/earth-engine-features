import ee from '@google/earthengine';
import {
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import { Context, Labels } from './occurrence';
import { IQueryResult, registerEarthEngineCaller } from './query';

const NEAREST_LABEL = 'DistanceToNearest';
const PERCENTAGE_LABEL = 'CoverageByRadius';

export const SurfaceWaterTypeFields: GraphQLFieldConfigMap<
  IQueryResult,
  Context
> = {
  [NEAREST_LABEL]: {
    // TODO: Set this as a known scale, such as meters.
    description: `Distance to nearest body of surface water, generated from JRC Monthly Water History, v1.0 [JRC/GSW1_0/MonthlyHistory].`,
    type: GraphQLFloat
  },
  [PERCENTAGE_LABEL]: {
    // TODO: Allow the pixel areas to be set by argument.
    // TODO: Set this as a known measurement.
    description: `An array of pixel areas covered by water, of increasingly large regions, generated from JRC Monthly Water History, v1.0 [JRC/GSW1_0/MonthlyHistory].`,
    type: new GraphQLList(GraphQLFloat)
  }
};

const SurfaceWaterType: GraphQLObjectType = new GraphQLObjectType({
  description: `
     JRC Monthly Water History, v1.0
     These data were generated using 3,066,102 scenes from Landsat 5, 7, and 8 acquired between 
     16 March 1984 and 10 October 2015. Each pixel was individually classified into water / non-water 
     using an expert system and the results were collated into a monthly history for the entire time 
     period and two epochs (1984-1999, 2000-2015) for change detection.
  `,
  fields: () => SurfaceWaterTypeFields,
  name: 'SurfaceWater'
});

const SurfaceWaterFields: GraphQLFieldConfigMap<IQueryResult, Context> = {
  SurfaceWater: {
    description: SurfaceWaterType.description,
    type: SurfaceWaterType
  }
};

const getImage = (date: ee.Date, ufc: ee.UncastFeatureCollection): ee.Image => {
  const ic = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory');

  const fc = ee.FeatureCollection(ufc);

  const waterImage = ic
    .filter(
      ee.Filter.and(
        ee.Filter.eq(ee.String('month'), date.get('month')),
        ee.Filter.eq(ee.String('year'), date.get('year'))
      )
    )
    .first()
    .clipToCollection(fc);

  const maskedWaterImage = waterImage.updateMask(
    ee
      .Image(waterImage)
      .select('water')
      .eq(ee.Number(2))
  );

  const pixelArea = ee.Image.pixelArea().clipToCollection(fc);

  const waterArea = pixelArea
    .updateMask(maskedWaterImage.mask())
    .rename(['water_area']);

  const distanceImage = waterArea
    .fastDistanceTransform()
    .sqrt()
    .multiply(pixelArea.sqrt())
    .rename(['distance']);

  return pixelArea.addBands(waterArea).addBands(distanceImage);
};

const aggregateAreaStats = (uf: ee.UncastFeature): ee.Feature => {
  const feature = ee.Feature(uf);
  const fc = ee
    .FeatureCollection(ee.List(feature.get('joined')))
    .sort('buffer');

  const waterArea = ee.List(fc.aggregate_array('water_area')).slice(1);
  const area = ee.List(fc.aggregate_array('area')).slice(1);
  const distance = fc.aggregate_first('distance');

  return feature.setMulti(
    ee.Dictionary({
      SurfaceWater: ee.Dictionary({
        [NEAREST_LABEL]: distance,
        [PERCENTAGE_LABEL]: ee.Array(waterArea).divide(ee.Array(area))
      }),
      joined: null
    })
  );
};

const fetchBatch = (
  date: ee.UncastString,
  ufc: ee.UncastFeatureCollection
): ee.FeatureCollection => {
  const imageDate = ee.Date(date);
  const fc = ee.FeatureCollection(ufc);

  const regionFc = fc.iterate(
    (f: ee.UncastFeature, l: ee.UncastFeatureCollection) => {
      return (
        ee
          // .List([0, 120, 480, 960, 1920, 7680, 30720])
          .List([0, 120, 480, 960])
          .iterate((v: ee.UncastNumber, iFC: ee.UncastFeatureCollection) => {
            const geom = ee
              .Feature(f)
              .geometry()
              .buffer(ee.Number(v).multiply(2), 30);
            return ee.FeatureCollection(iFC).merge(
              ee.FeatureCollection(
                ee.Feature(geom, {
                  buffer: ee.Number(v),
                  [Labels.ID]: ee.Feature(f).get(Labels.ID)
                })
              )
            );
          }, ee.FeatureCollection(l))
      );
    },
    ee.FeatureCollection([])
  );

  const img = getImage(imageDate, regionFc);

  const regions = img.reduceRegions({
    collection: ee.FeatureCollection(regionFc),
    reducer: ee.call('Reducer.sum'),
    scale: 30
  });

  const combined = ee.Join.saveAll({ matchesKey: 'joined' }).apply({
    condition: ee.Filter.equals({
      leftField: Labels.ID,
      rightField: Labels.ID
    }),
    primary: ee.FeatureCollection(fc),
    secondary: regions
  });

  return combined.map(aggregateAreaStats);
};

const compileBatches = (
  f: ee.UncastFeature,
  r: ee.UncastDictionary
): ee.Dictionary => {
  const feature = ee.Feature(f);
  const date = ee.Date(feature.get(Labels.Date));
  const res = ee.Dictionary(r);

  const latestYear = ee
    .Array([ee.Number(date.get('year'))])
    .min([2014])
    .get([0]);

  const upDate = date.update({
    day: 15,
    year: ee.Number(latestYear)
  });

  const key = ee.String(upDate.format('YYYY-MM-dd'));

  const list = ee.Algorithms.If(
    res.contains(key),
    ee.FeatureCollection(res.get(key)),
    ee.FeatureCollection([])
  );

  return res.set(
    key,
    ee.FeatureCollection(list).merge(ee.FeatureCollection(feature))
  );
};

export function resolveSurfaceWater(
  fc: ee.FeatureCollection
): ee.FeatureCollection {
  const data = ee
    .Dictionary(
      ee.FeatureCollection(fc).iterate(compileBatches, ee.Dictionary({}))
    )
    .map(fetchBatch)
    .values()
    .iterate(
      (ifc: ee.UncastFeatureCollection, resFc: ee.UncastFeatureCollection) => {
        return ee.FeatureCollection(resFc).merge(ee.FeatureCollection(ifc));
      },
      ee.FeatureCollection([])
    );
  return ee.FeatureCollection(data);
}

registerEarthEngineCaller(SurfaceWaterFields, resolveSurfaceWater);
