const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Export an object with the execute method that User.js expects
const db = {
  execute: async (sql, params) => {
    const [rows] = await promisePool.execute(sql, params);
    return [rows];
  }
};

module.exports = db;