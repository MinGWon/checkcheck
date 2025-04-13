import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let connection;
  try {
    // Get request body parameters
    const { stdid, fid, name, date } = req.body;
    
    // Validate required fields
    if (!stdid || !date) {
      return res.status(400).json({ message: 'Student ID and date are required' });
    }
    
    // Convert date format from yyyy/MM/dd HH:mm:ss to yyyy-MM-dd HH:mm:ss
    const formattedDate = date.replace(/\//g, '-');
    
    // Create MySQL connection using the utility function
    connection = await getConnection();

    // Insert attendance record into history table with properly formatted date
    const query = `
      INSERT INTO history (fid, name, stdid, date) 
      VALUES (?, ?, ?, ?)
    `;
    
    // Execute query with prepared statements for security
    const [result] = await connection.execute(query, [
      fid || '', // Ensure fid is never null
      name || '', // Ensure name is never null
      stdid,
      formattedDate // Use the properly formatted date
    ]);
    
    // Return success response
    return res.status(200).json({ 
      message: 'Attendance record added successfully',
      recordId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Failed to add attendance record', 
      error: error.message 
    });
  } finally {
    // Always close the connection
    if (connection) await connection.end();
  }
}
