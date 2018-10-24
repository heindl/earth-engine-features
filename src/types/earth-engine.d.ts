// tslint:disable:ban-types variable-name

declare module '@google/earthengine' {
  namespace ee {

    export interface Object {
      evaluate(callback: (success: object, failure: Error) => void): void
    }

    export interface String extends Object{
      length(): Number
    }
    export const String: (v: string) => String;

    export function initialize(
      opt_baseurl: string | null,
      opt_tileurl: string | null,
      opt_successCallback: () => void,
      opt_errorCallback: (error: Error) => void,
      opt_xsrfToken?: string
    ): void

    // tslint:disable:class-name
    namespace data {

      // JSON content of private key
      export type AuthPrivateKey = string

      export function authenticateViaPrivateKey(
        privateKey: AuthPrivateKey,
        opt_success: () => void,
        opt_error: (message: string) => void,
        opt_extraScopes?: string[]
        ): void;
    }

    namespace Algorithms {
      export function If(condition: Object, trueCase: Object, falseCase: Object): Object
    }

    export interface Number extends Object {
      add(v: number): Number
    }
    export const Number: (v: number) => Number;

    export interface Dictionary extends Object {
      add(v: number): Number
    }
    export const Dictionary: (v: { [key: string]: any }) => Dictionary;

    export interface Geometry extends Object {
      geodesic(): boolean
    }
    interface GeometryConstructor {
      Point(coords: [number, number]): Geometry
    }
    export const Geometry: GeometryConstructor;

    export interface List<T> extends Object {
      id(): string
      map<K>(func: (a: T) => K): List<K>
      slice(start: number, end?: number): List<T>
      get(index: number): T
      removeAll(other: List<T>): List<T>
      sort(): List<T>
      length(): Number
    }

    interface ListContructor {
      <T>(v: T | ReadonlyArray<T>): List<T>
      (v: any | ReadonlyArray<any>): List<any>
    }
    export const List: ListContructor;

    export interface Feature extends Object  {
      id(): String
      // Extract a property from a feature.
      get(s: String): String
      geometry(maxError?: Number, proj?: Projection, geodesics?: List<String>): Geometry
      set(var_args: Dictionary|ee.List<Object>): Feature
    }
    export const Feature: (v: string | Geometry, props?: Dictionary) => Feature;

    export interface Reducer{
      unweighted(): Reducer
    }

    interface ReducerConstructor{
      max(): Reducer
    }

    export const Reducer: ReducerConstructor;

    export interface Projection{
      crs(): string
    }

    export interface Image extends Object  {
      format(format?: string, timeZone?: string): string
      reduceRegion(
        reducer: Reducer,
        geometry?: Geometry,
        scale?: Number,
        crs?: Projection,
        crsTransform?: List<Number>,
        bestEffort?: boolean,
        maxPixels?: number,
        tileScale?: number,
      ): Dictionary
    }
    export const Image: (v: string) => Image;

    export interface ImageCollection extends Object  {
      readonly filterBounds: (geometry: Feature | Geometry) => ImageCollection
      readonly filterDate: (start: Date | number | string, end: Date | number | string) => ImageCollection
      // A list of names, regexes or numeric indices specifying the bands to select.
      readonly select: (
        selectors: List<string | number> | string | number,
        names?: ReadonlyArray<string>
      ) => ImageCollection
      reduceColumns(reducer: Reducer, selectors?: List<String>, weightSelectors?: List<Number>): List<Dictionary>
      getRegion(geometry: Geometry, scale?: Number, crs?: Projection, crsTransform?: List<String>): List<String>
    }

    export const ImageCollection: (v: Image | ReadonlyArray<Image> | string) => ImageCollection;

    export interface FeatureCollection extends Object  {
      geometry(): Geometry
      toList(count: Number, offset?: number): List<Feature>
      size(): Number
      filter(filter: Filter): FeatureCollection
      aggregate_min(property: String): Number
    }
    type FeatureCollectionConstructor = (v: Feature | Geometry | List<Feature | Geometry> | string) => FeatureCollection
    export const FeatureCollection: FeatureCollectionConstructor;

    export interface Date extends Object {
      readonly format: (format?: string, timeZone?: string) => string
      advance(amount: Number, unit: String): Date
      difference(start: Date, unit: String): Number
    }
    interface DateConstructor{
      (date: Object | Date): Date
      fromYMD(year: number, month: number, day: number): Date
    }
    export const Date: DateConstructor;

    interface Filter {
      serialize(): string
    }
    interface FilterConstructor{
      notNull(properties: ReadonlyArray<string>): Filter
    }
    export const Filter: FilterConstructor;
  }

  export = ee
}