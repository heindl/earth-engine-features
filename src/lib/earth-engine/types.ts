import ee from '@google/earthengine';
import { ILocationFields } from '../occurrences/location';

export interface IOccurrence {
  ID: string;
}

export type AllowedFieldTypes =
  | string
  | number
  | number[]
  | { [key: string]: number }
  | Date;

export interface IRequestResponse extends ILocationFields {
  [key: string]: AllowedFieldTypes;
}

export interface IResolveSourceParams {
  sourceName: string;
  occurrenceID: string;
  aggregator: EarthEngineAggregationFunction;
}

export interface IResolveFieldParams extends IResolveSourceParams {
  fieldName: string;
}

export interface IEarthEngineContext {
  ee: {
    resolveField: (params: IResolveFieldParams) => Promise<AllowedFieldTypes>;
    resolveSource: (params: IResolveSourceParams) => Promise<IRequestResponse>;
  };
}

export type EarthEngineAggregationFunction = (
  fc: ee.FeatureCollection
) => ee.FeatureCollection;

export interface IResolveResponse extends IOccurrence {
  [key: string]: any;
}

export type EarthEngineResolver = (
  parent: IOccurrence,
  args: { [k: string]: any },
  context: IEarthEngineContext
) => Promise<IRequestResponse | AllowedFieldTypes>;

export function getResolveFieldFunction(
  sourceName: string,
  aggregator: EarthEngineAggregationFunction,
  fieldName: string
): EarthEngineResolver {
  // tslint:disable:variable-name
  return (
    occurrence: IOccurrence,
    _args: any,
    context: IEarthEngineContext
  ): Promise<AllowedFieldTypes> => {
    return context.ee.resolveField({
      aggregator,
      fieldName,
      occurrenceID: occurrence.ID,
      sourceName
    });
  };
}

export function getResolveSourceFunction(
  sourceName: string,
  aggregator: EarthEngineAggregationFunction
): EarthEngineResolver {
  // tslint:disable:variable-name
  return (
    occurrence: IOccurrence,
    _args: any,
    context: IEarthEngineContext
  ): Promise<IRequestResponse> => {
    return context.ee.resolveSource({
      aggregator,
      occurrenceID: occurrence.ID,
      sourceName
    });
  };
}
