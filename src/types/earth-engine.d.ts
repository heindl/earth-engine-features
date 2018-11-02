// tslint:disable:ban-types variable-name array-type

declare module '@google/earthengine' {
  namespace ee {
    export function call(s: string): Reducer;

    export interface Object {
      evaluate(callback: (success: object, failure: Error) => void): void;
    }

    export type UncastFeatureCollection = Object;
    export type UncastImageCollection = Object;
    export type UncastDictionary = Object;
    export type UncastString = Object;
    export type UncastNumber = Object;
    export type UncastFeature = Object;
    export type UncastList = Object;
    export type UncastGeometry = Object;

    export interface String extends Object {
      length(): Number;
    }
    export const String: (v: string | Object) => String;

    // tslint:disable:no-empty-interface
    export interface Boolean extends Object {}

    export interface Array extends Object {
      abs(): Array;
      divide(a: Array): Array;
      min(right: Array | Object[] | number[] | string[]): Array;
      get(i: number[]): Object;
      slice(start: number, end?: number): List;
    }
    export const Array: (v: Object | Object[]) => Array;

    export function initialize(
      opt_baseurl: string | null,
      opt_tileurl: string | null,
      opt_successCallback: () => void,
      opt_errorCallback: (error: Error) => void,
      opt_xsrfToken?: string
    ): void;

    // tslint:disable:class-name
    namespace data {
      // JSON content of private key
      export type AuthPrivateKey = string;

      export function authenticateViaPrivateKey(
        privateKey: AuthPrivateKey,
        opt_success: () => void,
        opt_error: (message: string) => void,
        opt_extraScopes?: string[]
      ): void;
    }

    namespace Algorithms {
      export function If(
        condition: Object,
        trueCase: Object,
        falseCase: Object
      ): Object;
    }

    export interface Number extends Object {
      add(v: number | Number): Number;
      multiply(v: number | Number): Number;
      divide(v: number | Number): Number;
      round(): Number;
    }
    export const Number: (v: number | Object) => Number;

    export interface Dictionary extends Object {
      add(v: number | Number): Number;
      contains(v: String | string): Boolean;
      get(v: String | string): Object;
      map(func: (key: String, value: Object) => Object): Dictionary;
      values(keys?: string[]): List;
      set(key: string | String, value: Object): Dictionary;
    }
    interface DictionaryConstructor {
      (
        data: { [key: string]: Object | string | string | null } | Object
      ): Dictionary;
      fromLists(
        key: Object | string[] | String[],
        values: Object | Object[]
      ): Dictionary;
    }

    export const Dictionary: DictionaryConstructor;

    export interface Geometry extends Object {
      geodesic(): boolean;
      intersection(right: Geometry, maxError?: number): Geometry;
      buffer(
        // The distance of the buffering, which may be negative.
        // If no projection is specified, the unit is meters.
        // Otherwise the unit is in the coordinate system of the projection.
        distance: number | Number,
        // The maximum amount of error tolerated when approximating the buffering circle and performing any necessary reprojection. If unspecified, defaults to 1% of the distance.
        maxError?: number,
        // If specified, the buffering will be performed in this projection and the distance will be interpreted as units of the coordinate system of this projection. Otherwise the distance is interpereted as meters and the buffering is performed in a spherical coordinate system.
        proj?: Projection
      ): Geometry;
    }
    interface GeometryConstructor {
      (obj: Object | GeoJSON.Geometry): Geometry;
      Point(x: number | Number, y: number | Number): Geometry;
      Rectangle(params: {
        coords: List | number[];
        proj?: Projection;
        geodesic?: boolean;
        evenOdd?: boolean;
      }): Geometry;
    }
    export const Geometry: GeometryConstructor;

    export interface List extends Object {
      id(): string;
      map(func: (a: Object) => Object): List;
      slice(start: number, end?: number): List;
      set(position: number, value: string | number | Object): List;
      get(index: number): Object;
      removeAll(other: Object[]): List;
      reduce(reducer: Reducer | string): Object;
      sort(): List;
      length(): Number;
      iterate(
        fn: (current: Object, previous: Object) => void,
        first?: Object
      ): Object;
      cat(list: Object[] | Object | string[]): List;
      flatten(): List;
    }
    export const List: (
      values: Object[] | Object | number[] | string[]
    ) => List;

    export interface Feature extends Object {
      id(): String;
      // Extract a property from a feature.
      get(s: String | string): Object;
      setGeometry(geometry: Geometry): Object;
      copyProperties(
        source: Feature,
        properties?: List, // The properties to copy. If omitted, all ordinary (i.e. non-system) properties are copied.
        exclude?: List // The list of properties to exclude when copying all properties. Must not be specified if properties is
      ): Object;
      geometry(
        maxError?: Number,
        proj?: Projection,
        geodesics?: List
      ): Geometry;
      set(var_args: Dictionary | ee.List): Feature;
      setMulti(props: Dictionary | {}): Feature;
    }
    export const Feature: (v: Object, props?: Object | object) => Feature;

    export interface Reducer extends Object {
      unweighted(): Reducer;
      group(params: { groupField: number; groupName: string }): Object;
    }
    interface ReducerConstructor {
      max(): Reducer;
      sum(): Reducer;
      first(): Reducer;
    }
    export const Reducer: ReducerConstructor;

    export interface Join {
      apply(params: {
        // The primary collection.
        primary: FeatureCollection;
        // The secondary collection.
        secondary: FeatureCollection;
        // The join condition used to select the matches from the two collections.
        condition: Filter;
      }): FeatureCollection;
    }
    interface JoinConstructor {
      saveAll(obj: {
        matchesKey: String | string; // The property name used to save the matches list.
        ordering?: String | string; // The property on which to sort the matches list.
        ascending?: boolean; // Whether the ordering is ascending.
        measureKey?: string | String; // An optional property name used to save the measure of the join condition on each match.
      }): Join;
    }
    export const Join: JoinConstructor;

    export interface Projection {
      crs(): string;
    }

    export interface Image extends Object {
      format(format?: string, timeZone?: string): string;
      clipToCollection(fc: FeatureCollection): Image;
      updateMask(mask: Image): Image;
      mask(mask?: Image): Image;
      rename(bands: string[]): Image;
      addBands(img: Image, selected?: string[]): Image;

      stratifiedSample(params: {
        numPoints: Number | number; // The default number of points to sample in each class. Can be overridden for specific classes using the 'classValues' and 'classPoints' properties.
        classBand?: String | string; // The name of the band containing the classes to use for stratification. If unspecified, the first band of the input image is used.
        region?: Geometry; // The region to sample from. If unspecified, the input image's whole footprint is used.
        scale?: Number | number; // A nominal scale in meters of the projection to sample in. Defaults to the scale of the first band of the input image.
        projection?: Projection; // The projection in which to sample. If unspecified, the projection of the input image's first band is used. If specified in addition to scale, rescaled to the specified scale.
        seed?: Number; // A randomization seed to use for subsampling.
        classValues?: List; // A list of class values for which to override the numPixels parameter. Must be the same size as classPoints or null.
        classPoints?: List; // A list of the per-class maximum number of pixels to sample for each class in the classValues list. Must be the same size as classValues or null.
        dropNulls?: Boolean | boolean; // Skip pixels in which any band is masked.
        tileScale?: Number; // A scaling factor used to reduce aggregation tile size; using a larger tileScale (e.g. 2 or 4) may enable computations that run out of memory with the default.
        geometries?: Boolean | boolean; // If true, the results will include a geometry per sampled pixel. Otherwise, geometries will be omitted (saving memory).
      }): FeatureCollection;

      reduceRegion(params: {
        reducer: Reducer | Object;
        geometry?: Geometry;
        scale?: Number | number;
        crs?: Projection;
        crsTransform?: List;
        bestEffort?: boolean;
        maxPixels?: number;
        tileScale?: number;
      }): Dictionary;
      select(bands: string[] | string): Image;
      eq(obj: Image | String | Number): Image;
      fastDistanceTransform(
        // Neighborhood size in pixels, default 256
        neighborhood?: number,
        // The units of the neighborhood, currently only 'pixels' are supported.
        units?: string,
        // Distance metric to use: options are 'squared_euclidean', 'manhattan' or 'chebyshev'.
        metric?: string
      ): Image;
      sqrt(): Image;
      multiply(img?: Image): Image;
      get(s: string): Object;
      // Casts the input value to an unsigned 8-bit integer.
      byte(): Image;
      paint(
        featureCollection: FeatureCollection,
        color?: Object | string,
        width?: Object
      ): Image;
      clip(geometry: Feature | Geometry | Object): Image;
      reduceRegions(params: {
        collection: FeatureCollection; // The features to reduce over.
        reducer: Reducer | Object; // The reducer to apply.
        scale?: number | Number; // A nominal scale in meters of the projection to work in.
        crs?: Projection; // The projection to work in. If unspecified, the projection of the image's first band is used. If specified in addition to scale, rescaled to the specified scale.
        crsTransform?: List; // The list of CRS transform values. This is a row-major ordering of the 3x2 transform matrix. This option is mutually exclusive with 'scale', and will replace any transform already set on the projection.
        tileScale?: number | Number; // A scaling factor used to reduce aggregation tile size; using a larger tileScale (e.g. 2 or 4) may enable computations that run out of memory with the default.
      }): FeatureCollection;
    }
    interface ImageConstructor {
      (v?: string | Image | String): Image;
      pixelArea(): Image;
      pixelLonLat(): Image;
    }
    export const Image: ImageConstructor;

    export interface ImageCollection extends Object {
      filterBounds(geometry: Feature | Geometry): ImageCollection;
      sort(s: string | String): ImageCollection;

      filter(filter: ee.Filter): ImageCollection;

      first(): Image;
      get(v: string): Object;

      filterDate(
        start: Date | number | string,
        end: Date | number | string
      ): ImageCollection;

      // A list of names, regexes or numeric indices specifying the bands to select.
      select(
        selectors: List | String | string[] | Object,
        names?: string[] | Object[] | List
      ): ImageCollection;

      reduceColumns(
        reducer: Reducer,
        selectors?: List,
        weightSelectors?: List
      ): List;

      toArrayPerBand(axis: number | Number): Image;

      getRegion(obj: {
        geometry: Geometry;
        scale?: Number | number;
        crs?: Projection;
        crsTransform?: List;
      }): List;
    }

    export const ImageCollection: (
      v: Image | Image[] | string | Object
    ) => ImageCollection;

    export interface FeatureCollection extends Object {
      geometry(scale?: number): Geometry;
      toList(count: Number, offset?: number): List;
      randomColumn(
        columnName: string,
        seed?: number | Number
      ): FeatureCollection;
      size(): Number;
      get(key: string): Object;
      sort(s: string): FeatureCollection;
      filter(filter: Filter): FeatureCollection;
      aggregate_min(property: String): Number;
      map(func: (a: Feature) => Feature): FeatureCollection;
      aggregate_array(property: string | String): Object;
      first(): Feature;
      // Select properties from each Feature in a collection. It is also possible to call this function with
      // only string arguments; they will be all be interpreted as propertySelectors (varargs).
      // Returns the feature collection with selected properties.
      select(
        propertySelectors: List | String[] | string[], // A list of names or regexes specifying the attributes to select.
        newProperties?: List | String[] | string[], // A list of new names for the output properties. Must match the number of properties selected.
        retainGeometry?: boolean // When false, the result will have a NULL geometry. Defaults to true.
      ): FeatureCollection;
      aggregate_first(property: string): Object;
      merge(collection: ee.FeatureCollection): ee.FeatureCollection;
      iterate(
        fn: (current: Feature, previous: FeatureCollection) => void,
        first: Object
      ): Object;
    }
    type FeatureCollectionConstructor = (
      v: Object[] | List | Object | string | object[]
    ) => FeatureCollection;
    export const FeatureCollection: FeatureCollectionConstructor;

    export interface Date extends Object {
      readonly format: (format?: string, timeZone?: string) => string;
      advance(amount: Number | number, unit: String | string): Date;
      difference(start: Date | Object, unit: String | string): Number;
      get(v: string): Object;
      update(o: {
        year?: number | Number;
        month?: number | Number;
        day?: number | Number;
        hour?: number | Number;
        minute?: number | Number;
        second?: number | Number;
      }): Date;
      millis(): Number;
    }
    interface DateConstructor {
      (date: Object): Date;
      fromYMD(year: number, month: number, day: number): Date;
    }
    export const Date: DateConstructor;

    interface Filter {
      serialize(): string;
    }
    interface FilterConstructor {
      notNull(properties: ReadonlyArray<string>): Filter;
      eq(name: String | string, value: Object | string): Filter;
      or(...filters: Filter[]): Filter;
      and(...filters: Filter[]): Filter;
      withinDistance(params: {
        distance: number;
        leftField: string;
        rightField: string;
        maxError: number;
      }): Filter;
      equals(obj: {
        leftField?: string | String; // A selector for the left operand. Should not be specified if leftValue is specified.
        rightValue?: Object; // The value of the right operand. Should not be specified if rightField is specified.
        rightField?: string | String; // A selector for the right operand. Should not be specified if rightValue is specified.
        leftValue?: Object; // The value of the left operand. Should not be specified if leftField is specified.
      }): Filter;
    }
    export const Filter: FilterConstructor;

    namespace Terrain {
      export function products(image: Image): Image;
    }

    // export interface DateRange extends Object {
    //   contains(other: Object): Boolean;
    //   start(): Date;
    //   end(): Date;
    // }
    // interface DateRangeConstructor {
    //   (start: Date, end: Date): DateRange;
    //   (obj: Object): DateRange;
    // }
    // export const DateRange: DateRangeConstructor;
  }

  export = ee;
}
