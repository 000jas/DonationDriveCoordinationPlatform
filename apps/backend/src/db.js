require("dotenv").config({ path: "../../.env" });
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_OcZieWB54AzI@ep-wandering-pine-b5wgc1xc-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(databaseUrl);

module.exports = { sql, databaseUrl };
