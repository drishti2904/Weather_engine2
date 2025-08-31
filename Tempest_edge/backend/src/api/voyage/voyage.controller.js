const { apiResponse } = require('../../utils/apiResponse.js');

exports.compareRoutes = async (req, res, next) => {
    try {
        // This is a placeholder for future logic to compare multiple routes.
        // The request body would contain multiple routes and vessel configurations.
        // Example:
        // const { routes, vessels } = req.body;
        // const comparisonReport = await VoyageService.compare(routes, vessels);
        // apiResponse(res, 200, "Route comparison completed.", comparisonReport);
        
        apiResponse(res, 501, "Route comparison feature is not yet implemented.");
    } catch (error) {
        next(error);
    }
};