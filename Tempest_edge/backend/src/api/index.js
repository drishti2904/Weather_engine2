const express = require('express');
const router = express.Router();

// Import route files
const vesselRoutes = require('./vessel/vessel.routes');
const voyageRoutes = require('./voyage/voyage.routes.js');
const weatherRoutes = require('./weather/weather.routes.js');

// Use routes
router.use('/vessels', vesselRoutes);
router.use('/voyage', voyageRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;