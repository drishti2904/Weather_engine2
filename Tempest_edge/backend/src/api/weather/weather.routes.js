const express = require('express');
const router = express.Router();
const weatherController = require('./weather.controller.js');

router.get('/current', weatherController.getCurrentWeather);

module.exports = router;