import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { stdid, fid, name, date, reason, type, originalDate, tran_by } = req.body;

  if (!stdid || !date || !reason) {
    return res.status(400).json({ 
      message: '학생 ID, 날짜, 추가 사유가 필요합니다' 
    });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // 1. First, insert the record into the history table
    const [insertResult] = await connection.execute(
      'INSERT INTO history (fid, name, stdid, date) VALUES (?, ?, ?, ?)',
      [fid, name, stdid, date]
    );
    
    if (insertResult.affectedRows === 0) {
      await connection.end();
      return res.status(500).json({ 
        message: '출결 기록 추가에 실패했습니다' 
      });
    }
    
    // 2. Insert into history_changelog table with all required fields including tran_by
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await connection.execute(
      'INSERT INTO history_changelog (fid, name, stdid, tran_date, original_date, modified_date, type, reason, tran_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fid, name, stdid, currentDate, originalDate, date, type, reason, tran_by || '시스템관리자']
    );
    
    // Close the connection
    await connection.end();
    
    // Return success response
    return res.status(200).json({ 
      message: '출결 기록이 성공적으로 추가되었습니다',
      affectedRows: insertResult.affectedRows
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: '데이터베이스 오류', 
      error: error.message 
    });
  }
}
