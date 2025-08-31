const express = require('express');
const router = express.Router();
const vesselController = require('./vessel.controller');

router.post('/optimize-voyage', vesselController.getVesselOptimization);
router.get('/list-vessels', vesselController.getAvailableVessels);
router.get('/list-routes', vesselController.getAvailableRoutes);

module.exports = router;
