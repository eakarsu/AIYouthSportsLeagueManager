const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log(`PostgreSQL connected successfully (${environment})`);
  })
  .catch((err) => {
    console.error('PostgreSQL connection failed:', err.message);
  });

module.exports = db;
