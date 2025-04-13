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
    
    // Step 1: Get total number of students from students table
    const [totalStudentsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM students'
    );
    const totalStudents = totalStudentsResult[0].total;
    
    // Step 2: Get attendance records for today
    const [todaysRecords] = await connection.execute(`
      SELECT stdid, MIN(date) as first_checkin
      FROM history
      WHERE DATE(date) = ?
      GROUP BY stdid
    `, [today]);
    
    // Initialize counters for attendance categories
    let presentCount = 0;
    let tardyCount = 0;
    
    // Process each record to determine attendance status
    todaysRecords.forEach(record => {
      // Extract time from the timestamp
      const checkInTime = new Date(record.first_checkin);
      const hours = checkInTime.getHours();
      const minutes = checkInTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Apply attendance criteria from MonthlyAttendance.js:
      // - Before 07:30 = Present (on time)
      // - Between 07:30 and 08:30 = Tardy (late)
      
      if (timeInMinutes < 450) { // Before 7:30 AM (7*60+30 = 450)
        presentCount++;
      } else if (timeInMinutes < 510) { // Before 8:30 AM (8*60+30 = 510)
        tardyCount++;
      }
    });
    
    // Calculate absent students as total students minus present and tardy
    const absentCount = totalStudents - (presentCount + tardyCount);
    
    // Close the connection
    await connection.end();
    
    // Return the attendance statistics
    return res.status(200).json({
      present: presentCount,
      absent: absentCount,
      tardy: tardyCount,
      totalStudents
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
