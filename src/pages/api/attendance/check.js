import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { fid, date } = req.query;

    if (!fid || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fingerprint ID and date are required' 
      });
    }

    // Connect to the database
    const connection = await getConnection();
    
    try {
      // Check if attendance record exists for today
      const [rows] = await connection.execute(
        'SELECT * FROM history WHERE fid = ? AND SUBSTRING(date, 1, 10) = ?', 
        [fid, date]
      );
      
      return res.status(200).json({
        success: true,
        data: {
          alreadyAttended: rows.length > 0
        }
      });
    } finally {
      // Close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error checking attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
