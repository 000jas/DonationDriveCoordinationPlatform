require('dotenv').config();
const { neon, Pool } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment or .env file');
}

// Serverless HTTP SQL Tagged Template Client (instant, connectionless, ideal for serverless functions & APIs)
const sql = neon(connectionString);

// Serverless WebSocket Pool (for long-lived sessions or multi-statement transactions)
const pool = new Pool({ connectionString });

module.exports = {
  sql,
  pool,
  query: (text, params) => pool.query(text, params),
};
