import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { recordId, stdid, date } = req.body;

  if (!recordId || !stdid || !date) {
    return res.status(400).json({ 
      message: 'Record ID, Student ID, and date are required' 
    });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Update the attendance record in the history table
    const [result] = await connection.execute(
      'UPDATE history SET date = ? WHERE id = ? AND stdid = ?',
      [date, recordId, stdid]
    );
    
    // Close the connection
    await connection.end();
    
    // Check if the record was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Attendance record not found or no changes were made' 
      });
    }
    
    // Return success response
    return res.status(200).json({ 
      message: 'Attendance record updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
