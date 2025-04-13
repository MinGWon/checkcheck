import React, { useState, useEffect } from 'react';
import styles from "@/styles/Dashboard.module.css";

// Import tab components
import MonthlyAttendance from "./MonthlyAttendance";
import StudentAttendance from "./StudentAttendance";
import AttendanceCorrection from "./AttendanceCorrection";
import ManualAttendanceEntry from "./ManualAttendanceEntry";
import { fetchStudentsAndLogs, parseStudentId } from "./AttendanceUtils";

export default function AttendanceManager({ userName }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceData, setAttendanceData] = useState({
    students: [],
    attendanceLogs: [],
    dates: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Fetch data from MySQL database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { students, logs, dates, months, classes } = await fetchStudentsAndLogs();
        
        setAttendanceData({
          students,
          attendanceLogs: logs,
          dates
        });
        
        setAvailableMonths(months);
        setAvailableClasses(classes);
        
        // Default to the most recent month
        if (months.length > 0 && !selectedMonth) {
          setSelectedMonth(months[months.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className={styles.managerContainer}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'attendance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            월별 출석현황
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'userList' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('userList')}
          >
            개별학생 출석조회
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'correction' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('correction')}
          >
            출결기록정정
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'manualEntry' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('manualEntry')}
          >
            출결기록수동입력
          </button>
        </div>
      </div>

      {activeTab === 'attendance' && (
        <MonthlyAttendance 
          attendanceData={attendanceData} 
          setAttendanceData={setAttendanceData}
          availableMonths={availableMonths}
          availableClasses={availableClasses}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {activeTab === 'userList' && (
        <StudentAttendance 
          attendanceData={attendanceData}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {activeTab === 'correction' && (
        <AttendanceCorrection 
          attendanceData={attendanceData}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          username={userName} // Pass userName to AttendanceCorrection
        />
      )}

      {activeTab === 'manualEntry' && (
        <ManualAttendanceEntry 
          attendanceData={attendanceData}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          userName={userName} // Pass userName to ManualAttendanceEntry
        />
      )}
    </div>
  );
}
