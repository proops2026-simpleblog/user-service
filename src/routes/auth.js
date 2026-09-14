const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const { isValidEmail, isValidPassword } = require('../validation');

const router = express.Router();

const BCRYPT_COST_FACTOR = 10;
const JWT_EXPIRY = '24h';
const JWT_EXPIRY_SECONDS = 24 * 60 * 60;

function issueToken(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_EXPIRY }
  );
  return { token, expiresIn: JWT_EXPIRY_SECONDS };
}

// POST /auth/register
// Role is ALWAYS hardcoded to READER server-side. The request body's `role`
// field (if any) is never read for this route - the one documented
// exception to this rule is the startup admin-bootstrap in src/index.js.
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email)) {
      throw new ApiError(400, 'Bad Request', 'Invalid email format');
    }
    if (!isValidPassword(password)) {
      throw new ApiError(400, 'Bad Request', 'Password is required and must be at least 6 characters');
    }

    const existing = await db('users')
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .first();
    if (existing) {
      throw new ApiError(409, 'Conflict', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    let created;
    try {
      [created] = await db('users')
        .insert({ email, password_hash: passwordHash, role: 'READER' })
        .returning(['id', 'email', 'role']);
    } catch (dbErr) {
      // Race condition guard: unique index violation surfaced by Postgres.
      if (dbErr.code === '23505') {
        throw new ApiError(409, 'Conflict', 'An account with this email already exists');
      }
      throw dbErr;
    }

    return res.status(201).json({ id: created.id, email: created.email, role: created.role });
  } catch (err) {
    return next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new ApiError(401, 'Unauthorized', 'Invalid email or password');
    }

    const user = await db('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
    if (!user) {
      throw new ApiError(401, 'Unauthorized', 'Invalid email or password');
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      throw new ApiError(401, 'Unauthorized', 'Invalid email or password');
    }

    const { token, expiresIn } = issueToken(user);

    return res.status(200).json({
      token,
      expiresIn,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
