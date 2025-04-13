import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'checkcheck_auth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = {
  query: async (sql, params) => {
    return await pool.query(sql, params);
  },
  execute: async (sql, params) => {
    return await pool.execute(sql, params);
  }
};

// Create the users table if it doesn't exist
async function initializeDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Call this function when the application starts
initializeDatabase();