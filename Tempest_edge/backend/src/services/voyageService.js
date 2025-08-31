const WeatherService = require('./weatherService.js');
const { getDistance } = require('geolib');
const { routes } = require('../constants/routes.js');
const { DateTime } = require('luxon');

// This function is the core of the voyage calculation logic.
// It simulates the impact of weather and currents on a vessel's speed
// over each segment of a given route.
const calculateSpeedOverGround = (stw, windSpeed, windDirection, currentSpeed, currentDirection) => {
    // A simplified physical model for a vessel.
    // In a real-world scenario, this would be far more complex,
    // involving hull resistance curves, propeller efficiency, etc.
    // Here, we model wind and current as vectors affecting speed.

    const stwVector = { x: 0, y: stw };
    const windEffect = windSpeed * 0.1; // Simplified wind effect (10% of wind speed)
    const currentEffect = currentSpeed;

    // Calculate components based on direction (assuming a vector-based model)
    const windVector = {
        x: windEffect * Math.sin(windDirection * Math.PI / 180),
        y: windEffect * Math.cos(windDirection * Math.PI / 180)
    };
    const currentVector = {
        x: currentEffect * Math.sin(currentDirection * Math.PI / 180),
        y: currentEffect * Math.cos(currentDirection * Math.PI / 180)
    };

    // Sum the vectors to get the total velocity vector
    const totalVector = {
        x: stwVector.x + windVector.x + currentVector.x,
        y: stwVector.y + windVector.y + currentVector.y
    };

    const sog = Math.sqrt(totalVector.x ** 2 + totalVector.y ** 2);
    return sog > 0 ? sog : 0.1; // Ensure speed is not zero to avoid division by zero errors.
};

// Calculates the vessel's fuel consumption for a given leg.
const calculateFuelConsumption = (sog, stw, vesselConfig) => {
    // A simplified fuel consumption model based on speed.
    // Fuel consumption increases with speed and resistance.
    // Resistance is higher when SOG is less than STW.
    const baseConsumption = vesselConfig.fuelConsumptionPerDay;
    const speedFactor = stw / vesselConfig.serviceSpeed;
    const resistanceFactor = stw / sog; // SOG below STW means more resistance.

    return baseConsumption * speedFactor * resistanceFactor;
};

// Orchestrates the entire voyage calculation.
exports.calculateVoyage = async (routeId, stw, laycanStart, laycanEnd) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) {
        throw new Error('Route not found.');
    }

    let totalTimeHours = 0;
    let totalFuelConsumption = 0;
    let totalDistanceNm = 0;
    const voyageDetails = [];
    const vesselConfig = {
        fuelConsumptionPerDay: 40, // Example: 40 metric tons per day
        serviceSpeed: 12.5 // knots
    };
    const fuelPrice = 580; // USD per ton VLSFO
    const portCharges = 25000; // USD
    const canalDues = route.type === 'Canal' ? 150000 : 0; // USD for Suez

    for (let i = 0; i < route.waypoints.length - 1; i++) {
        const startPoint = route.waypoints[i];
        const endPoint = route.waypoints[i + 1];

        // Fetch weather data for the midpoint of the leg
        const midPoint = {
            latitude: (startPoint[0] + endPoint[0]) / 2,
            longitude: (startPoint[1] + endPoint[1]) / 2,
        };
        const weather = await WeatherService.getWeatherData(midPoint.latitude, midPoint.longitude);

        // Calculate distance in nautical miles
        const distanceKm = getDistance({ latitude: startPoint[0], longitude: startPoint[1] }, { latitude: endPoint[0], longitude: endPoint[1] });
        const distanceNm = distanceKm * 0.539957;

        // Calculate SOG and time for the leg
        const sog = calculateSpeedOverGround(
            stw,
            weather.windSpeed,
            weather.windDirection,
            weather.currentSpeed,
            weather.currentDirection
        );
        const timeHours = distanceNm / sog;
        const fuelConsumed = calculateFuelConsumption(sog, stw, vesselConfig) * (timeHours / 24);

        totalTimeHours += timeHours;
        totalFuelConsumption += fuelConsumed;
        totalDistanceNm += distanceNm;

        voyageDetails.push({
            leg: i + 1,
            distance: distanceNm.toFixed(2),
            sog: sog.toFixed(2),
            timeHours: timeHours,
            fuelConsumed: fuelConsumed,
            weatherConditions: {
                windSpeed: weather.windSpeed.toFixed(1),
                waveHeight: weather.waveHeight.toFixed(1),
            },
        });
    }

    const totalCost = (totalFuelConsumption * fuelPrice) + portCharges + canalDues;
    const eta = DateTime.now().plus({ hours: totalTimeHours });
    const laycanMet = eta >= DateTime.fromISO(laycanStart) && eta <= DateTime.fromISO(laycanEnd);
    const laycanStatus = laycanMet ? 'On Time' : `High risk of missing laycan by ~${Math.abs(eta.diff(DateTime.fromISO(laycanEnd), 'hours').hours).toFixed(1)} hours`;

    return {
        routeId,
        totalDistanceNm: totalDistanceNm.toFixed(2),
        totalTimeHours: totalTimeHours,
        totalFuelConsumption: totalFuelConsumption.toFixed(2),
        totalCost: totalCost.toFixed(2),
        eta: eta.toISO(),
        laycanStatus,
        voyageDetails,
        avgSpeed: (totalDistanceNm / totalTimeHours).toFixed(2)
    };
};
