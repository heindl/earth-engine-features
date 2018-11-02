import ee from '@google/earthengine';
import * as crypto from 'crypto';

export interface IExample {
  latitude: number;
  longitude: number;
  timestamp: number; // In seconds since the epoch
  radius?: number;
  id?: string;
}

export const ExampleIDLabel = 'system:id';
export const ExampleTimeLabel = 'system:time';

export class Example {
  public readonly id: string;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly timestamp: number;
  public readonly radius: number;

  constructor(args: IExample) {
    this.latitude = args.latitude;
    this.longitude = args.longitude;
    this.timestamp = args.timestamp;
    this.radius = args.radius || 30;
    this.id = args.id || crypto.randomBytes(10).toString('hex');
  }

  public toEarthEngineFeature = () => {
    return ee.Feature(
      ee.Geometry.Point(this.longitude, this.latitude).buffer(this.radius),
      {
        [ExampleIDLabel]: this.id,
        [ExampleTimeLabel]: this.timestamp * 1000 // convert to milliseconds
      }
    );
  };
}
