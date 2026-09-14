/**
 * Standardized error shape used across every 400/401/403/404/409 response:
 * { error, message, statusCode, timestamp }
 */
class ApiError extends Error {
  constructor(statusCode, error, message) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
}

function sendError(res, statusCode, error, message) {
  res.status(statusCode).json({
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

// Express error-handling middleware (must take 4 args to be recognized as such).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.error, err.message);
  }

  // Unexpected error: never leak internals, never log secrets.
  console.error('Unhandled error:', err.message);
  return sendError(res, 500, 'Internal Server Error', 'An unexpected error occurred');
}

module.exports = { ApiError, sendError, errorHandler };
