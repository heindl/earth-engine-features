// var GeoJSON = require('geojson');
var _ = require('lodash');
var jsonfile = require('jsonfile');
var moment = require('moment');
var math = require('mathjs');


function printDates(features) {

    var dates = {};

    _.each(features, function(feature){
        var ts = feature.properties.time_start;
        var key = moment(ts).format('YYYY-MM');
        if (!(dates.hasOwnProperty(key))) {
            dates[key] = 0
        }
        dates[key] += 1;
    });

    _.each(_.keys(dates).sort(), function(s) {
        console.log(s, dates[s])
    })
}

function printGeoJSON(features) {

    console.log("Feature Count", features.length);
    printDates(features);

    features = _.map(features, function(feature){
        var ts = feature.properties.time_start;
        feature.properties = {
            'date': moment(ts).format('YYYY-MM-DD')
        };
        return feature
    });

    // var gj = GeoJSON.parse(features);



    console.log(JSON.stringify({"type": "FeatureCollection", "features": features}));

}

function properties(feature) {

    var props = feature.properties;

    var obj = {
        'aspect': props['CGIAR/SRTM90_V4']['aspect'],
        'elevation': props['CGIAR/SRTM90_V4']['elevation'],
        'slope': props['CGIAR/SRTM90_V4']['slope'],
        'landcover': props['ESA/GLOBCOVER_L4_200901_200912_V2_3']['landcover'],
        'days_since_last_fire': props['FIRMS']['time_since'],
        'surface_water_percentage_at_intervals': [
            props['JRC/GSW1_0/MonthlyHistory']['120'],
            props['JRC/GSW1_0/MonthlyHistory']['480'],
            props['JRC/GSW1_0/MonthlyHistory']['1920'],
            props['JRC/GSW1_0/MonthlyHistory']['7680'],
            props['JRC/GSW1_0/MonthlyHistory']['15360'],
            props['JRC/GSW1_0/MonthlyHistory']['30720']
        ],
        'surface_water_distance': props['JRC/GSW1_0/MonthlyHistory']['distance'],

        // TODO: Note that these four are responsible for 40 missing morel values. Perhaps one could be removed.

        // Todo: Maybe only top ten. Need to figure out the minimum server update time.
        // 11 minimum, 12 max over six months. Depends on where the occurrence falls in the cycle.
        'terra_normalized_vegetation_indices': props['MODIS/006/MOD13Q1']['NDVI'],
        'terra_enhanced_vegetation_indices': props['MODIS/006/MOD13Q1']['EVI'],
        'terra_red_surface_reflectance': props['MODIS/006/MOD13Q1']['sur_refl_b01'],
        'terra_nir_surface_reflectance': props['MODIS/006/MOD13Q1']['sur_refl_b02'],
        'terra_blue_surface_reflectance': props['MODIS/006/MOD13Q1']['sur_refl_b03'],
        'terra_mir_surface_reflectance': props['MODIS/006/MOD13Q1']['sur_refl_b07'],

        // 11 minimum, 12 max over six months. Depends on where the occurrence falls in the cycle.
        'aqua_normalized_vegetation_indices': props['MODIS/006/MYD13Q1']['NDVI'],
        'aqua_enhanced_vegetation_indices': props['MODIS/006/MYD13Q1']['EVI'],
        'aqua_red_surface_reflectance': props['MODIS/006/MYD13Q1']['sur_refl_b01'],
        'aqua_nir_surface_reflectance': props['MODIS/006/MYD13Q1']['sur_refl_b02'],
        'aqua_blue_surface_reflectance': props['MODIS/006/MYD13Q1']['sur_refl_b03'],
        'aqua_mir_surface_reflectance': props['MODIS/006/MYD13Q1']['sur_refl_b07'],

        // These are questionable. Based on modis, but not available as often.
        // 'fraction_of_photosynthetically_active_radiation': props['MODIS/006/MCD15A3H']['Fpar'],
        // 'leaf_area_index': props['MODIS/006/MCD15A3H']['Lai']
    };

    [
        'Downward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
        'Downward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
        'Geopotential_height_surface',
        'Latent_heat_net_flux_surface_6_Hour_Average',
        'Maximum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
        'Maximum_temperature_height_above_ground_6_Hour_Interval',
        'Minimum_specific_humidity_at_2m_height_above_ground_6_Hour_Interval',
        'Minimum_temperature_height_above_ground_6_Hour_Interval',
        'Precipitation_rate_surface_6_Hour_Average',
        'Pressure_surface',
        'Sensible_heat_net_flux_surface_6_Hour_Average',
        'Specific_humidity_height_above_ground',
        'Temperature_height_above_ground',
        'Upward_Long-Wave_Radp_Flux_surface_6_Hour_Average',
        'Upward_Short-Wave_Radiation_Flux_surface_6_Hour_Average',
        'u-component_of_wind_height_above_ground',
        'v-component_of_wind_height_above_ground'
    ].forEach(function(k){
        var a = props['NOAA/CFSV2/FOR6H'][k];
        // console.log(a.length)
        obj[k] = (a.length === 720) ? a : null;
    });

    return obj

}

var parse = new Promise(function(resolve, reject) {

    var m = {};

    jsonfile.readFile('/Users/m/Desktop/morels.geojson', function(err, obj) {
        if (err) {
            return reject(err);
        }

        // printFeatures(_.filter(obj.features, function(feature){
        //     return _.isNull(feature['properties']['MODIS/006/MYD13Q1']['EVI']);
        // //     return _.isNull(feature['properties']['CGIAR/SRTM90_V4']['elevation']);
        // }));

        var valid = 0;
        var total = 0

        _.each(obj.features, function(feature) {
            var props = properties(feature);
            a = [];
            _.forIn(props, function(v, k){
                a.push(_.isNull(v) ? 0 : 1)
            });
            if (math.sum(a) === a.length) {
                valid += 1
            }
            total += 1
            console.log(JSON.stringify(a))
        })

        console.log(total, valid)

        return



        return resolve(m)
    });
});

function summarize(ob) {
    _.each(obj.features, function(feature){

        _.forIn(feature.properties, function(fields, dataset) {

            if (!_.isObject(fields)) {
                return
            }

            if (!(m.hasOwnProperty(dataset))) {
                m[dataset] = {};
            }

            _.forIn(fields, function(v, field){

                if (!_.has(m, [dataset, field])) {
                    m[dataset][field] = {};
                }

                if (_.isNull(v)) {

                    if (!_.has(m, [dataset, field, 'null'])) {
                        m[dataset][field]['null'] = 0;
                    }
                    m[dataset][field]['null'] += 1;
                    return
                }

                if (_.isArray(v)) {
                    var le = v.length.toString();
                    if (!_.has(m, [dataset, field, le])) {
                        m[dataset][field][le] = 0;
                    }
                    m[dataset][field][le] += 1;
                    return
                }

                if (!_.has(m, [dataset, field, 'value'])) {
                    m[dataset][field]['value'] = 0;
                }
                m[dataset][field]['value'] += 1;
            })
        })
    });
}

parse.then(function(res){
    console.log(res)
}).catch(function(err){
    console.log(err)
});





