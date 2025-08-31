const axios = require("axios");
const { OPENWEATHER_API_KEY } = process.env;

exports.getWeatherData = async (lat, lon) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error("Missing OpenWeather API Key");
        }

        // Build request directly with fixed URL
        const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
            params: {
                lat,
                lon,
                appid: OPENWEATHER_API_KEY,
                units: "metric"
            }
        });

        const data = response.data;

        // Mocking wave height and ocean current data
        const waveHeight = Math.random() * 3 + 1;  // meters
        const currentSpeed = Math.random() * 2 + 0.5; // knots
        const currentDirection = Math.random() * 360; // degrees

        return {
            temperature: data.main.temp,
            windSpeed: data.wind.speed * 1.94384, // m/s → knots
            windDirection: data.wind.deg,
            waveHeight,
            currentSpeed,
            currentDirection,
        };
    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        throw new Error("Failed to fetch weather data.");
    }
};
