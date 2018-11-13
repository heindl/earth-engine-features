import { ILocationFields, LocationCollection } from '../occurrences/location';

const daysBefore = 10;

const locations = [
  {
    CoordinateUncertainty: 0,
    Date: new Date(2017, 6).valueOf(),
    ID: 'a',
    Latitude: 35.538851,
    Longitude: -82.7054901
  },
  {
    CoordinateUncertainty: 0,
    Date: new Date(2017, 2).valueOf(),
    ID: 'b',
    Latitude: 38.5743927,
    Longitude: -109.586438
  }
];

export const TestLocations: ILocationFields[] = locations.map(loc => {
  return {
    ...loc,
    IntervalStartDate: loc.Date - 86400 * 1000 * daysBefore
  };
});

export const TestLocationsCollection: LocationCollection = new LocationCollection(
  TestLocations
);

export const locationsGraphQLString = () => {
  return (
    '[' +
    TestLocations.map(l => {
      return `{id: "${l.ID}", lat: ${l.Latitude}, lng: ${
        l.Longitude
        // }, date: "${moment(l.Date).format('YYYY-MM-DD')}"}`;
      }, date: "${l.Date}"}`;
    }).join(',') +
    ']'
  );
};
