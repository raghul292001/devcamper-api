const NodeGeocoder = require('node-geocoder');


const option = {
    provider: process.env.GEOCODER_PROVIDER,
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, APlace, Google Premier
    formatter: null // 'gpx', 'string', ...
}

const geocoder = NodeGeocoder(option);

module.exports = geocoder;