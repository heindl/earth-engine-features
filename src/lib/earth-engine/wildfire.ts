import ee from '@google/earthengine';
import { GraphQLFieldConfigMap, GraphQLInt, GraphQLObjectType } from 'graphql';
import { LocationLabels } from '../occurrences/location';
import {
  getResolveFunction,
  IEarthEngineContext,
  IOccurrence
} from './resolve';
import { EarthEngineSource, fetchImageCollectionDateRange } from './source';

const WildfireTypeFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  DaysSinceLast: {
    description:
      'Searches the last 6.5 years worth of Wildfire records and returns the number of days since the last, or -1 if no burn was found.',
    type: GraphQLInt
  }
};

const WildfireType: GraphQLObjectType = new GraphQLObjectType({
  description: `
     The Fire Information for Resource Management System (FIRMS) dataset contains the LANCE fire 
     detection product in rasterized form. The near real-time (NRT) active fire locations are 
     processed by LANCE using the standard MODIS MOD14/MYD14 Fire and Thermal Anomalies product. 
  `,
  fields: () => WildfireTypeFields,
  name: 'Wildfire'
});

const WildfireImageCollection = 'FIRMS';

export class WildfireSource extends EarthEngineSource {
  protected dateRange: [number, number] | undefined;
  public label = () => {
    return 'Wildfire';
  };
  protected evaluate = (fc: ee.FeatureCollection) => {
    return ee.FeatureCollection(fc).map(fetchWildfireHistory);
  };
  protected fetchDateRange = async (): Promise<[number, number]> => {
    if (this.dateRange) {
      return this.dateRange;
    }
    this.dateRange = await fetchImageCollectionDateRange(
      WildfireImageCollection
    );
    return this.dateRange;
  };
}

const fetchWildfireHistory = (uc: ee.Feature): ee.Feature => {
  const feature = ee.Feature(uc);

  const date = ee.Date(feature.get(LocationLabels.Date));

  const FIRMS = ee.ImageCollection(WildfireImageCollection);

  const imgs = FIRMS.filterDate(
    // TODO: Include this value as an arg.
    date.advance(ee.Number(-6.5), ee.String('year')),
    date
  ).select(ee.String('T21'));

  const regions = imgs.getRegion({ geometry: feature.geometry(), scale: 1000 });

  const filteredRegions = ee
    .List(regions)
    .slice(1)
    .map(r => {
      const list = ee.List(r);
      return ee.Algorithms.If(list.get(4), list.get(3), ee.Number(0));
    })
    .removeAll([ee.Number(0)])
    .sort();

  return feature.set(
    ee.Dictionary({
      [Object.keys(WildfireTypeFields)[0]]: ee.Algorithms.If(
        filteredRegions.length(),
        date.difference(filteredRegions.get(0), 'day'),
        ee.Number(-1)
      )
    })
  );
};

export const WildfireFields: GraphQLFieldConfigMap<
  IOccurrence,
  IEarthEngineContext
> = {
  Wildfire: {
    description: WildfireType.description,
    resolve: getResolveFunction({ source: new WildfireSource() }),
    type: WildfireType
  }
};
