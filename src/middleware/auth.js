const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Verifies a Bearer JWT and attaches its payload to req.user.
 * Defense in depth: routes must validate the token themselves, they should
 * never assume an upstream gateway already did it.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Unauthorized', 'Missing or invalid Authorization header'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, email, role }
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Unauthorized', 'Invalid or expired token'));
  }
}

/**
 * Must run after requireAuth. Rejects requests whose token role isn't ADMIN.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Forbidden', 'Admin role required'));
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
