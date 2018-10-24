
var weather_collections = ee.List([
    // PRISM Daily Spatial Climate Dataset AN81d
    // - Simple data but many null fields.
    ee.ImageCollection('OREGONSTATE/PRISM/AN81d'),
    // NLDAS-2: North American Land Data Assimilation System Forcing Fields
    // - Perhaps best bet, "Forcing Field" meaning instrument data (i think)
    ee.ImageCollection('NASA/NLDAS/FORA0125_H002'),
    // CFSV2: NCEP Climate Forecast System Version 2, 6-Hourly Products
    // - Secondary forecast data.
    ee.ImageCollection('NOAA/CFSV2/FOR6H'),
    // GFS: Global Forecast System 384-Hour Predicted Atmosphere Data
    // ee.ImageCollection('NOAA/GFS0P25'),
    // RTMA: Real-Time Mesoscale Analysis
    // - Excellent dataset, but only since 2015
    // ee.ImageCollection('NOAA/NWS/RTMA'),
    // GPM: Global Precipitation Measurement (GPM) v5
    // - Only since 2014
    // ee.ImageCollection('NASA/GPM_L3/IMERG_V05'),
    // GLDAS-2.1: Global Land Data Assimilation System
    // - Could be good but I think infreqently updated, like once a month.
    // ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H')
])


var analysis = ee.List(weather_collections.map(function(c){

    var minDate = '2000-01-01';

    var north_america = ee.Geometry.Rectangle([-178.2,6.6,-49.0,83.3])

    var fc = ee.ImageCollection(c);

    fc = fc.filterDate(minDate, '2019-01-01').filterBounds(north_america)

    var monthly_count = fc.filterDate(minDate, '2000-02-01').size();

    var latest_date = ee.Date(fc.sort('system:time_start', false).first().get('system:time_start'));

    var min_update_frequency = ee.Date('2018-05-25').difference(latest_date, 'day')

    return ee.Image(fc.first()).bandNames().map(function(name){
        return ee.Dictionary({
            'id': fc.get('system:id'),
            // 'title': fc.get('title'),
            'band': name,
            // 'description': fc.get('description'),
            'monthlyCount': monthly_count,
            'minimum_update_frequency': min_update_frequency,
        })
    })


})).flatten().map(function(a){
    return ee.Dictionary(a).values()
})

print(ee.List(analysis).flatten())

// var north_america = ee.Geometry.Rectangle([-178.2,6.6,-49.0,83.3])

// var aPerBand = ee.ImageCollection('NASA/NLDAS/FORA0125_H002')
// .filterDate('2000-01-01', '2000-02-01')
// .filterBounds(north_america);

// print(aPerBand.map(function(i){
//   i = ee.Image(i)
//   return i.get('temperature')
// }, true))

// print(aPerBand.toArrayPerBand(1).toDictionary())






// print(w1.reduceColumns(ee.Reducer.toList(1), ee.List(['system:start_time'])))