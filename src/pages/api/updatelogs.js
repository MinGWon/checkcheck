import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();
    
    // Query update logs from the database
    const [updateLogs] = await connection.execute(`
      SELECT ver, type, date, detail 
      FROM updatelogs 
      ORDER BY date DESC, ver DESC
    `);
    
    // Close the connection
    await connection.end();
    
    // Format dates to ensure consistency (YYYY-MM-DD)
    const formattedLogs = updateLogs.map(log => ({
      ...log,
      date: new Date(log.date).toISOString().split('T')[0]
    }));
    
    return res.status(200).json(formattedLogs);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: '업데이트 기록을 불러오는데 실패했습니다', error: error.message });
  }
}
