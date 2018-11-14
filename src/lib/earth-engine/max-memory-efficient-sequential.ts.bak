

var MODIS_006_BANDS = ee.List([
    'NDVI',
    'EVI',
    'sur_refl_b01',
    'sur_refl_b02',
    'sur_refl_b03',
    'sur_refl_b07'
])

var image_collections = ee.Dictionary({
    'MODIS/006/MOD13Q1': ee.Dictionary({
        'collection': MODIS_006_MOD13Q1,
        'bands': MODIS_006_BANDS,
        'vector_labels': ee.List([
            'terra_normalized_vegetation_indices',
            'terra_enhanced_vegetation_indices',
            'terra_red_surface_reflectance',
            'terra_nir_surface_reflectance',
            'terra_blue_surface_reflectance',
            'terra_mir_surface_reflectance'
        ]),
    }),
    'MODIS/006/MYD13Q1': ee.Dictionary({
        'collection': MODIS_006_MYD13Q1,
        'bands': MODIS_006_BANDS,
        'vector_labels': ee.List([
            'aqua_normalized_vegetation_indices',
            'aqua_enhanced_vegetation_indices',
            'aqua_red_surface_reflectance',
            'aqua_nir_surface_reflectance',
            'aqua_blue_surface_reflectance',
            'aqua_mir_surface_reflectance'
        ]),
    }),
    'NOAA/CFSV2/FOR6H': ee.Dictionary({
        'collection': NOAA_CFSV2_FOR6H,
        'bands': ee.List([
            'Latent_heat_net_flux_surface_6_Hour_Average',
            'Sensible_heat_net_flux_surface_6_Hour_Average',
            'Temperature_height_above_ground',
            'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
            'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
            'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
            'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
            'Specific_humidity_height_above_ground',
            'Precipitation_rate_surface_6_Hour_Average',
            'Pressure_surface',
            'u-component_of_wind_height_above_ground',
            'v-component_of_wind_height_above_ground',
            'Geopotential_height_surface' // Note that the ordering is important here.
        ]),
        'index_labels': ee.List([
            // Geopotential height is a vertical coordinate
            // referenced to Earth's mean sea level, an adjustment
            // to geometric height (elevation above mean sea level)
            // using the variation of gravity with latitude and
            // elevation. Thus, it can be considered a
            // "gravity-adjusted height".
            // It should be the same for each day.
            'Geopotential_height_surface',
        ]),
        'vector_labels': ee.List([
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
        ])
    })
});


var cutset_geometry = ee.Geometry.Rectangle({
    coords: [-145.1767463, 24.5465169,-49.0, 59.5747563],
    geodesic: false,
});

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

    return ee.FeatureCollection(combined).filter(
        ee.Filter.notNull(['joined'])
    ).aggregate_array('joined');
}

function update_property(feature, band, mask) {
    feature = ee.Feature(feature);
    var v = ee.Algorithms.If(
        feature.get(band),
        ee.Array(feature.get(band)).mask(mask),
        null
    );
    return feature.set(band, v)
}

function update_vector_properties(feature, bands, mask) {
    feature = ee.Feature(feature);
    return ee.List(bands).iterate(function(band, f){
        return update_property(f, band, mask);
    }, feature)
}

function update_index_properties(feature, bands) {
    feature = ee.Feature(feature);
    return ee.List(bands).iterate(function(band, f){
        f = ee.Feature(f)
        return f.set(band, ee.Array(f.get(band)).get([0]))
    }, feature)
}

var update_features = function(fc) {

    fc = ee.FeatureCollection(ee.List(fc));

    var range = ee.DateRange(
        ee.Date(fc.aggregate_min('epoch_start')),
        ee.Date(fc.aggregate_max('time_start'))
    )

    var imgs = image_collections.map(function(k, v){
        k = ee.String(k);
        v = ee.Dictionary(v);
        var ic = ee.ImageCollection(
            v.get('collection')
        ).filterDate(
            range.start(),
            range.end()
        ).filterBounds(
            fc.geometry()
        ).select(
            v.get('bands'),
            ee.List(
                v.get('vector_labels')
            ).cat(
                ee.Algorithms.If(
                    v.contains('index_labels'),
                    v.get('index_labels'),
                    []
                )
            )
        );


        return ic.toArrayPerBand(0).set(
            ic.get('system:id'),
            ic.aggregate_array('system:time_start')
        ).clipToCollection(fc);

    });

    var img = imgs.values()
        .iterate(function(i, res){
            i = ee.Image(i);
            return ee.Image(res).addBands(i).copyProperties(i);
        }, ee.Image.constant(0))

    var timestamp_dictionary = ee.Image(img).toDictionary();

    return ee.Image(img).reduceRegions({
        reducer: ee.Reducer.first().forEachBand(img),
        collection: fc,
        scale: 30,
    })
        .map(function(f){
            f = ee.Feature(f);
            var date = ee.Number(f.get('time_start'));
            var epoch = ee.Number(f.get('epoch_start'));
            return timestamp_dictionary.keys().iterate(function(k, res){
                var timestamps = ee.Array(timestamp_dictionary.get(k));
                var collection_properties = ee.Dictionary(image_collections.get(k));
                res = update_vector_properties(
                    res,
                    collection_properties.get('vector_labels'),
                    timestamps.gte(epoch).and(timestamps.lte(date))
                )
                return update_index_properties(
                    res,
                    ee.Algorithms.If(
                        collection_properties.contains('index_labels'),
                        collection_properties.get('index_labels'),
                        []
                    )
                )
            }, f)
        });

}

function fetch(fc) {
    var batches = ee.List(
        batch_features(fc)
    )
    return ee.FeatureCollection(
        batches.map(update_features)
    ).flatten()
}

exports.fetch = function(fc) {
    return fetch(fc)
}

var features = occurrences
    .filterDate('2002', '2019')
    .sort('time_start')
    .filterBounds(cutset_geometry)
    .limit(20);

print(fetch(features))