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
  featureResolver: EarthEngineAggregationFunction;
  sourceStart?: number;
  sourceEnd?: number;
  occurrenceID?: string;
  sourceLabel: string;
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
  args: IResolveFieldParams
): EarthEngineResolver {
  return (
    occurrence: IOccurrence,
    // tslint:disable:variable-name
    _args: any,
    context: IEarthEngineContext
  ): Promise<AllowedFieldTypes> => {
    return context.ee.resolveField({ ...args, occurrenceID: occurrence.ID });
  };
}

export function getResolveSourceFunction(
  args: IResolveSourceParams
): EarthEngineResolver {
  return (
    occurrence: IOccurrence,
    // tslint:disable:variable-name
    _args: any,
    context: IEarthEngineContext
  ): Promise<IRequestResponse> => {
    return context.ee.resolveSource({ ...args, occurrenceID: occurrence.ID });
  };
}
