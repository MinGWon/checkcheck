import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Query to fetch attendance logs from history table
    const [rows] = await connection.execute('SELECT * FROM history');
    
    // Close the connection
    await connection.end();
    
    // Return the attendance logs data
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}