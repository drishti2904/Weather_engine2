const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set up CORS based on environment. In production, the front-end and back-end will be on the same domain,
// so a simple CORS configuration is sufficient. For development, we allow the specific localhost port.
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN 
        : 'http://localhost:5173', // Your front-end development server URL
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React build directory in production
// This is the most important change for a full-stack deployment on Render.
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));
}

// Route data (from your provided coordinates)
const ROUTES = {
  1: {
    id: '1',
    name: 'Gopalpur to New Harbour',
    origin: 'Gopalpur',
    destination: 'New Harbour',
    waypoints: [
      [30.213982, 32.557983], [30.318359, 32.382202], [30.945814, 32.306671],
      [31.298117, 32.387159], [31.7, 32.1], [32.316071, 30.408377],
      [32.863395, 28.905525], [33.115811, 28.212434], [33.219565, 27.927542],
      [33.328, 27.6298], [33.748752, 26.306431], [34.011915, 25.478721],
      [34.187436, 24.926664], [34.8, 23.0], [35.126694, 21.407365],
      [35.845726, 17.902084], [36.086854, 16.726588], [36.4, 15.2],
      [36.907095, 13.263819], [37.209117, 12.110644], [37.212689, 12.097004],
      [37.215493, 12.086301], [37.283186, 11.827836], [37.454891, 11.172235],
      [37.5, 11.0], [37.489085, 10.372293], [37.4851, 10.1431],
      [37.4, 7.5], [37.2, 3.1], [36.666667, -0.366667],
      [36.473171, -1.62439], [36.377724, -2.244793], [36.324512, -2.590675],
      [36.220888, -3.264225], [36.158352, -3.670714], [36.156455, -3.683043],
      [36.0, -4.7], [35.97289, -5.269383], [35.968819, -5.354867],
      [35.95, -5.75], [36.31906, -7.26966], [36.549727, -8.219465],
      [36.8, -9.25], [36.83741, -9.36445], [37.324914, -10.855872],
      [37.417342, -11.138637], [37.717697, -12.057515], [38.272734, -13.755544],
      [38.5182, -14.5065], [40.0, -20.0], [41.125083, -25.565029],
      [41.1999, -25.9351], [41.584862, -28.584901], [41.790603, -30.001074],
      [42.072366, -31.940532], [42.0901, -32.0626], [42.340269, -34.863425],
      [42.592324, -37.685353], [42.6501, -38.3322], [42.706999, -40.001623],
      [42.796183, -42.618304], [42.8665, -44.6814], [42.807466, -47.493255],
      [42.754804, -50.001652], [42.733, -51.0402], [42.618612, -52.53975],
      [42.613022, -52.613022], [42.2526, -57.3379], [41.53046, -62.794754],
      [41.4359, -63.5093], [41.222837, -64.632986], [40.435954, -68.782982],
      [40.430133, -68.813685], [40.413733, -68.900173], [40.412386, -68.907278],
      [40.311722, -69.43818], [40.3, -69.5], [40.419295, -71.289425],
      [40.437172, -71.557579], [40.453237, -71.798554], [40.535177, -73.027658],
      [40.6, -74.0], [40.6061, -74.0456], [40.6285, -74.0561],
      [40.6676, -74.0488], [40.7081, -73.9779]
    ]
  },
  2: {
    id: '2',
    name: 'Rotterdam to Singapore',
    origin: 'Rotterdam',
    destination: 'Singapore',
    waypoints: [
      [51.9244, 4.4777], [29.7, 32.6], [27.9, 33.75],
      [27.0, 34.5], [23.6, 37.0], [20.75, 38.9],
      [16.3, 41.2], [15.0, 42.0], [12.7, 43.3],
      [12.40439, 43.746586], [12.0, 45.0], [13.0, 51.0],
      [12.577758, 53.059021], [12.2395, 54.7085], [11.4317, 58.3951],
      [11.083455, 59.894005], [10.866984, 60.825733], [10.5802, 62.0601],
      [10.031585, 64.303249], [9.934828, 64.698862], [9.862937, 64.992809],
      [9.6889, 65.7044], [8.881605, 68.858995], [8.7613, 69.3291],
      [8.6701, 69.671733], [8.582747, 69.999915], [8.365148, 70.817426],
      [8.356493, 70.84994], [7.8014, 72.9354], [6.966807, 75.966807],
      [6.8131, 76.5251], [5.8, 80.1], [5.9, 81.9],
      [6.1983, 85.9479], [6.4664, 90.0], [6.7, 94.0],
      [7.0, 97.0], [3.2, 100.6], [2.0, 102.0], [1.1, 103.6]
    ]
  }
};

// In-memory cache for weather data
let weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Utility functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065; // Nautical miles radius of Earth
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

const calculateSOG = (stw, currentSpeed, currentDirection, courseDirection) => {
  const angleDiff = (currentDirection - courseDirection) * Math.PI / 180;
  const currentComponent = currentSpeed * Math.cos(angleDiff);
  return stw + currentComponent;
};

const calculateFuelConsumption = (baseConsumption, actualSpeed, serviceSpeed, weatherFactor = 1.0) => {
  const speedRatio = actualSpeed / serviceSpeed;
  return baseConsumption * Math.pow(speedRatio, 3) * weatherFactor;
};

const calculateWeatherResistance = (windSpeed, waveHeight) => {
  const windResistance = 0.5 * Math.pow(Math.min(windSpeed, 40) / 25, 2);
  const waveResistance = 0.3 * Math.pow(Math.min(waveHeight, 8) / 4, 1.5);
  return 1.0 + windResistance + waveResistance;
};

// Weather service functions
const getWeatherData = async (lat, lon) => {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cachedData = weatherCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const weatherUrl = `${process.env.OPENWEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    console.log('Fetching weather from:', weatherUrl.replace(process.env.OPENWEATHER_API_KEY, 'API_KEY'));
    
    const response = await axios.get(weatherUrl, {
      timeout: 10000
    });
    
    const data = response.data;
    const weatherData = {
      latitude: lat,
      longitude: lon,
      timestamp: new Date(),
      windSpeed: data.wind?.speed ? (data.wind.speed * 1.94384) : Math.random() * 10 + 5, // Convert m/s to knots
      windDirection: data.wind?.deg || Math.random() * 360,
      waveHeight: Math.random() * 3 + 1, // Simulated - OpenWeather doesn't provide wave data
      swellDirection: (data.wind?.deg + 90) % 360 || Math.random() * 360,
      currentSpeed: Math.random() * 2, // Simulated current speed in knots
      currentDirection: Math.random() * 360,
      visibility: data.visibility ? (data.visibility / 1852) : 10,
      temperature: data.main?.temp || 20,
      pressure: data.main?.pressure || 1013,
      humidity: data.main?.humidity || 50,
      description: data.weather?.[0]?.description || 'Clear'
    };

    // Cache the data
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;
  } catch (error) {
    console.error('Weather API error:', error.message);
    // Return simulated weather data if API fails
    const simulatedData = {
      latitude: lat,
      longitude: lon,
      timestamp: new Date(),
      windSpeed: Math.random() * 15 + 5,
      windDirection: Math.random() * 360,
      waveHeight: Math.random() * 3 + 1,
      swellDirection: Math.random() * 360,
      currentSpeed: Math.random() * 2,
      currentDirection: Math.random() * 360,
      visibility: 10,
      temperature: 20 + Math.random() * 15,
      pressure: 1013 + Math.random() * 20 - 10,
      humidity: 50 + Math.random() * 30,
      description: 'Simulated data'
    };

    // Cache simulated data too
    weatherCache.set(cacheKey, {
      data: simulatedData,
      timestamp: Date.now()
    });

    return simulatedData;
  }
};

const getGeminiInsights = async (weatherData, routeData, voyageAnalysis) => {
  if (!process.env.GEMINI_API_KEY) {
    // Return structured dummy data if API key is not available
    return [
      {
        mainPoint: "AI recommendations are temporarily unavailable.",
        subPoints: [
          "Please ensure your Gemini API key is configured correctly.",
          "Consider monitoring weather conditions and optimizing speed manually."
        ]
      }
    ];
  }

  try {
    const avgWind = voyageAnalysis?.weatherImpact?.averageWindSpeed || 10;
    const avgWave = voyageAnalysis?.weatherImpact?.averageWaveHeight || 2;
    const totalFuel = voyageAnalysis?.performance?.totalFuel || 100;
    const laycanStatus = voyageAnalysis?.laycanCompliance?.status || 'COMPLIANT';
    const laycanRisk = voyageAnalysis?.laycanCompliance?.riskHours || 0;
    const totalDuration = voyageAnalysis?.performance?.totalDuration || 0;
    const estimatedCost = voyageAnalysis?.performance?.estimatedCost || 0;

    const prompt = `As a world-class maritime routing specialist, analyze the provided voyage data and provide a list of actionable, crisp insights for a vessel operator. The output must be a single JSON array of objects, where each object has a 'mainPoint' string and a 'subPoints' array of strings.

Voyage Details:
Route: ${routeData.name}
Distance: ${routeData.totalDistance} nautical miles
ETA: ${new Date(voyageAnalysis.performance.eta).toLocaleString()}
Laycan Window: ${new Date(voyageAnalysis.laycanCompliance.laycanWindow.start).toLocaleDateString()} to ${new Date(voyageAnalysis.laycanCompliance.laycanWindow.end).toLocaleDateString()}
Laycan Status: ${laycanStatus} (${laycanRisk} hours)
Average Weather: Wind ${avgWind} knots, Waves ${avgWave} meters
Total Fuel: ${totalFuel.toFixed(2)} tons
Estimated Cost: $${estimatedCost.toLocaleString()}

Provide insights on the following topics, making the points as precise and actionable as possible:
1. Laycan Compliance & ETA: Give a clear, direct summary of the laycan status and potential risks or buffers.
2. Speed Optimization: Suggest specific speed adjustments (e.g., increase or decrease) to balance time, cost, and contract obligations. Include the impact on fuel and cost.
3. Route Analysis: Discuss the weather's impact on the route and, for comparison, briefly mention how an alternative route (like Cape vs. Suez) might be affected under similar conditions.
4. Voyage Cost & Efficiency: Show the best balance of time, cost, and laycan compliance, and offer recommendations for improving fuel efficiency.

Example output format for a late arrival:
[
  {
    "mainPoint": "ETA and Laycan Compliance",
    "subPoints": ["ETA: ${new Date(voyageAnalysis.performance.eta).toLocaleString()}.", "Current forecast indicates high risk of missing laycan by ~${laycanRisk} hours if speed is not adjusted."]
  },
  {
    "mainPoint": "Speed Adjustments",
    "subPoints": ["Increase speed to 13 kn during the first leg to recover time.", "Alternative: slowing down to 11.5 kn saves 28 t VLSFO ($16k) but delays ETA by 0.8 days."]
  },
  {
    "mainPoint": "Route & Cost Analysis",
    "subPoints": ["The current route is impacted by high winds. A slight deviation could recover 2-4 hours.", "Suez Canal dues add to the total cost. A Cape of Good Hope route, while longer, could save on fuel and avoid these fees, but would likely increase transit time."]
  }
]
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const response = await axios.post(
      `${process.env.GEMINI_API_URL}/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      }
    );

    const insightsText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!insightsText) {
      throw new Error("API response was empty.");
    }

    // Attempt to parse the JSON string
    try {
      return JSON.parse(insightsText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', parseError);
      // Fallback to a simple message if parsing fails
      return [
        {
          mainPoint: "AI analysis is not available at this moment.",
          subPoints: ["Received an invalid response from the AI model."]
        }
      ];
    }

  } catch (error) {
    console.error('Gemini AI error:', error.message);
    return [
      {
        mainPoint: "AI recommendations temporarily unavailable.",
        subPoints: ["Failed to connect to the AI service. Please try again later."]
      }
    ];
  }
};

// Middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routes: Object.keys(ROUTES).length,
    weatherCacheSize: weatherCache.size
  });
});

// Get all available routes
app.get('/api/routes', (req, res) => {
  try {
    const routeList = Object.values(ROUTES).map(route => ({
      id: route.id,
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      waypointCount: route.waypoints.length
    }));
    res.json(routeList);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get specific route with waypoints
app.get('/api/routes/:routeId', (req, res) => {
  try {
    const route = ROUTES[req.params.routeId];
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < route.waypoints.length - 1; i++) {
      const [lat1, lon1] = route.waypoints[i];
      const [lat2, lon2] = route.waypoints[i + 1];
      totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
    }
    
    res.json({
      ...route,
      totalDistance: Math.round(totalDistance),
      estimatedDuration: Math.round(totalDistance / 12) // Assuming 12 knots average speed
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route details' });
  }
});

// Get weather data for a specific route
app.get('/api/weather/route/:routeId', async (req, res) => {
  try {
    const route = ROUTES[req.params.routeId];
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Sample every 5th waypoint to avoid too many API calls
    const sampledWaypoints = route.waypoints.filter((_, index) => index % 5 === 0).slice(0, 12);
    
    console.log(`Fetching weather for ${sampledWaypoints.length} waypoints on route ${req.params.routeId}`);
    
    const weatherPromises = sampledWaypoints.map(([lat, lon]) => 
      getWeatherData(lat, lon)
    );
    
    const weatherData = await Promise.allSettled(weatherPromises);
    
    const successfulData = weatherData
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulData.length === 0) {
      throw new Error('No weather data could be retrieved');
    }

    console.log(`Successfully retrieved weather for ${successfulData.length} points`);
    res.json(successfulData);
    
  } catch (error) {
    console.error('Weather route error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data for route' });
  }
});

// Get weather data for specific coordinates
app.get('/api/weather/point/:lat/:lon', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lon = parseFloat(req.params.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const weatherData = await getWeatherData(lat, lon);
    res.json(weatherData);
  } catch (error) {
    console.error('Weather point error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Analyze voyage impact
app.post('/api/voyage/analyze', async (req, res) => {
  try {
    const { routeId, vesselSpecs, laycanWindow } = req.body;
    
    console.log('Analyzing voyage for route:', routeId, 'with specs:', vesselSpecs);
    
    if (!routeId || !vesselSpecs) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const route = ROUTES[routeId];
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Default vessel specs if missing
    const specs = {
      serviceSpeed: 12,
      fuelConsumption: 45,
      fuelPrice: 650,
      vesselName: 'Unknown Vessel',
      ...vesselSpecs
    };
    
    // Get weather data for key waypoints (every 8th waypoint to balance accuracy and performance)
    const keyWaypoints = route.waypoints.filter((_, index) => index % 8 === 0).slice(0, 10);
    console.log(`Getting weather for ${keyWaypoints.length} key waypoints`);
    
    const weatherPromises = keyWaypoints.map(([lat, lon]) => 
      getWeatherData(lat, lon)
    );
    
    const weatherResults = await Promise.allSettled(weatherPromises);
    const weatherData = weatherResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    if (weatherData.length === 0) {
      console.warn('No weather data available, using default conditions');
      // Create default weather data
      weatherData.push({
        windSpeed: 10,
        waveHeight: 2,
        currentSpeed: 0.5,
        currentDirection: 180
      });
    }

    console.log(`Using ${weatherData.length} weather points for analysis`);
    
    // Calculate voyage analysis
    let totalDistance = 0;
    const legAnalysis = [];
    
    // Process route legs
    const maxLegs = Math.min(route.waypoints.length - 1, 50); // Limit processing for performance
    
    for (let i = 0; i < maxLegs; i++) {
      const [lat1, lon1] = route.waypoints[i];
      const [lat2, lon2] = route.waypoints[i + 1];
      const legDistance = calculateDistance(lat1, lon1, lat2, lon2);
      const bearing = calculateBearing(lat1, lon1, lat2, lon2);
      
      // Use weather data from nearest available point
      const weatherIndex = Math.floor((i / maxLegs) * weatherData.length);
      const weather = weatherData[Math.min(weatherIndex, weatherData.length - 1)];
      
      const weatherFactor = calculateWeatherResistance(weather.windSpeed || 10, weather.waveHeight || 2);
      const sog = calculateSOG(
        specs.serviceSpeed, 
        weather.currentSpeed || 0.5, 
        weather.currentDirection || 180, 
        bearing
      );
      
      const effectiveSOG = Math.max(sog, 1); // Minimum 1 knot
      const legDuration = legDistance / effectiveSOG; // hours
      
      const fuelConsumption = calculateFuelConsumption(
        specs.fuelConsumption,
        effectiveSOG,
        specs.serviceSpeed,
        weatherFactor
      );
      
      legAnalysis.push({
        legIndex: i,
        distance: Math.round(legDistance * 10) / 10,
        bearing: Math.round(bearing),
        stw: specs.serviceSpeed,
        sog: Math.round(effectiveSOG * 10) / 10,
        weatherFactor: Math.round(weatherFactor * 100) / 100,
        fuelConsumption: Math.round(fuelConsumption * 10) / 10,
        duration: Math.round(legDuration * 10) / 10,
        weather: {
          windSpeed: Math.round(weather.windSpeed || 10),
          waveHeight: Math.round((weather.waveHeight || 2) * 10) / 10,
          temperature: Math.round(weather.temperature || 20)
        }
      });
      
      totalDistance += legDistance;
    }
    
    // Calculate totals
    const totalDuration = legAnalysis.reduce((sum, leg) => sum + leg.duration, 0);
    const totalFuel = legAnalysis.reduce((sum, leg) => sum + (leg.fuelConsumption * leg.duration / 24), 0);
    const estimatedCost = totalFuel * specs.fuelPrice;
    
    // ETA calculation
    const currentDate = new Date();
    const eta = new Date(currentDate.getTime() + totalDuration * 60 * 60 * 1000);
    
    // Laycan analysis
    let laycanStatus = 'COMPLIANT';
    let laycanRisk = 0;
    
    if (laycanWindow && laycanWindow.start && laycanWindow.end) {
      const laycanStart = new Date(laycanWindow.start);
      const laycanEnd = new Date(laycanWindow.end);
      
      if (eta > laycanEnd) {
        laycanStatus = 'LATE';
        laycanRisk = Math.round((eta - laycanEnd) / (1000 * 60 * 60)); // Hours late
      } else if (eta < laycanStart) {
        laycanStatus = 'EARLY';
        laycanRisk = Math.round((laycanStart - eta) / (1000 * 60 * 60)); // Hours early
      }
    }
    
    // Calculate weather impact averages
    const avgWindSpeed = Math.round(weatherData.reduce((sum, w) => sum + (w.windSpeed || 10), 0) / weatherData.length);
    const avgWaveHeight = Math.round(weatherData.reduce((sum, w) => sum + (w.waveHeight || 2), 0) / weatherData.length * 10) / 10;
    const avgWeatherFactor = Math.round(legAnalysis.reduce((sum, leg) => sum + leg.weatherFactor, 0) / legAnalysis.length * 100) / 100;
    
    const analysis = {
      route: {
        ...route,
        totalDistance: Math.round(totalDistance)
      },
      performance: {
        totalDuration: Math.round(totalDuration),
        averageSOG: Math.round((totalDistance / totalDuration) * 10) / 10,
        totalFuel: Math.round(totalFuel * 10) / 10,
        estimatedCost: Math.round(estimatedCost),
        eta: eta.toISOString()
      },
      laycanCompliance: {
        status: laycanStatus,
        eta: eta.toISOString(),
        riskHours: laycanRisk,
        laycanWindow: laycanWindow
      },
      weatherImpact: {
        averageWindSpeed: avgWindSpeed,
        averageWaveHeight: avgWaveHeight,
        weatherFactor: avgWeatherFactor
      },
      legAnalysis: legAnalysis.slice(0, 20), // Limit response size
      optimizationSuggestions: [
        {
          type: 'SPEED_ADJUSTMENT',
          description: totalFuel > specs.fuelConsumption * totalDuration / 24 * 1.2 
            ? `Consider reducing speed to ${specs.serviceSpeed - 1} knots to save fuel in adverse weather`
            : 'Current speed appears optimal for conditions',
          impact: totalFuel > specs.fuelConsumption * totalDuration / 24 * 1.2 
            ? 'Potential fuel savings: 15-25%' 
            : 'Maintaining current efficiency'
        },
        {
          type: 'WEATHER_ROUTING',
          description: avgWindSpeed > 20
            ? 'High winds detected - consider slight route deviation if possible'
            : 'Weather conditions favorable for current route',
          impact: laycanStatus === 'LATE' ? 'Could recover 2-4 hours' : 'Maintain schedule reliability'
        }
      ]
    };
    
    // Get AI insights and wait for them to be returned
    const insights = await getGeminiInsights(weatherData[0], route, analysis);
    analysis.aiInsights = insights;

    console.log('Voyage analysis completed successfully with AI insights');
    res.json(analysis);
    
  } catch (error) {
    console.error('Voyage analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze voyage', 
      details: error.message 
    });
  }
});

// Catch-all to serve the front-end for any unmatched routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'An unexpected error occurred.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});