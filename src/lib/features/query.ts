// tslint:disable:object-literal-sort-keys
import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import {
  FieldNode,
  GraphQLFieldConfigMap,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLResolveInfo,
  GraphQLSchema
} from 'graphql';
import {
  Context,
  ExampleIDLabel,
  IOccurrenceArgs,
  Occurrence,
  OccurrenceArgs,
  OccurrenceFields
} from './occurrence';

// TODO: Consider this for flattening results:
// https://github.com/chasingmaxwell/graphql-leveler

const OccurrenceTypeConfig: GraphQLObjectTypeConfig<
  IOccurrenceArgs,
  Context
> = {
  name: 'Occurrence',
  description: 'Features related to the terrain of the occurrence coordinates.',
  fields: { ...OccurrenceFields }
};

type EarthEngineCaller = (col: ee.FeatureCollection) => ee.FeatureCollection;

const EarthEngineCallers: Map<string, EarthEngineCaller> = new Map();

export const registerEarthEngineCaller = (
  fields: GraphQLFieldConfigMap<IOccurrenceArgs, Context>,
  caller: EarthEngineCaller
) => {
  // tslint:disable:no-console
  console.log(
    'keys',
    Object.keys(fields)
      .sort()
      .join(',')
  );
  EarthEngineCallers.set(
    Object.keys(fields)
      .sort()
      .join(','),
    caller
  );
  OccurrenceTypeConfig.fields = { ...fields, ...OccurrenceTypeConfig.fields };
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

export const queryEarthEngine = (
  initialFC: ee.FeatureCollection,
  callers: EarthEngineCaller[]
): Promise<any[]> => {
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
      leftField: ExampleIDLabel,
      rightField: ExampleIDLabel
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
          .map(f => f.properties)
          .filter(notEmpty)
      );
    });
  });
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

const queryType = () => {
  return new GraphQLObjectType({
    name: 'QueryType',
    description: 'The root query type',
    fields: () => ({
      Occurrence: {
        type: new GraphQLObjectType(OccurrenceTypeConfig),
        description: OccurrenceTypeConfig.description,
        args: OccurrenceArgs,
        // tslint:disable:variable-name
        resolve: async (
          _source: any,
          args: { [key: string]: any },
          _context: any,
          info: GraphQLResolveInfo
        ) => {
          const occurrences = [new Occurrence(args as IOccurrenceArgs)];

          const fieldNameRe = new RegExp(
            `(^|,)(${fieldNames(info).join('|')})(,|$)`
          );

          // tslint:disable:no-console
          // console.log(fieldNameRe);

          const callers: EarthEngineCaller[] = Array.from(
            EarthEngineCallers.keys()
          )
            .map(v => {
              return v.search(fieldNameRe) === -1
                ? null
                : EarthEngineCallers.get(v);
            })
            .filter(notEmpty);

          const occurrenceProperties = await queryEarthEngine(
            // TODO: Parse max interval days before from info or args.
            ee.FeatureCollection(
              occurrences.map(o =>
                o.toEarthEngineFeature({ intervalDaysBefore: 30 })
              )
            ),
            callers
          );

          // console.log('occurrence properties', occurrenceProperties);

          return occurrences
            .map(o => {
              occurrenceProperties.forEach(p => {
                if (p[ExampleIDLabel] === o.id) {
                  o.setProperties(p);
                }
              });
              return o;
            })[0]
            .resolve();
        }
      }
    })
  });
};

export const schema = () => {
  return new GraphQLSchema({
    query: queryType()
  });
};
