import { ILocationFields } from '../occurrences/location';
import { EarthEngineSource } from './source';

export interface IOccurrence {
  ID: string;
}

export interface IRequestResponse extends ILocationFields {
  [key: string]: AllowedFieldTypes;
}

export type AllowedFieldTypes =
  | string
  | number
  | number[]
  | { [key: string]: number }
  | Date;

export interface IEarthEngineContext {
  ee: {
    resolve(
      params: IResolveParams
    ): Promise<IRequestResponse | AllowedFieldTypes>;
  };
}

export type EarthEngineResolver = (
  parent: IOccurrence,
  args: { [k: string]: any },
  context: IEarthEngineContext
) => Promise<IRequestResponse | AllowedFieldTypes>;

export interface IResolveParams {
  source: EarthEngineSource;
  locationID?: string;
  fieldName?: string;
}

export function getResolveFunction(args: IResolveParams): EarthEngineResolver {
  return (
    occurrence: IOccurrence,
    // tslint:disable:variable-name
    _args: any,
    context: IEarthEngineContext
  ): Promise<IRequestResponse | AllowedFieldTypes> => {
    return context.ee.resolve({ ...args, locationID: occurrence.ID });
  };
}
