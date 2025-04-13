import db from '../lib/db';

export async function fetchStudents() {
  try {
    const [rows] = await db.query('SELECT * FROM students');
    return rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function fetchAttendanceLogs() {
  try {
    const [rows] = await db.query('SELECT * FROM history ORDER BY date DESC');
    return rows;
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return [];
  }
}