// tslint:disable:object-literal-sort-keys

import ee from '@google/earthengine';
import * as GeoJSON from 'geojson';
import {
  FieldNode,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  Kind
} from 'graphql';
import { Example, IExample } from './example';
import { combineFeatureCollections } from './features';
import { fetchSurfaceWater, SurfaceWaterFields } from './surface-water';
import { fetchWildfire, WildFireFields } from './wildfire';

const cutsetGeometry = (): ee.Geometry => {
  return ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169, -49.0, 59.5747563],
    geodesic: false
  });
};

const DigitalElevationModelImage = () => `CGIAR/SRTM90_V4`;
const LandcoverImage = () => 'ESA/GLOBCOVER_L4_200901_200912_V2_3';

const ElevationFields = {
  aspect: {
    description: `Aspect in degrees calculated from ${DigitalElevationModelImage()}.`,
    name: 'aspect',
    type: GraphQLInt
  },
  elevation: {
    description: `Elevation in meters from ${DigitalElevationModelImage()}.`,
    type: GraphQLInt
  },
  hillshade: {
    description: `Simple hillshade from ${DigitalElevationModelImage()}.`,
    type: GraphQLInt
  },
  slope: {
    description: `Slope in degrees from ${DigitalElevationModelImage()}.`,
    type: GraphQLInt
  }
};

const LandcoverType = new GraphQLScalarType({
  name: 'Landcover',
  description:
    'A dictionary of landcover id to weighted histogram value within input space.',
  serialize(histogram: { [key: string]: number }): string {
    return JSON.stringify(histogram);
  },
  parseValue(s: string): { [key: string]: number } {
    return JSON.parse(s);
  },
  parseLiteral(ast): { [key: string]: number } | null {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value); // ast value is always in string format
      default:
        return null;
    }
  }
});

const LandcoverFields = {
  landcover: {
    description: `The landcover category generated from ${LandcoverImage()}.`,
    type: LandcoverType
  }
};

interface ICategoryGroup {
  [key: string]: {
    description: string;
    type: GraphQLScalarType | GraphQLList<any>;
  };
}

const shouldFetch = (
  categoryFields: ICategoryGroup,
  queryFields: string[]
): boolean => {
  return Object.keys(categoryFields).reduce(
    (hasBeenFound: boolean, fieldName: string) => {
      return hasBeenFound || queryFields.includes(fieldName);
    },
    false
  );
};

const TerrainType: GraphQLObjectType = new GraphQLObjectType({
  description: 'Features related to the terrain of the example coordinates.',
  fields: () => ({
    ...ElevationFields,
    ...WildFireFields,
    ...LandcoverFields,
    ...SurfaceWaterFields
  }),
  name: 'terrain'
});

const resolveTerrain = (
  examples: Example[],
  fields: string[]
): Promise<object[]> => {
  const initialFC = ee.FeatureCollection(
    ee.List(examples.map(e => e.toEarthEngineFeature()))
  );

  let mergedFC = initialFC.merge(ee.FeatureCollection([]));

  if (shouldFetch(LandcoverFields, fields)) {
    mergedFC = mergedFC.merge(fetchLandcover(initialFC));
  }

  if (shouldFetch(ElevationFields, fields)) {
    mergedFC = mergedFC.merge(fetchElevation(initialFC));
  }

  if (shouldFetch(WildFireFields, fields)) {
    mergedFC = mergedFC.merge(fetchWildfire(initialFC));
  }

  if (shouldFetch(SurfaceWaterFields, fields)) {
    mergedFC = mergedFC.merge(fetchSurfaceWater(initialFC));
  }

  return new Promise((resolve, reject) => {
    combineFeatureCollections(initialFC, mergedFC).evaluate((data, err) => {
      if (err) {
        reject(err);
        return;
      }
      const rf = (data as GeoJSON.FeatureCollection).features;
      resolve(rf.map(f => f.properties || {}));
    });
  });
};

// TODO: Instead of returning first, return an object, i.e. {70: 2, 91: 1: 87: 5}
const fetchLandcover = (fc: ee.FeatureCollection): ee.FeatureCollection => {
  return ee
    .Image('ESA/GLOBCOVER_L4_200901_200912_V2_3')
    .select('landcover')
    .reduceRegions({
      collection: ee.FeatureCollection(fc),
      reducer: ee.call('Reducer.frequencyHistogram'),
      scale: 30
    })
    .select(['histogram'], ['landcover']);
  // .map((f) => {
  //   const feature = ee.Feature(f);
  //     return feature.set(ee.List([ee.String('landcover'), feature.get("first")]))
  // })
};

const fetchElevation = (fc: ee.FeatureCollection): ee.FeatureCollection => {
  return ee.Terrain.products(
    ee.Image(ee.String(DigitalElevationModelImage())).clip(cutsetGeometry())
  )
    .select([...Object.keys(ElevationFields)])
    .reduceRegions({
      collection: ee.FeatureCollection(fc),
      reducer: ee.call('Reducer.first'),
      scale: 30
    });
};

function selections(info: GraphQLResolveInfo): string[] {
  const arrs: string[][] = info.fieldNodes.map(node => {
    if (!node.selectionSet) {
      return [];
    }
    return node.selectionSet.selections.map(selection => {
      return (selection as FieldNode).name.value;
    });
  });
  return ([] as string[]).concat(...arrs);
}

export const TerrainFields = {
  terrain: {
    type: TerrainType,
    description: TerrainType.description,
    // tslint:disable:variable-name
    resolve: async (
      source: IExample,
      _args: object,
      _context: object,
      info: GraphQLResolveInfo
    ) => {
      const ex = new Example(source);
      const terrainFeatures = await resolveTerrain([ex], selections(info));
      return terrainFeatures[0];
    }
  }
};
