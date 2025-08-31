import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { 
  Wind, 
  Waves, 
  Navigation, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Ship, 
  DollarSign,
  Calendar,
  Gauge,
  RefreshCw,
  Activity,
  BarChart3,
  Eye,
  Settings,
  Flame
} from 'lucide-react';

// Use this hook to provide consistent Tailwind styles and rounded corners
// across all charts. This is a common pattern to avoid code duplication.
const useChartStyling = () => {
  const chartProps = {
    className: "bg-gray-50 p-6 rounded-xl border border-gray-200"
  };
  return chartProps;
};



/////////////////////////////////////
const API_BASE = import.meta.env.VITE_API_BASE_URL;


const LaycanStatus = ({ status, eta, riskHours, laycanWindow }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLIANT': 
        return {
          color: 'bg-green-50 text-green-800 border-green-200',
          icon: '✅',
          bgGradient: 'from-green-400 to-green-500'
        };
      case 'LATE': 
        return {
          color: 'bg-red-50 text-red-800 border-red-200',
          icon: '⚠️',
          bgGradient: 'from-red-400 to-red-500'
        };
      case 'EARLY': 
        return {
          color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          icon: '⏰',
          bgGradient: 'from-yellow-400 to-yellow-500'
        };
      default: 
        return {
          color: 'bg-gray-50 text-gray-800 border-gray-200',
          icon: '❓',
          bgGradient: 'from-gray-400 to-gray-500'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-6 rounded-xl border-2 ${config.color} shadow-lg`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.bgGradient} flex items-center justify-center text-white font-bold`}>
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Laycan Compliance</h3>
          <p className="text-sm opacity-75">Contract deadline monitoring</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium opacity-75">Status</p>
          <p className="font-bold text-xl">{config.icon} {status}</p>
        </div>
        <div>
          <p className="text-sm font-medium opacity-75">Risk</p>
          <p className="font-bold text-xl">{riskHours}h {status === 'LATE' ? 'late' : status === 'EARLY' ? 'early' : 'buffer'}</p>
        </div>
        <div>
          <p className="text-sm font-medium opacity-75">ETA</p>
          <p className="font-semibold">{new Date(eta).toLocaleDateString()}</p>
          <p className="text-xs">{new Date(eta).toLocaleTimeString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium opacity-75">Window</p>
          {laycanWindow && (
            <>
              <p className="text-xs">{new Date(laycanWindow.start).toLocaleDateString()}</p>
              <p className="text-xs">to {new Date(laycanWindow.end).toLocaleDateString()}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, gradient, change }) => (
  <div className={`bg-gradient-to-r ${gradient} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}>
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-8 h-8 opacity-80" />
      {change && (
        <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-90">{unit}</p>
      <p className="text-xs font-medium opacity-75 mt-1">{title}</p>
    </div>
  </div>
);

const SpeedChart = ({ speedChartData }) => {
  const chartProps = useChartStyling();
  return (
    <div {...chartProps}>
      <h4 className="font-semibold text-gray-800 mb-4">Speed Over Ground (SOG) vs. Speed Through Water (STW)</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={speedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="leg" />
          <YAxis label={{ value: 'Speed (kn)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="STW" fill="#3b82f6" name="STW (Commanded)" />
          <Bar dataKey="SOG" fill="#14b8a6" name="SOG (Actual)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const WeatherChart = ({ weatherChartData }) => {
  const chartProps = useChartStyling();
  return (
    <div {...chartProps}>
      <h4 className="font-semibold text-gray-800 mb-4">Wind Speed & Wave Height Along Route</h4>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={weatherChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="waypoint" />
          <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Wind (kn)', angle: -90, position: 'insideLeft', offset: 10 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" label={{ value: 'Waves (m)', angle: 90, position: 'insideRight', offset: 10 }} />
          <Tooltip />
          <Legend />
          <defs>
            <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area yAxisId="left" type="monotone" dataKey="windSpeed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWind)" />
          <Area yAxisId="right" type="monotone" dataKey="waveHeight" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWave)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const FuelConsumptionChart = ({ fuelChartData }) => {
  const chartProps = useChartStyling();
  return (
    <div {...chartProps}>
      <h4 className="font-semibold text-gray-800 mb-4">Fuel Consumption Per Leg</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={fuelChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="leg" />
          <YAxis label={{ value: 'Fuel Burn (t)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value, name) => [`${value.toFixed(2)} t`, name]} />
          <Legend />
          <Line type="monotone" dataKey="fuelBurn" stroke="#ef4444" activeDot={{ r: 8 }} name="Total Fuel Burn" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// New component to render the structured insights
const InsightList = ({ insights }) => {
  if (!Array.isArray(insights)) {
    return <p className="text-gray-600 leading-relaxed">{insights}</p>;
  }

  return (
    <ul className="list-disc list-inside space-y-4 text-gray-700">
      {insights.map((insight, index) => (
        <li key={index}>
          <p className="font-semibold text-gray-800 mb-1">{insight.mainPoint}</p>
          {insight.subPoints && insight.subPoints.length > 0 && (
            <ul className="list-circle list-inside ml-4 space-y-1 text-gray-600">
              {insight.subPoints.map((subPoint, subIndex) => (
                <li key={subIndex}>{subPoint}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};


const MarineWeatherApp = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [weatherData, setWeatherData] = useState([]);
  const [voyageAnalysis, setVoyageAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Default vessel specifications
  const [vesselSpecs, setVesselSpecs] = useState({
    serviceSpeed: 12,
    fuelConsumption: 45,
    fuelPrice: 650,
    vesselName: 'MV Ocean Explorer'
  });
  
  // Laycan window - default to 7-10 days from now
  const [laycanWindow, setLaycanWindow] = useState(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });

  // Fetch available routes on component mount
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${API_BASE}/routes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoutes(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      setError('Failed to load routes. Please check your connection.');
    }
  };

  // Fetch route details and analyze voyage
  const selectRoute = async (routeId) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Selecting route:', routeId);
      
      // Get route details
      const routeResponse = await fetch(`${API_BASE}/routes/${routeId}`);
      if (!routeResponse.ok) {
        throw new Error(`Failed to fetch route: ${routeResponse.status}`);
      }
      const routeData = await routeResponse.json();
      setSelectedRoute(routeData);
      
      // Get weather data for route
      const weatherResponse = await fetch(`${API_BASE}/weather/route/${routeId}`);
      if (!weatherResponse.ok) {
        console.warn('Weather data fetch failed, continuing with analysis');
        setWeatherData([]);
      } else {
        const weatherData = await weatherResponse.json();
        setWeatherData(weatherData || []);
      }
      
      // Analyze voyage
      const analysisPayload = {
        routeId,
        vesselSpecs,
        laycanWindow
      };
      
      console.log('Analyzing voyage with payload:', analysisPayload);
      
      const analysisResponse = await fetch(`${API_BASE}/voyage/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(analysisPayload)
      });
      
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        throw new Error(`Analysis failed: ${analysisResponse.status} - ${errorText}`);
      }
      
      const analysisData = await analysisResponse.json();
      setVoyageAnalysis(analysisData);
      
      console.log('Route selection completed successfully');
      
    } catch (error) {
      console.error('Error selecting route:', error);
      setError(`Failed to analyze route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analysis when vessel specs or laycan changes
  const refreshAnalysis = () => {
    if (selectedRoute) {
      selectRoute(selectedRoute.id);
    }
  };

  // Weather visualization data
  const weatherChartData = weatherData.map((point, index) => ({
    waypoint: `WP${index + 1}`,
    windSpeed: Math.round(point.windSpeed || 0),
    waveHeight: Math.round((point.waveHeight || 0) * 10) / 10,
    temperature: Math.round(point.temperature || 20),
    visibility: Math.round((point.visibility || 10) * 10) / 10
  }));

  // Speed analysis data
  const speedChartData = voyageAnalysis?.legAnalysis?.slice(0, 15).map((leg, index) => ({
    leg: `L${index + 1}`,
    STW: leg.stw,
    SOG: leg.sog,
    difference: Math.round((leg.sog - leg.stw) * 10) / 10,
    weatherFactor: leg.weatherFactor
  })) || [];

  // Fuel consumption data
  const fuelChartData = voyageAnalysis?.legAnalysis?.slice(0, 10).map((leg, index) => ({
    leg: `Leg ${index + 1}`,
    fuelBurn: leg.fuelConsumption * leg.duration / 24, // Use a more accurate property name
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Ship className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Marine Weather Routing System</h1>
              <p className="text-gray-600">Intelligent voyage optimization with real-time weather analysis</p>
            </div>
          </div>
          
          {/* Vessel Configuration */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Vessel Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vessel Name</label>
                <input
                  type="text"
                  value={vesselSpecs.vesselName}
                  onChange={(e) => setVesselSpecs({...vesselSpecs, vesselName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vessel name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Speed (knots)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="0.5"
                  value={vesselSpecs.serviceSpeed}
                  onChange={(e) => setVesselSpecs({...vesselSpecs, serviceSpeed: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Consumption (tons/day)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  step="1"
                  value={vesselSpecs.fuelConsumption}
                  onChange={(e) => setVesselSpecs({...vesselSpecs, fuelConsumption: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Price ($/ton)</label>
                <input
                  type="number"
                  min="100"
                  max="2000"
                  step="10"
                  value={vesselSpecs.fuelPrice}
                  onChange={(e) => setVesselSpecs({...vesselSpecs, fuelPrice: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Laycan Window */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Laycan Window</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Laycan Start Date</label>
                <input
                  type="date"
                  value={laycanWindow.start}
                  onChange={(e) => setLaycanWindow({...laycanWindow, start: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Laycan End Date</label>
                <input
                  type="date"
                  value={laycanWindow.end}
                  onChange={(e) => setLaycanWindow({...laycanWindow, end: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Route Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Available Routes</h3>
              </div>
              {selectedRoute && (
                <button
                  onClick={refreshAnalysis}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Analysis
                </button>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => selectRoute(route.id)}
                  disabled={loading}
                  className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedRoute?.id === route.id ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      <Navigation className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{route.name}</h3>
                      <p className="text-sm text-gray-600">{route.origin} → {route.destination}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{route.waypointCount} waypoints</span>
                    {selectedRoute?.id === route.id && (
                      <span className="text-blue-600 font-medium">✓ Selected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Route & Weather</h3>
            <p className="text-gray-600">Fetching real-time weather data and calculating voyage optimization...</p>
          </div>
        )}

        {/* Main Content */}
        {selectedRoute && !loading && voyageAnalysis && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Voyage Summary for {selectedRoute.name}</h2>
              <p className="text-gray-600">Performance and impact analysis based on current forecast.</p>
            </div>
          
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Distance"
                value={voyageAnalysis.route.totalDistance?.toLocaleString() || 'N/A'}
                unit="nautical miles"
                icon={Navigation}
                gradient="from-blue-500 to-blue-600"
              />
              
              <StatCard
                title="Voyage Duration"
                value={Math.round(voyageAnalysis.performance.totalDuration || 0)}
                unit="hours"
                icon={Clock}
                gradient="from-blue-500 to-cyan-500"
              />
              
              <StatCard
                title="Total Fuel"
                value={(voyageAnalysis.performance.totalFuel || 0).toLocaleString()}
                unit="tons"
                icon={Fuel}
                gradient="from-purple-500 to-indigo-500"
              />

              <StatCard
                title="Estimated Cost"
                value={`$${(voyageAnalysis.performance.estimatedCost || 0).toLocaleString()}`}
                unit="USD"
                icon={DollarSign}
                gradient="from-green-500 to-emerald-500"
              />
            </div>

            {/* AI Insights & Laycan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-6 h-6 text-gray-600" />
                  <h3 className="font-bold text-lg text-gray-900">AI Voyage Insights</h3>
                </div>
                {/* Use the new component to render the insights */}
                <InsightList insights={voyageAnalysis.aiInsights} />
              </div>

              <LaycanStatus
                status={voyageAnalysis.laycanCompliance.status}
                eta={voyageAnalysis.laycanCompliance.eta}
                riskHours={voyageAnalysis.laycanCompliance.riskHours}
                laycanWindow={laycanWindow}
              />
            </div>
            
            {/* Charts & Graphs */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-6 h-6 text-gray-600" />
                <h3 className="font-bold text-lg text-gray-900">Voyage Performance & Weather</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <SpeedChart speedChartData={speedChartData} />
                <WeatherChart weatherChartData={weatherChartData} />
                <FuelConsumptionChart fuelChartData={fuelChartData} />
              </div>
            </div>

            {/* Detailed Leg Analysis Table */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-gray-600" />
                <h3 className="font-bold text-lg text-gray-900">Detailed Leg Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leg #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (nm)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (hrs)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOG (kn)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Burn (t)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weather Factor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voyageAnalysis.legAnalysis.map((leg) => (
                      <tr key={leg.legIndex} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leg.legIndex + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leg.distance.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leg.duration.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leg.sog.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(leg.fuelConsumption * leg.duration / 24).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leg.weatherFactor.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarineWeatherApp;
