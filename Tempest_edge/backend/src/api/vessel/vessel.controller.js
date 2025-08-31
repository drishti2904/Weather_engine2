const VesselService = require('../../services/vesselService');
const { vesselData } = require('../../constants/vesselData');
const { routes } = require('../../constants/routes');
const { apiResponse } = require('../../utils/apiResponse');

exports.getVesselOptimization = async (req, res, next) => {
    const { routeId, stw, laycanStart, laycanEnd } = req.body;
    try {
        if (!routeId || !stw) {
            return apiResponse(res, 400, 'Route ID and STW are required.');
        }

        const optimizationData = await VesselService.calculateVoyage(
            routeId,
            stw,
            laycanStart,
            laycanEnd
        );

        apiResponse(res, 200, "Voyage optimized successfully.", optimizationData);
    } catch (error) {
        next(error);
    }
};

exports.getAvailableVessels = (req, res) => {
    apiResponse(res, 200, "Available vessels fetched successfully.", vesselData);
};

exports.getAvailableRoutes = (req, res) => {
    apiResponse(res, 200, "Available routes fetched successfully.", routes);
};
