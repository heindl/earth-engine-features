// tslint:disable:object-literal-sort-keys
import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import {
  FieldNode,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLResolveInfo,
  GraphQLSchema
} from 'graphql';
import { generateRandomFeatures } from '../random/generate';
import {
  IManyOccurrenceArgs,
  IOneOccurrenceArgs,
  IRandomOccurrenceArgs,
  ManyOccurrenceArgs,
  OneOccurrenceArgs,
  RandomOccurrenceArgs
} from './args';
import {
  Context,
  ILocationFields,
  Labels,
  LocationFields,
  Occurrence
} from './occurrence';

// TODO: Consider this for flattening results:
// https://github.com/chasingmaxwell/graphql-leveler

// TODO: This looks interesting for simplificaton:
// https://www.npmjs.com/package/type-graphql

type EarthEngineCaller = (col: ee.FeatureCollection) => ee.FeatureCollection;

const EarthEngineCallers: Map<string, EarthEngineCaller> = new Map();

export const registerEarthEngineCaller = (
  fields: GraphQLFieldConfigMap<IQueryResult, Context>,
  caller: EarthEngineCaller
) => {
  EarthEngineCallers.set(
    Object.keys(fields)
      .sort()
      .join(','),
    caller
  );
  OccurrenceTypeConfig.fields = { ...fields, ...OccurrenceTypeConfig.fields };
};

const getEarthEngineCallers = (info: GraphQLResolveInfo) => {
  const fieldNameRe = new RegExp(`(^|,)(${fieldNames(info).join('|')})(,|$)`);
  return Array.from(EarthEngineCallers.keys())
    .map(v => {
      return v.search(fieldNameRe) === -1 ? null : EarthEngineCallers.get(v);
    })
    .filter(notEmpty);
};

const fieldNames = (info: GraphQLResolveInfo): string[] => {
  const arrs: string[][] = info.fieldNodes.map(node => {
    if (!node.selectionSet) {
      return [];
    }
    return node.selectionSet.selections.map(selection => {
      return (selection as FieldNode).name.value;
    });
  });
  return ([] as string[]).concat(...arrs);
};

export interface IQueryResult extends ILocationFields {
  [key: string]: any;
}

export const queryEarthEngine = (
  initialFC: ee.FeatureCollection,
  callers: EarthEngineCaller[]
): Promise<IQueryResult[]> => {
  initialFC = ee.FeatureCollection(initialFC);

  const mergedFC = callers.reduce(
    (fc: ee.FeatureCollection, caller: EarthEngineCaller) => {
      return ee.FeatureCollection(fc).merge(caller(initialFC));
    },
    ee.FeatureCollection([])
  );

  const joined = ee.Join.saveAll({
    matchesKey: 'matches'
  }).apply({
    condition: ee.Filter.equals({
      leftField: Labels.ID,
      rightField: Labels.ID
    }),
    primary: ee.FeatureCollection(initialFC),
    secondary: ee.FeatureCollection(mergedFC)
  });

  const reduced = joined.map(f => {
    f = ee.Feature(f);
    const list = ee.List(f.get('matches'));
    f = f.setMulti({ matches: null });

    return ee.Feature(
      list.iterate((m, current) => {
        return ee.Feature(current).copyProperties(ee.Feature(m));
      }, f)
    );
  });

  return new Promise((resolve, reject) => {
    ee.FeatureCollection(reduced).evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(
        (data as GeoJSON.FeatureCollection).features
          .map(f => f.properties as IQueryResult)
          .filter(notEmpty)
      );
    });
  });
};

const OccurrenceTypeConfig: GraphQLObjectTypeConfig<IQueryResult, Context> = {
  name: 'Occurrence',
  description: 'Features related to the terrain of the occurrence coordinates.',
  fields: { ...LocationFields }
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

// tslint:disable:variable-name
const resolveOne = async (
  _source: any,
  args: { [k: string]: any },
  _context: any,
  info: GraphQLResolveInfo
) => {
  const a = args as IOneOccurrenceArgs;
  return queryEarthEngine(
    ee.FeatureCollection([new Occurrence(a).toEarthEngineFeature(a)]),
    getEarthEngineCallers(info)
  );
};

const resolveMany = async (
  _source: any,
  args: { [k: string]: any },
  _context: any,
  info: GraphQLResolveInfo
) => {
  const a = args as IManyOccurrenceArgs;
  return queryEarthEngine(
    ee.FeatureCollection(
      a.locations.map(o => new Occurrence(o).toEarthEngineFeature(a))
    ),
    getEarthEngineCallers(info)
  );
};

const resolveRandom = async (
  _source: any,
  args: { [k: string]: any },
  _context: any,
  info: GraphQLResolveInfo
) => {
  const a = args as IRandomOccurrenceArgs;
  return queryEarthEngine(
    generateRandomFeatures(a),
    getEarthEngineCallers(info)
  );
};

const queryType = () => {
  const oc = new GraphQLObjectType(OccurrenceTypeConfig);
  return new GraphQLObjectType({
    description: 'root query type',
    fields: () => ({
      one: {
        type: oc,
        description: OccurrenceTypeConfig.description,
        args: OneOccurrenceArgs,
        resolve: resolveOne
      },
      many: {
        type: new GraphQLList(oc),
        args: ManyOccurrenceArgs,
        resolve: resolveMany
      },
      random: {
        type: new GraphQLList(oc),
        args: RandomOccurrenceArgs,
        resolve: resolveRandom
      }
    }),
    name: 'QueryType'
  });
};

export const schema = () => {
  return new GraphQLSchema({
    query: queryType()
  });
};
