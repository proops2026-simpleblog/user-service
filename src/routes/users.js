const express = require('express');
const db = require('../db');
const { ApiError } = require('../middleware/errorHandler');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { isValidRole } = require('../validation');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /users/:id/role  [ADMIN only]
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!isValidRole(role)) {
      throw new ApiError(400, 'Bad Request', 'Invalid role value');
    }

    if (!UUID_REGEX.test(id)) {
      throw new ApiError(404, 'Not Found', 'User not found');
    }

    const target = await db('users').where({ id }).first();
    if (!target) {
      throw new ApiError(404, 'Not Found', 'User not found');
    }

    const [updated] = await db('users')
      .where({ id })
      .update({ role, updated_at: db.fn.now() })
      .returning(['id', 'email', 'role']);

    return res.status(200).json({ id: updated.id, email: updated.email, role: updated.role });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
