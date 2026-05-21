const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  // ← Read from environment variable, not hardcoded
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

module.exports = { pool, promisePool };