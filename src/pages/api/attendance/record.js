import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { fid, name, stdid, date } = req.body;

    if (!fid || !name || !stdid || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: fid, name, stdid, date' 
      });
    }

    // Connect to the database
    const connection = await getConnection();
    
    try {
      // Insert attendance record
      await connection.execute(
        'INSERT INTO history (fid, name, stdid, date) VALUES (?, ?, ?, ?)',
        [fid, name, stdid, date]
      );
      
      return res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully',
        data: true
      });
    } finally {
      // Close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
