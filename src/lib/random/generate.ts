import ee from '@google/earthengine';
import { IRandomOccurrenceArgs } from '../features/args';
import { Labels } from '../features/occurrence';

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
  return northAmericaGeometry.intersection(cutsetGeometry, 500);
};

const ecoRegionImage = (): ee.Image => {
  const bounds = ee.Geometry(boundary());
  const ecoregions = ee.FeatureCollection(
    'ft:1Ec8IWsP8asxN-ywSqgXWMuBaxI6pPaeh6hC64lA'
  );
  return ee.Image.pixelArea()
    .addBands(
      ee
        .Image()
        .byte()
        .paint(ecoregions, 'ECO_NUM')
        .rename(['ECO_NUM'])
    )
    .clip(bounds);
};

const ecoRegionGroups = (img: ee.Image): ee.List => {
  return ee.List(
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
};

// A list of the per-class maximum number of pixels to sample for each class in the classValues list.
// The same size as classValues.
const maxPointsPerClass = (numPoints: number, groups: ee.List): ee.List => {
  const groupSummations = ee.List(
    ee.List(groups).map((r: ee.Object) => {
      return ee.Number(ee.Dictionary(r).get('sum'));
    })
  );

  const totalArea = ee.Number(groupSummations.reduce('sum'));

  return groupSummations.map((v: ee.UncastNumber) => {
    return ee
      .Number(v)
      .divide(totalArea)
      .multiply(numPoints)
      .round();
  });
};

export const generateRandomFeatures = (
  args: IRandomOccurrenceArgs
): ee.FeatureCollection => {
  const timeSpan = args.endDate.valueOf() - args.startDate.valueOf();

  const ecoRegionImg = ecoRegionImage();

  const regions = ecoRegionGroups(ecoRegionImg);

  const randomFeatures = ee
    .Image(ecoRegionImg)
    .addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
      classBand: 'ECO_NUM',
      classPoints: ee.List(maxPointsPerClass(args.count, regions)),
      classValues: regions.map((r: ee.Object) => {
        return ee.Number(ee.Dictionary(r).get('label'));
      }),
      dropNulls: true,
      numPoints: args.count,
      // projection: 'EPSG:4326',
      scale: 500
    })
    .randomColumn('random');

  return randomFeatures.map((f: ee.Feature) => {
    f = ee.Feature(f);

    const date = ee
      .Date(
        ee
          .Number(f.get('random'))
          .multiply(ee.Number(timeSpan))
          .round()
          .add(ee.Number(args.startDate.valueOf()))
      )
      .update({
        hour: 12,
        minute: 0,
        second: 0
      });

    f = ee
      .Feature(
        f.setGeometry(
          ee.Geometry.Point(
            ee.Number(f.get('longitude')),
            ee.Number(f.get('latitude'))
          )
        )
      )
      .select(
        ['latitude', 'longitude', 'ECO_NUM'],
        ['Latitude', 'Longitude', 'EcoRegionNumber']
      );

    return f.setMulti({
      random: null,
      [Labels.Uncertainty]: ee.Number(0),
      [Labels.Date]: date,
      [Labels.IntervalStartDate]: date.advance(
        ee.Number(args.intervalInDays).multiply(-1),
        'day'
      )
    });
  });

  //   Map.addLayer(
  //   ee.Image()
  //     .byte()
  //     .paint(stratified, 'ECO_NUM')
  //     .randomVisualizer()
  // );
};
