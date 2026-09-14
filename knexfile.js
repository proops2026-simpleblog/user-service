require('dotenv').config();

/**
 * Knex configuration.
 * Connection is always read from DATABASE_URL (never hardcoded here) so the
 * same config works across local dev, Docker Compose, and CI.
 */
module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    min: 0,
    max: 10,
  },
};
