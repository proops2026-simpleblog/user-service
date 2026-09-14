require('dotenv').config();
const db = require('../src/db');

/**
 * Shared test lifecycle helpers. Requires a real, reachable Postgres
 * database at process.env.DATABASE_URL (see tests/README.md).
 */

async function setupDatabase() {
  await db.migrate.latest();
}

async function truncateUsers() {
  await db('users').truncate();
}

async function closeDatabase() {
  await db.destroy();
}

module.exports = { db, setupDatabase, truncateUsers, closeDatabase };
