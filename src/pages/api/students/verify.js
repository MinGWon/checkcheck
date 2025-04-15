import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { fid } = req.query;

    if (!fid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Fingerprint ID is required' 
      });
    }

    // Connect to the database
    const connection = await getConnection();
    
    try {
      // Query for student with the given fingerprint ID
      const [rows] = await connection.execute(
        'SELECT * FROM students WHERE fid = ?', 
        [fid]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      // Return the student info
      return res.status(200).json({
        success: true,
        message: 'Student found',
        data: {
          Fid: rows[0].fid,
          Name: rows[0].name,
          StdId: rows[0].stdid
        }
      });
    } finally {
      // Close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error verifying student:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
