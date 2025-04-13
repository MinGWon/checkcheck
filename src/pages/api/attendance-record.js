import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { stdid, date } = req.query;

  if (!stdid || !date) {
    return res.status(400).json({ message: 'Student ID and date are required' });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Query to fetch attendance record for this student on this date
    const [rows] = await connection.execute(
      'SELECT * FROM history WHERE stdid = ? AND date LIKE ?', 
      [stdid, `${date}%`]
    );
    
    // Close the connection
    await connection.end();
    
    // Return the attendance record (or empty if not found)
    if (rows.length > 0) {
      return res.status(200).json(rows[0]);
    } else {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
