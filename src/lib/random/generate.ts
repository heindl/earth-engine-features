import * as ee from '@google/earthengine';

const boundary = () => {
  const northAmerica = ee.FeatureCollection(
    'ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw'
  );

  const cutsetGeometry = ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });

  const northAmericaGeometry = northAmerica
    .filter(
      ee.Filter.or(
        ee.Filter.eq('Country', 'Canada'),
        ee.Filter.eq('Country', 'Mexico'),
        ee.Filter.eq('Country', 'United States')
      )
    )
    .geometry(500);
  // 8% bonus on + 130,000, lti + 10 to 15 k
  return northAmericaGeometry.intersection(cutsetGeometry, 500);
};

const randomTimeStart = 1262304000000; // 2010
// const randomTimeEnd = 1388534400000; // 2014
const randomTimeSpan = 126230400000; // 4 yrs

const divisionsNext = (numberOfPoints: number) => {
  const bounds = ee.Geometry(boundary());
  const ecoregions = ee.FeatureCollection(
    'ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA'
  );

  const img = ee.Image.pixelArea()
    .addBands(
      ee
        .Image()
        .byte()
        .paint(ecoregions, 'ECO_NUM')
        .rename(['ECO_NUM'])
    )
    .clip(bounds);

  const groups = ee.List(
    img
      .reduceRegion({
        bestEffort: true,
        reducer: ee.call('Reducer.sum').group({
          groupField: 1,
          groupName: 'label'
        }),
        scale: 30
      })
      .get('groups')
  );

  const labels = groups.map((r: ee.UncastDictionary) => {
    return ee.Number(ee.Dictionary(r).get('label'));
  });

  const groupSummations = ee.List(
    groups.map((r: ee.UncastDictionary) => {
      return ee.Number(ee.Dictionary(r).get('sum'));
    })
  );

  const totalArea = ee.Number(groupSummations.reduce(ee.Reducer.sum()));

  const classPoints = groupSummations.map((v: ee.UncastNumber) => {
    return ee
      .Number(v)
      .divide(totalArea)
      .multiply(numberOfPoints)
      .round();
  });

  return ee
    .Image(img)
    .addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
      classBand: 'ECO_NUM',
      classPoints,
      classValues: labels,
      dropNulls: true,
      numPoints: numberOfPoints,
      // projection: 'EPSG:4326',
      scale: 500
    })
    .map((uc: ee.Feature) => {
      const f = ee.Feature(uc);
      return ee.Feature(
        f.setGeometry(
          ee.Geometry.Point([
            ee.Number(f.get('longitude')),
            ee.Number(f.get('latitude'))
          ])
        )
      );
    })
    .randomColumn('random')
    .map((uf: ee.UncastFeature) => {
      const f = ee.Feature(uf);
      const timestamp = ee
        .Number(f.get('random'))
        .multiply(randomTimeSpan)
        .round()
        .add(randomTimeStart);
      const dateMs = ee
        .Date(timestamp)
        .update({
          hour: 12,
          minute: 0,
          second: 0
        })
        .millis();
      return f.setMulti({
        random: null,
        'system:time_end': dateMs,
        'system:time_start': dateMs,
        time_end: dateMs,
        time_start: dateMs
      });
    });

  //   Map.addLayer(
  //   ee.Image()
  //     .byte()
  //     .paint(stratified, 'ECO_NUM')
  //     .randomVisualizer()
  // );
};

export default function(numberOfPoints: number) {
  return new Promise((resolve, reject) => {
    const eeRequest = divisionsNext(numberOfPoints);
    eeRequest.evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// var out = divisions_next(500)
// .aggregate_array('time_start')

// out = ee.List(out)
// .map(function(i) {
//   return ee.Date(i).format('YYYYMM')
// })

// out = ee.List(out).sort()

// print(out)
