require('dotenv').config();
const knex = require('knex');
const knexfile = require('../knexfile');

/**
 * Single shared knex instance for the whole service, configured entirely
 * from DATABASE_URL (see knexfile.js). No host/credentials are ever
 * hardcoded here.
 */
const db = knex(knexfile);

module.exports = db;
