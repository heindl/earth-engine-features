import ee, { UncastFeatureCollection } from '@google/earthengine';

const getImage = (date: ee.Date, ufc: ee.UncastFeatureCollection): ee.Image => {
  // tslint:disable:variable-name
  const JRC_GSW1_0_MonthlyHistory = ee.ImageCollection(
    'JRC/GSW1_0/MonthlyHistory'
  );

  const fc = ee.FeatureCollection(ufc);

  const waterImage = JRC_GSW1_0_MonthlyHistory.filter(
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
      joined: null,
      surface_water_distance: distance,
      surface_water_percentages: ee.Array(waterArea).divide(ee.Array(area))
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
      return ee
        .List([0, 120, 480, 960, 1920, 7680, 30720])
        .iterate((v: ee.UncastNumber, iFC: ee.UncastFeatureCollection) => {
          const geom = ee
            .Feature(f)
            .geometry()
            .buffer(ee.Number(v).multiply(2), 30);
          return ee.FeatureCollection(iFC).merge(
            ee.FeatureCollection(
              ee.Feature(geom, {
                buffer: ee.Number(v),
                feature_id: ee.Feature(f).get('system:index')
              })
            )
          );
        }, ee.FeatureCollection(l));
    },
    ee.FeatureCollection([])
  );

  const img = getImage(imageDate, regionFc);

  const regions = img.reduceRegions(
    ee.FeatureCollection(regionFc),
    ee.Reducer.sum(),
    30
  );

  const combined = ee.Join.saveAll({ matchesKey: 'joined' }).apply(
    ee.FeatureCollection(fc),
    regions,
    ee.Filter.equals({ leftField: 'system:index', rightField: 'feature_id' })
  );

  return combined.map(aggregateAreaStats);
};

const compileBatches = (
  f: ee.UncastFeature,
  r: ee.UncastDictionary
): ee.Dictionary => {
  const feature = ee.Feature(f);
  const startDate = ee.Date(feature.get('time_start'));
  const res = ee.Dictionary(r);

  const latestYear = ee
    .Array([ee.Number(startDate.get('year'))])
    .min([2014])
    .get([0]);

  const upDate = startDate.update({
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

export const fetch = (fc: ee.UncastFeatureCollection): Promise<object> => {
  return new Promise((resolve, reject) => {
    const res = ee
      .Dictionary(
        ee.FeatureCollection(fc).iterate(compileBatches, ee.Dictionary({}))
      )
      .map(fetchBatch)
      .values()
      .iterate(
        (ifc: UncastFeatureCollection, resFc: UncastFeatureCollection) => {
          return ee.FeatureCollection(resFc).merge(ee.FeatureCollection(ifc));
        },
        ee.FeatureCollection([])
      );

    return res.evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

// var occurrences = ee.FeatureCollection("ft:1P5obit-elnFpwISENVbXDYUiIdQXBZmVKgsvBhfC");

// var features = occurrences
// .filterDate('2002', '2019')
// .filterBounds(cutset_geometry)
// .sort('time_start')
// .limit(10);

// print(fetch(features.toList(features.size())))

// var fc = ee.FeatureCollection([
//   ee.Feature(
//     ee.Geometry.Point([-97.8072,30.159573]),
//     ee.Dictionary({
//         'time_start': ee.Date.fromYMD(2014, 4, 2)
//     })
//   )
// ])

// print(fetch_batch(fc, ee.String('JRC/GSW1_0/MonthlyHistory/2014_04')));

// exports.fetch = function(fc) {

//   // Group features by month

//   fc = ee.FeatureCollection(fc);
//   return fc.map(function(f){
//     return fetch(f)
//   })
// }
