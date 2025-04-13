import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Query for most recent attendance records from today (limit 4)
    const [rows] = await connection.execute(`
      SELECT h.*, DATE_FORMAT(h.date, '%H:%i:%s') as time
      FROM history h
      WHERE DATE(h.date) = ?
      ORDER BY h.date DESC
      LIMIT 4
    `, [today]);
    
    // Process each record to include attendance status
    const activities = rows.map(record => {
      // Extract hours and minutes for status calculation
      const checkInTime = new Date(record.date);
      const hours = checkInTime.getHours();
      const minutes = checkInTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Determine attendance status based on time
      let status;
      if (timeInMinutes < 450) { // Before 7:30 AM
        status = 'present';
      } else if (timeInMinutes < 510) { // Before 8:30 AM
        status = 'late';
      } else {
        status = 'absent';
      }
      
      // Format relative time
      const timestamp = new Date(record.date);
      const now = new Date();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      let relativeTime;
      if (diffMins < 1) {
        relativeTime = '방금 전';
      } else if (diffMins < 60) {
        relativeTime = `${diffMins}분 전`;
      } else if (diffHours < 24) {
        relativeTime = `${diffHours}시간 전`;
      } else {
        relativeTime = `${Math.floor(diffHours / 24)}일 전`;
      }
      
      return {
        ...record,
        status,
        relativeTime
      };
    });
    
    // Close the connection
    await connection.end();
    
    // Return the recent activities
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
