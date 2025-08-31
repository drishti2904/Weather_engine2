const WeatherService = require('./weatherService.js');
const { getDistance } = require('geolib');
const { routes } = require('../constants/routes.js');
const { DateTime } = require('luxon');

const calculateSpeedOverGround = (stw, windSpeed, windDirection, currentSpeed, currentDirection) => {
    // This is a simplified model. A real-world model would use complex hydrodynamics.
    // Here, we'll model wind and current as vectors affecting speed.
    // The direction of the vessel is assumed to be the direction of the waypoint.

    const stwVector = { x: 0, y: stw };
    const windEffect = windSpeed * 0.1; // Simplified wind effect (10% of wind speed)
    const currentEffect = currentSpeed;

    // Calculate components based on direction
    const windVector = {
        x: windEffect * Math.sin(windDirection * Math.PI / 180),
        y: windEffect * Math.cos(windDirection * Math.PI / 180)
    };
    const currentVector = {
        x: currentEffect * Math.sin(currentDirection * Math.PI / 180),
        y: currentEffect * Math.cos(currentDirection * Math.PI / 180)
    };

    // Sum the vectors
    const totalVector = {
        x: stwVector.x + windVector.x + currentVector.x,
        y: stwVector.y + windVector.y + currentVector.y
    };

    const sog = Math.sqrt(totalVector.x ** 2 + totalVector.y ** 2);
    return sog > 0 ? sog : 0.1; // Ensure speed is not zero
};

const calculateFuelConsumption = (sog, stw, vesselConfig) => {
    // A simplified fuel consumption model based on speed.
    // Higher STW and lower SOG (due to resistance) will increase consumption.
    const baseConsumption = vesselConfig.fuelConsumptionPerDay;
    const speedFactor = stw / vesselConfig.serviceSpeed;
    const resistanceFactor = stw / sog; // SOG below STW means more resistance

    return baseConsumption * speedFactor * resistanceFactor;
};

exports.calculateVoyage = async (routeId, stw, laycanStart, laycanEnd) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) {
        throw new Error('Route not found.');
    }

    let totalTimeHours = 0;
    let totalFuelConsumption = 0;
    const voyageDetails = [];
    const vesselConfig = {
        fuelConsumptionPerDay: 40, // Example: 40 metric tons per day
        serviceSpeed: 12.5 // knots
    };

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

        voyageDetails.push({
            leg: i + 1,
            distance: distanceNm.toFixed(2),
            sog: sog.toFixed(2),
            timeHours: timeHours.toFixed(2),
            fuelConsumed: fuelConsumed.toFixed(2),
            weatherConditions: {
                windSpeed: weather.windSpeed.toFixed(1),
                waveHeight: weather.waveHeight.toFixed(1),
            },
        });
    }

    const eta = DateTime.now().plus({ hours: totalTimeHours });
    const laycanMet = eta >= DateTime.fromISO(laycanStart) && eta <= DateTime.fromISO(laycanEnd);
    const laycanStatus = laycanMet ? 'On Time' : `High risk of missing laycan by ~${Math.abs(eta.diff(DateTime.fromISO(laycanStart), 'hours').hours).toFixed(1)} hours`;

    return {
        routeId,
        totalDistanceNm: voyageDetails.reduce((sum, leg) => sum + parseFloat(leg.distance), 0).toFixed(2),
        totalTimeHours: totalTimeHours.toFixed(2),
        totalFuelConsumption: totalFuelConsumption.toFixed(2),
        eta: eta.toISO(),
        laycanStatus,
        voyageDetails,
    };
};