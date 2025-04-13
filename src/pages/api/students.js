import { getConnection } from '@/utils/db';

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    return await getStudents(req, res);
  } else if (req.method === 'POST') {
    return await createStudent(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET - Fetch all students
async function getStudents(req, res) {
  try {
    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Query to fetch all students from the students table
    const [rows] = await connection.execute('SELECT * FROM students');
    
    // Close the connection
    await connection.end();
    
    // Return the students data
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}

// POST - Create a new student
async function createStudent(req, res) {
  try {
    const { fid, stdid, name } = req.body;

    // Validate required fields
    if (!fid || !stdid || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create MySQL connection using the utility function
    const connection = await getConnection();

    // Check if student with same fingerprint ID already exists
    const [existingFid] = await connection.execute(
      'SELECT * FROM students WHERE fid = ?',
      [fid]
    );

    if (existingFid.length > 0) {
      await connection.end();
      return res.status(409).json({ message: '이미 등록된 지문 ID입니다.' });
    }

    // Check if student with same student ID already exists
    const [existingStdid] = await connection.execute(
      'SELECT * FROM students WHERE stdid = ?',
      [stdid]
    );

    if (existingStdid.length > 0) {
      await connection.end();
      return res.status(409).json({ message: '이미 등록된 학번입니다.' });
    }

    // Insert new student
    const [result] = await connection.execute(
      'INSERT INTO students (fid, stdid, name) VALUES (?, ?, ?)',
      [fid, stdid, name]
    );
    
    // Close the connection
    await connection.end();
    
    return res.status(201).json({ 
      message: '학생이 성공적으로 등록되었습니다.',
      studentId: result.insertId
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}