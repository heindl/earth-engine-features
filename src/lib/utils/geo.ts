import { Decimal } from 'decimal.js';

interface ICoords {
  lat: number;
  lng: number;
  uncertainty?: number;
}

export const normalizeCoordinates = (coords: ICoords): ICoords => {
  const lat = new Decimal(coords.lat);
  const lng = new Decimal(coords.lng);

  if (typeof coords.uncertainty !== 'undefined') {
    return {
      lat: lat.toDecimalPlaces(6).toNumber(),
      lng: lng.toDecimalPlaces(6).toNumber(),
      uncertainty: new Decimal(coords.uncertainty).round().toNumber()
    };
  }

  const minPrecision = Math.min(lat.precision(true), lng.precision(true), 5);

  const equatorialPrecisionInMeters = [111320, 11132, 1113, 111, 11, 1];

  return {
    lat: lat.toDecimalPlaces(6).toNumber(),
    lng: lng.toDecimalPlaces(6).toNumber(),
    uncertainty: equatorialPrecisionInMeters[minPrecision]
  };
};

// const getScaleAndPrecision = (x: number) => {
//   const s = x + "";
//   const scale = s.indexOf(".");
//   if (scale === -1) {
//     throw Error(`invalid coordinate: ${x}`)
//   }
//   return {
//     precision : s.length - scale - 1,
//     scale,
//   };
// };
