import styles from "@/styles/Dashboard.module.css";
import { useState, useEffect } from "react";
import { parseStudentId, getStatusText } from "./AttendanceUtils";

export default function StudentAttendance({ attendanceData, isLoading, setIsLoading }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  
  const [selectedYearMonth, setSelectedYearMonth] = useState('');
  const [calendarData, setCalendarData] = useState([]);
  
  const [availableYearMonths, setAvailableYearMonths] = useState([]);

  useEffect(() => {
    if (showStudentDetail && studentAttendanceRecords.length > 0 && selectedYearMonth) {
      generateCalendarData();
    }
  }, [selectedYearMonth, studentAttendanceRecords, showStudentDetail]);

  const generateCalendarData = () => {
    if (!selectedYearMonth) return;
    
    const [year, month] = selectedYearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    
    let calendarDays = Array(firstDayOfMonth).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const record = studentAttendanceRecords.find(r => r.date === dateStr);
      
      calendarDays.push({
        day,
        status: record ? record.status : null,
        time: record ? record.time : null
      });
    }
    
    setCalendarData(calendarDays);
  };

  const extractAvailableDates = (records) => {
    if (!records || records.length === 0) return;
    
    const yearMonthSet = new Set();
    
    records.forEach(record => {
      const [year, month] = record.date.split('-');
      yearMonthSet.add(`${year}-${month}`);
    });
    
    const yearMonths = Array.from(yearMonthSet).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      if (yearA === yearB) return monthB - monthA;
      return yearB - yearA;
    });
    
    setAvailableYearMonths(yearMonths);
    
    if (yearMonths.length > 0) {
      setSelectedYearMonth(yearMonths[0]);
    }
  };

  const loadStudentAttendance = async (student) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/attendance-logs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch student attendance data');
      }
      
      const data = await response.json();
      
      const allDatesSet = new Set();
      data.forEach(log => {
        if (log.date && typeof log.date === 'string') {
          const datePart = log.date.split(' ')[0];
          allDatesSet.add(datePart);
        }
      });
      const allDates = Array.from(allDatesSet).sort();
      
      const studentLogs = data.filter(log => log.stdid === student.stdid);
      
      const records = allDates.map(date => {
        const log = studentLogs.find(log => log.date && log.date.startsWith(date));
        
        if (!log || !log.date) {
          return {
            date: date,
            time: '-',
            status: 'absent'
          };
        }
        
        const dateTime = log.date.split(' ');
        const datePart = dateTime[0];
        const timePart = dateTime[1] ? dateTime[1].substring(0, 5) : '-';
        
        const onTimeLimit = '07:30:00';
        const lateLimit = '08:30:00';
        
        let status;
        if (!dateTime[1]) {
          status = 'absent';
        } else if (dateTime[1] < onTimeLimit) {
          status = 'onTime';
        } else if (dateTime[1] < lateLimit) {
          status = 'late';
        } else {
          status = 'absent';
        }
        
        return {
          date: datePart,
          time: timePart,
          status
        };
      });
      
      setStudentAttendanceRecords(records);
      setShowStudentDetail(true);
      
      extractAvailableDates(records);
      
    } catch (error) {
      console.error('Error fetching student attendance data:', error);
      setStudentAttendanceRecords([]);
      setShowStudentDetail(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSearch = () => {
    if (selectedStudent) {
      loadStudentAttendance(selectedStudent);
    }
  };

  const closeStudentDetail = () => {
    setShowStudentDetail(false);
    setSelectedStudent(null);
    setStudentAttendanceRecords([]);
    setAvailableYearMonths([]);
    setSelectedYearMonth('');
  };

  const handleStudentSelect = (e) => {
    const stdid = e.target.value;
    const student = attendanceData.students.find(s => s.stdid === stdid);
    setSelectedStudent(student || null);
    
    setAvailableYearMonths([]);
    setSelectedYearMonth('');
    setShowStudentDetail(false);
  };

  const handleYearMonthChange = (e) => {
    setSelectedYearMonth(e.target.value);
  };

  const formatYearMonth = (yearMonth) => {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    return `${year}년 ${month}월`;
  };

  return (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.headerWithAction}>
          <h3>개별학생 출석조회</h3>
        </div>
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="studentSelect">학생 선택</label>
          <div className={styles.searchControls}>
            <select 
              id="studentSelect" 
              className={styles.select}
              value={selectedStudent ? selectedStudent.stdid : ''}
              onChange={handleStudentSelect}
            >
              <option value="">학생을 선택하세요</option>
              {attendanceData.students.map(student => {
                const { grade, class: classNum, number } = parseStudentId(student.stdid);
                // Zero-pad the number to ensure 2 digits
                const paddedNumber = number.toString().padStart(2, '0');
                return (
                  <option key={student.stdid} value={student.stdid}>
                    ({grade}{classNum}{paddedNumber}) {student.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className={styles.searchGroup}>
          <label htmlFor="yearMonthSelect">출석 기간</label>
          <div className={styles.searchControls}>
            <select 
              id="yearMonthSelect" 
              className={styles.select}
              value={selectedYearMonth}
              onChange={handleYearMonthChange}
              disabled={!selectedStudent}
            >
              <option value="">기간 선택</option>
              {availableYearMonths.length > 0 ? (
                availableYearMonths.map(yearMonth => (
                  <option key={yearMonth} value={yearMonth}>
                    {formatYearMonth(yearMonth)}
                  </option>
                ))
              ) : (
                <option value={`${new Date().getFullYear()}-${new Date().getMonth() + 1}`}>
                  {`${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`}
                </option>
              )}
            </select>
            
            <button 
              className={styles.searchButton}
              onClick={handleStudentSearch}
              disabled={isLoading || !selectedStudent}
            >
              {isLoading ? 
                <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                <><i className="fas fa-search"></i> 조회</>
              }
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>출석 데이터를 불러오는 중...</span>
          </div>
        ) : showStudentDetail && selectedStudent ? (
          <div className={styles.studentDetailCard}>
            <div className={styles.studentInfo}>
              <h4>
                {selectedStudent.name} ({parseStudentId(selectedStudent.stdid).grade}학년 {parseStudentId(selectedStudent.stdid).class}반 {parseStudentId(selectedStudent.stdid).number}번)
              </h4>
              <div className={styles.dateControlsWrapper}>
                <button 
                  className={styles.backButton}
                  onClick={closeStudentDetail}
                >
                  <i className="fas fa-arrow-left"></i> 목록으로
                </button>
              </div>
            </div>
            
            {studentAttendanceRecords.length > 0 && selectedYearMonth ? (
              <>
                <div className={styles.realCalendar}>
                  <div className={styles.calendarMonth}>
                    {formatYearMonth(selectedYearMonth)}
                  </div>
                  
                  <table className={styles.calendarTable}>
                    <thead>
                      <tr>
                        <th className={styles.sundayColumn}>일</th>
                        <th>월</th>
                        <th>화</th>
                        <th>수</th>
                        <th>목</th>
                        <th>금</th>
                        <th className={styles.saturdayColumn}>토</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(
                        { length: Math.ceil(calendarData.length / 7) },
                        (_, weekIndex) => (
                          <tr key={weekIndex}>
                            {calendarData
                              .slice(weekIndex * 7, (weekIndex + 1) * 7)
                              .map((day, dayIndex) => (
                                <td 
                                  key={dayIndex} 
                                  className={`
                                    ${styles.calendarCell}
                                    ${!day ? styles.emptyCell : ''}
                                    ${dayIndex === 0 ? styles.sundayColumn : ''}
                                    ${dayIndex === 6 ? styles.saturdayColumn : ''}
                                    ${day && day.status === 'onTime' ? styles.presentDay : ''}
                                    ${day && day.status === 'late' ? styles.lateDay : ''}
                                    ${day && day.status === 'absent' ? styles.absentDay : ''}
                                  `}
                                >
                                  {day && (
                                    <>
                                      <div className={styles.dayNumber}>{day.day}</div>
                                      {day.status && (
                                        <div className={styles.calendarStatus}>
                                          {day.status === 'onTime' && (
                                            <div className={styles.onTimeStatus}>
                                              출석
                                              <div className={styles.attendanceTime} style={{ color: '#28a745' }}>{day.time}</div>
                                            </div>
                                          )}
                                          {day.status === 'late' && (
                                            <div className={styles.lateStatus}>
                                              지각
                                              <div className={styles.attendanceTime}>{day.time}</div>
                                            </div>
                                          )}
                                          {day.status === 'absent' && (
                                            <div className={styles.absentStatus}>결석</div>
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </td>
                              ))
                            }
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <h5 className={styles.listViewHeader}>상세 출석 목록</h5>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>출석 시간</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAttendanceRecords
                      .filter(record => {
                        const [year, month] = record.date.split('-');
                        return `${year}-${month}` === selectedYearMonth;
                      })
                      .map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.time}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${
                              record.status === 'onTime' ? styles.statusCompleted :
                              record.status === 'late' ? styles.statusProcessing :
                              styles.statusPending
                            }`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className={styles.noDataMessage}>
                <i className="fas fa-info-circle"></i>
                <span>출석 기록이 없습니다.</span>
              </div>
            )}
          </div>
        ) : selectedStudent ? (
          <div className={styles.noDataMessage}>
            <i className="fas fa-info-circle"></i>
            <span>'조회' 버튼을 눌러 {selectedStudent.name} 학생의 출석 기록을 확인하세요.</span>
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <i className="fas fa-info-circle"></i>
            <span>학생을 선택하고 '조회' 버튼을 눌러 출석 기록을 확인하세요.</span>
          </div>
        )}
      </div>
    </>
  );
}
