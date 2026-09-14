const bcrypt = require('bcrypt');
const db = require('./db');

const BCRYPT_COST_FACTOR = 10;

/**
 * Idempotent admin bootstrap: if the users table is empty, seed exactly one
 * ADMIN row from INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD. This is the
 * one documented exception to "register always forces READER" - it never
 * runs through the public /auth/register path.
 *
 * Safe to call on every startup: if any user already exists (including a
 * prior bootstrap run), this is a no-op.
 */
async function bootstrapAdmin() {
  const { count } = await db('users').count('id as count').first();

  if (Number(count) > 0) {
    return { seeded: false };
  }

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set to bootstrap the admin account'
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  await db('users').insert({
    email,
    password_hash: passwordHash,
    role: 'ADMIN',
  });

  return { seeded: true };
}

module.exports = bootstrapAdmin;
