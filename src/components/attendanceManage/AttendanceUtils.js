// Utility functions shared across attendance components

// Helper function to parse student ID into grade, class, and number
export const parseStudentId = (stdid) => {
  if (!stdid || stdid.length < 3) return { grade: '-', class: '-', number: '-' };
  
  // For 4-digit IDs (e.g., 3202): 1st digit = grade, 2nd digit = class, last 2 digits = number
  if (stdid.length === 4) {
    return {
      grade: stdid[0],
      class: stdid[1],
      number: parseInt(stdid.substring(2)).toString() // Convert "02" to "2"
    };
  }
  
  // For 3-digit IDs (e.g., 320): 1st digit = grade, 2nd digit = class, last digit = number
  return {
    grade: stdid[0],
    class: stdid[1],
    number: stdid.substring(2)
  };
};

// Helper function to format date as YYYY년 MM월 DD일
export const formatKoreanDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

// Helper function to format date as MM/DD
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// Helper function to format month for display (YYYY-MM to YYYY년 MM월)
export const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `${year}년 ${month}월`;
};

// Helper function to check attendance status for a student on a specific date
export const getAttendanceStatus = (stdid, date, attendanceLogs) => {
  const onTimeLimit = '07:30:00';
  const lateLimit = '08:30:00';
  
  const studentAttendance = attendanceLogs.find(log => {
    return log.stdid === stdid && log.date.startsWith(date);
  });

  if (!studentAttendance) {
    return { status: 'absent' }; // No attendance record for this date
  }

  const attendanceTime = studentAttendance.date.split(' ')[1];
  
  if (attendanceTime < onTimeLimit) {
    return { status: 'onTime' }; // On time (green circle)
  } else if (attendanceTime < lateLimit) {
    return { status: 'late', time: attendanceTime.substring(0, 5) }; // Late (yellow triangle with time)
  } else {
    return { status: 'absent' }; // Count as absent if after lateLimit (08:30:00)
  }
};

// Get status text for record
export const getStatusText = (status) => {
  switch (status) {
    case 'onTime': return '출석';
    case 'late': return '지각';
    case 'absent': return '결석';
    default: return '-';
  }
};

// Fetch student and attendance data from API
export const fetchStudentsAndLogs = async () => {
  // Fetch students data from students table
  const studentsResponse = await fetch('/api/students');
  const studentsData = await studentsResponse.json();
  
  // Fetch attendance logs from history table
  const logsResponse = await fetch('/api/attendance-logs');
  const logsData = await logsResponse.json();
  
  // Extract unique dates from attendance logs
  const uniqueDatesSet = new Set();
  logsData.forEach(log => {
    // Extract date part only
    const datePart = log.date.split(' ')[0];
    uniqueDatesSet.add(datePart);
  });
  
  // Sort dates chronologically
  const dates = Array.from(uniqueDatesSet).sort();

  // Extract all unique months from attendance logs
  const monthsSet = new Set();
  logsData.forEach(log => {
    // Extract year-month part only (YYYY-MM)
    const dateParts = log.date.split(' ')[0].split('-');
    const yearMonth = `${dateParts[0]}-${dateParts[1]}`;
    monthsSet.add(yearMonth);
  });
  
  // Sort months chronologically
  const months = Array.from(monthsSet).sort();

  // Extract classes from student data
  const classesSet = new Set();
  studentsData.forEach(student => {
    const { class: classNum } = parseStudentId(student.stdid);
    classesSet.add(classNum);
  });
  
  // Sort classes numerically
  const classes = Array.from(classesSet).sort((a, b) => parseInt(a) - parseInt(b));
  
  // Sort students by grade, class, and number
  const sortedStudents = [...studentsData].sort((a, b) => {
    const idA = parseStudentId(a.stdid);
    const idB = parseStudentId(b.stdid);
    
    // Compare grade
    if (parseInt(idA.grade) !== parseInt(idB.grade)) {
      return parseInt(idA.grade) - parseInt(idB.grade);
    }
    
    // If grade is the same, compare class
    if (parseInt(idA.class) !== parseInt(idB.class)) {
      return parseInt(idA.class) - parseInt(idB.class);
    }
    
    // If grade and class are the same, compare number
    return parseInt(idA.number) - parseInt(idB.number);
  });

  return {
    students: sortedStudents,
    logs: logsData,
    dates,
    months,
    classes
  };
};
