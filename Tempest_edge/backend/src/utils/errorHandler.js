exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred.';

    res.status(statusCode).json({
        success: false,
        message,
        error: {
            // Include stack trace only in development environment
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};