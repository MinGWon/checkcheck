import mysql from 'mysql2/promise';

// Function to create a MySQL connection with consistent configuration
export async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'checkcheck_auth'
  });
}
