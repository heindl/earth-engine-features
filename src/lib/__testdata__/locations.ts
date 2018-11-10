const daysBefore = 10;

const locations = [
  {
    CoordinateUncertainty: 0,
    Date: new Date(2017, 6),
    ID: 'a',
    Latitude: 35.538851,
    Longitude: -82.7054901
  },
  {
    CoordinateUncertainty: 0,
    Date: new Date(2017, 2),
    ID: 'b',
    Latitude: 38.5743927,
    Longitude: -109.586438
  }
];

export const TestLocations = locations.map(loc => {
  return {
    ...loc,
    IntervalStartDate: new Date(loc.Date.valueOf() - 86400 * 1000 * daysBefore)
  };
});

export const locationsGraphQLString = () => {
  return (
    '[' +
    TestLocations.map(l => {
      const mm = (l.Date.getMonth() + 1).toString(); // getMonth() is zero-based
      const dd = l.Date.getDate().toString();
      const yy = l.Date.getFullYear();

      const dateString = `${yy}-${mm.length === 1 ? '0' + mm : mm}-${
        dd.length === 1 ? '0' + dd : dd
      }`;

      return `{id: "${l.ID}", lat: ${l.Latitude}, lng: ${
        l.Longitude
      }, date: "${dateString}"}`;
    }).join(',') +
    ']'
  );
};
