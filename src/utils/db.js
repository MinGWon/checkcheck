import mysql from 'mysql2/promise';

// Function to create a MySQL connection with consistent configuration
export async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'remote1',
    password: process.env.DB_PASSWORD || 'Syntax1234@',
    database: process.env.DB_NAME || 'checkcheck_auth'
  });
}
