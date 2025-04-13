import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { stdid, originalDate, date, reason, type, tran_by } = req.body;

  if (!stdid || !originalDate || !date || !reason) {
    return res.status(400).json({ 
      message: '학생 ID, 원본 날짜, 새 날짜, 정정 사유가 필요합니다' 
    });
  }

  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // 1. First, get the student's name and fid from the history table
    const [studentInfo] = await connection.execute(
      'SELECT fid, name FROM history WHERE stdid = ? AND date = ? LIMIT 1',
      [stdid, originalDate]
    );

    if (!studentInfo || studentInfo.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        message: '학생 정보를 찾을 수 없습니다' 
      });
    }

    const { fid, name } = studentInfo[0];

    // 2. Update the attendance record in the history table
    const [updateResult] = await connection.execute(
      'UPDATE history SET date = ? WHERE stdid = ? AND date = ?',
      [date, stdid, originalDate]
    );
    
    // Check if the record was updated successfully
    if (updateResult.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ 
        message: '출결 기록을 찾을 수 없거나 변경사항이 없습니다' 
      });
    }
    
    // 3. Insert into history_changelog table with all required fields
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await connection.execute(
      'INSERT INTO history_changelog (fid, name, stdid, tran_date, original_date, modified_date, type, reason, tran_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fid, name, stdid, currentDate, originalDate, date, type, reason, tran_by || '시스템관리자']
    );
    
    // Close the connection
    await connection.end();
    
    // Return success response
    return res.status(200).json({ 
      message: '출결 기록이 성공적으로 업데이트되었습니다',
      affectedRows: updateResult.affectedRows
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: '데이터베이스 오류', 
      error: error.message 
    });
  }
}
