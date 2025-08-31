const WeatherService = require('../../services/weatherService.js');
const { apiResponse } = require('../../utils/apiResponse.js');

exports.getCurrentWeather = async (req, res, next) => {
    const { lat, lon } = req.query;
    try {
        if (!lat || !lon) {
            return apiResponse(res, 400, 'Latitude and Longitude are required.');
        }

        const weatherData = await WeatherService.getWeatherData(parseFloat(lat), parseFloat(lon));
        apiResponse(res, 200, 'Weather data fetched successfully.', weatherData);
    } catch (error) {
        next(error);
    }
};