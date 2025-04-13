import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { stdid } = req.query;

  if (!stdid) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Query to fetch attendance logs for this student from history table
    const [rows] = await connection.execute(
      'SELECT * FROM history WHERE stdid = ?', 
      [stdid]
    );
    
    // Close the connection
    await connection.end();
    
    // Return the student attendance logs data
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
