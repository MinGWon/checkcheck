import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { yearMonth, fetchOptions } = req.query;

  // If fetchOptions is set to 'availableMonths', return available year-months
  if (fetchOptions === 'availableMonths') {
    try {
      const connection = await getConnection();

      // Get distinct year-months that have correction logs
      const [results] = await connection.execute(
        `SELECT DISTINCT DATE_FORMAT(tran_date, '%Y-%m') as yearMonth 
         FROM history_changelog 
         ORDER BY yearMonth DESC`
      );
      
      await connection.end();
      return res.status(200).json(results.map(r => r.yearMonth));
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        message: '데이터베이스 오류',
        error: error.message
      });
    }
  }

  if (!yearMonth) {
    return res.status(400).json({ 
      message: '연도와 월을 지정해주세요.' 
    });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Query the history_changelog table for the specified year-month
    const [correctionLogs] = await connection.execute(
      `SELECT * FROM history_changelog 
       WHERE DATE_FORMAT(tran_date, '%Y-%m') = ? 
       ORDER BY tran_date DESC`,
      [yearMonth]
    );
    
    // Close the connection
    await connection.end();
    
    // Return the correction logs
    return res.status(200).json(correctionLogs);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: '데이터베이스 오류', 
      error: error.message 
    });
  }
}
