

// Next Option:
// Ignore date, for each point create a csv of all points between 2001 and 2018.
// Export and parse in memory.
// This would obviously be alot of data.

var MODIS_006_MOD13Q1_PROPERTIES = ee.List([
    'terra_normalized_vegetation_indices',
    'terra_enhanced_vegetation_indices',
    'terra_red_surface_reflectance',
    'terra_nir_surface_reflectance',
    'terra_blue_surface_reflectance',
    'terra_mir_surface_reflectance'
])

var MODIS_006_MYD13Q1_PROPERTIES = ee.List([
    'aqua_normalized_vegetation_indices',
    'aqua_enhanced_vegetation_indices',
    'aqua_red_surface_reflectance',
    'aqua_nir_surface_reflectance',
    'aqua_blue_surface_reflectance',
    'aqua_mir_surface_reflectance'
])

var MODIS_006_LABELS = ee.List([
    'NDVI',
    'EVI',
    'sur_refl_b01',
    'sur_refl_b02',
    'sur_refl_b03',
    'sur_refl_b07'
])

var NOAA_CFSV2_FOR6H_FIRST_PROPERTIES = ee.List([
    // Geopotential height is a vertical coordinate
    // referenced to Earth's mean sea level, an adjustment
    // to geometric height (elevation above mean sea level)
    // using the variation of gravity with latitude and
    // elevation. Thus, it can be considered a
    // "gravity-adjusted height".
    // It should be the same for each day.s
    'Geopotential_height_surface',
])

var NOAA_CFSV2_FOR6H_LIST_PROPERTIES = ee.List([

    // Latent heat is the heat moved by water evaporating and
    // condensing higher up in the atmosphere. Heat is absorbed
    // in evaporation and released by condensation – so
    // the result is a movement of heat from the surface
    // to higher levels in the atmosphere.
    'Latent_heat_net_flux_surface_6_Hour_Average',

    // “Sensible” heat is that caused by conduction and convection.
    // For example, with a warm surface and a cooler atmosphere,
    // at the boundary layer heat will be conducted into the atmosphere
    // and then convection will move the heat higher up into the atmosphere.
    'Sensible_heat_net_flux_surface_6_Hour_Average',

    // 'Maximum_temperature_height_above_ground_6_Hour_Interval',
    // 'Minimum_temperature_height_above_ground_6_Hour_Interval',
    'Temperature_height_above_ground',

    // Incoming ultraviolet, visible, and a limited portion of
    // infrared energy (together sometimes called "shortwave
    // radiation") from the Sun drive the Earth's climate system.
    // Some of this incoming radiation is reflected off clouds,
    // some is absorbed by the atmosphere, and some passes through
    // to the Earth's surface. Larger aerosol particles in the
    // atmosphere interact with and absorb some of the radiation,
    // causing the atmosphere to warm.
    'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
    'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',

    // Heat resulting from the absorption of incoming shortwave
    // radiation is emitted as longwave radiation. Radiation
    // from the warmed upper atmosphere, along with a small amount
    // from the Earth's surface, radiates out to space. Most of the
    // emitted longwave radiation warms the lower atmosphere, which
    // in turn warms our planet's surface.
    'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
    'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',

    // 'Maximum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
    // 'Minimum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
    'Specific_humidity_height_above_ground',

    'Precipitation_rate_surface_6_Hour_Average',

    'Pressure_surface',

    // For winds, the u wind is parallel to the x axis.
    // A positive u wind is from the west.
    // A negative u wind is from the east.
    'u-component_of_wind_height_above_ground',

    // The v wind runs parallel to the y axis.
    // A positive v wind is from the south,
    // and a negative v wind is from the north.
    'v-component_of_wind_height_above_ground'
]);

var list_properties = MODIS_006_MOD13Q1_PROPERTIES
    .cat(MODIS_006_MYD13Q1_PROPERTIES)
    .cat(NOAA_CFSV2_FOR6H_LIST_PROPERTIES);

var all_properties = ee.List(list_properties)
    .cat(NOAA_CFSV2_FOR6H_FIRST_PROPERTIES)

function aggregate_features(fc) {
    fc = ee.FeatureCollection(ee.List(fc)).sort('time_start');

    var columns = fc.reduceColumns({
        reducer: ee.Reducer.toList().forEach(list_properties),
        selectors: list_properties
    });

    return columns.set('Geopotential_height_surface',
        // Should be the same across all feautures, but this avoids null.
        fc.aggregate_max('Geopotential_height_surface'))
}

function batch_features(fc) {

    fc = ee.FeatureCollection(fc)

    fc = fc.map(function(f){
        f = ee.Feature(f)
        var date = ee.Date(f.get('time_start'))
        return f.setMulti({
            'epoch_start': date.advance(-180, 'day').millis()
        })
    });

    // Max image request amount with four images per day.
    var _625days = ee.Number(54000000000);
    var _180days = ee.Number(15552000000);
    var range_count = _625days.subtract(_180days);
    var insigificant_geometry = ee.Geometry.Point([-109.5843781, 38.5784188]);

    var epoch_start = ee.Number(fc.aggregate_min('time_start'))

    var epoch_end = ee.Number(fc.aggregate_max('time_start'));

    var timespan = epoch_end.subtract(epoch_start);

    var ranges = timespan.divide(range_count).round();

    var epochs =
        ee.FeatureCollection(ee.List.sequence({
            start: epoch_start.subtract(1),
            step: range_count,
            count: ranges.add(1)
        }).map(function(i){
            i = ee.Number(i);
            return ee.Feature(insigificant_geometry, {
                'epoch_start': i,
                'epoch_end': i.add(range_count) // Seems to be a bug with ee.Filter.greaterThan
            })
        }))

    var combined = ee.Join.saveAll({
        matchesKey: 'joined'
    }).apply(
        epochs,
        fc,
        ee.Filter.and(
            ee.Filter.lessThan({
                leftField: 'epoch_start',
                rightField: 'time_start'
            }),
            ee.Filter.greaterThanOrEquals({
                leftField: 'epoch_end',
                rightField: 'time_start',
            })
        )
    );

    combined = ee.FeatureCollection(combined).filter(
        ee.Filter.notNull(['joined'])
    );

    return ee.List(combined.aggregate_array('joined'));
}

function accumulate_value_features(fc, ic) {

    fc = ee.FeatureCollection(fc);
    ic = ee.ImageCollection(ic);

    var regions = ic.getRegion({
        geometry: fc.geometry(),
        scale: 30
    });

    var labels = ee.List(regions.get(0)).slice(3);
    labels = labels.set(0, 'time_start')
    return regions.slice(1).map(function(r){
        r = ee.List(r);
        return ee.Feature(
            ee.Geometry.Point([r.get(1), r.get(2)]),
            ee.Dictionary.fromLists(labels, r.slice(3))
        )
    })

}

var join_filter = ee.Filter.and(
    ee.Filter.withinDistance({
        distance: 30,
        leftField: '.geo',
        rightField: '.geo',
        maxError: 10
    }),
    ee.Filter.lessThanOrEquals({
        leftField: 'epoch_start',
        rightField: 'time_start',
    }),
    ee.Filter.greaterThanOrEquals({
        leftField: 'time_end',
        rightField: 'time_start',
    })
)

var update_features = function(fc) {

    fc = ee.FeatureCollection(ee.List(fc));

    var start = ee.Date(fc.aggregate_min('epoch_start'));
    var end = ee.Date(fc.aggregate_max('time_start'));

    var image_collections = ee.List([
        MODIS_006_MOD13Q1
            .filterDate(start, end)
            .select(
                MODIS_006_LABELS,
                MODIS_006_MOD13Q1_PROPERTIES
            ),
        MODIS_006_MYD13Q1
            .filterDate(start, end)
            .select(
                MODIS_006_LABELS,
                MODIS_006_MYD13Q1_PROPERTIES
            ),
        NOAA_CFSV2_FOR6H
            .filterDate(start, end)
            .select(
                NOAA_CFSV2_FOR6H_LIST_PROPERTIES.cat(NOAA_CFSV2_FOR6H_FIRST_PROPERTIES)
            )
    ]);

    var value_features = image_collections.map(function(i){
        return accumulate_value_features(fc, i)
    }).flatten();

    var condensed = ee.Join.saveAll({
        matchesKey: 'value_features'
    }).apply(
        fc,
        ee.FeatureCollection(value_features),
        join_filter
    ).filter(
        ee.Filter.notNull(['value_features'])
    );

    return condensed.map(function(feature){
        // feature = ee.Feature(feature);
        // var columns = ee.Dictionary(
        //   aggregate_features(
        //     feature.get('value_features')
        //   )
        // );
        return ee.Feature(feature).setMulti(
            aggregate_features(
                feature.get('value_features')
            )
        );
        // feature = feature.setMulti({
        //   'value_features': null
        // });
        // feature = ee.Feature(feature).select(all_properties);
        // return ee.List(res).add(feature);
    }).toList(condensed.size().add(1))

}

function fetch(fc) {
    var batches = ee.List(
        batch_features(fc)
    )

    var res = ee.FeatureCollection(
        batches.map(update_features).flatten()
    )

    return res.select(all_properties)
}

exports.fetch = function(fc) {
    return fetch(fc)
}

// var cutset_geometry = ee.Geometry.Rectangle({
//   coords: [-145.1767463, 24.5465169,-49.0, 59.5747563],
//   geodesic: false,
//   });

// var features = occurrences
// .filterDate('2002', '2019')
// .sort('time_start')
// .filterBounds(cutset_geometry).limit(30);

// print(fetch(features))