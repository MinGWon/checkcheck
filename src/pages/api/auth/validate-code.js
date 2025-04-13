import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'C코드가 필요합니다.' });
  }

  let connection;
  try {
    // Create connection
    connection = await getConnection();
    
    // Check if the code exists and is active
    const [result] = await connection.execute(
      'SELECT * FROM codes WHERE code = ? AND isActive = 1',
      [code]
    );

    if (result.length === 0) {
      return res.status(400).json({ message: '유효하지 않은 C코드입니다.' });
    }

    // Code is valid
    return res.status(200).json({ message: 'C코드가 확인되었습니다.' });

  } catch (error) {
    console.error('C코드 검증 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    // Always close the connection
    if (connection) await connection.end();
  }
}
