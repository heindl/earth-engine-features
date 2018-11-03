import ee from '@google/earthengine';
import * as crypto from 'crypto';

export interface IExample {
  latitude: number;
  longitude: number;
  date: Date;
  radius?: number;
  id?: string;
}

export const ExampleIDLabel = 'system:id';
export const ExampleTimeLabel = 'system:time';
export const ExampleIntervalStartTimeLabel = 'interval_start_time';

export class Example {
  public readonly id: string;
  public readonly latitude: number;
  public readonly longitude: number;
  public readonly millisecondsSinceTheEpoch: number;
  public readonly radius: number;

  constructor(args: IExample) {
    this.latitude = args.latitude;
    this.longitude = args.longitude;
    this.millisecondsSinceTheEpoch = args.date.valueOf();
    this.radius = args.radius || 30;
    this.id = args.id || crypto.randomBytes(10).toString('hex');
  }

  public intervalStartTime = (intervalDaysBefore: number): number => {
    const inMilliseconds = intervalDaysBefore * 86400 * 1000;
    return this.millisecondsSinceTheEpoch - inMilliseconds;
  };

  public toEarthEngineFeature = (cfg?: { intervalDaysBefore?: number }) => {
    return ee.Feature(
      ee.Geometry.Point(this.longitude, this.latitude).buffer(this.radius),
      {
        [ExampleIDLabel]: this.id,
        [ExampleTimeLabel]: this.millisecondsSinceTheEpoch, // convert to milliseconds
        [ExampleIntervalStartTimeLabel]:
          cfg && cfg.intervalDaysBefore
            ? this.intervalStartTime(cfg.intervalDaysBefore)
            : this.millisecondsSinceTheEpoch
      }
    );
  };
}
