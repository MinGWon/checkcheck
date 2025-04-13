import styles from "@/styles/Dashboard.module.css";
import { useState } from "react";
import { parseStudentId, formatKoreanDate } from "./AttendanceUtils";
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function AttendanceCorrection({ attendanceData, isLoading, setIsLoading, username }) {
  const [correctionStudent, setCorrectionStudent] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [displayedDate, setDisplayedDate] = useState('');
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [newTimeHours, setNewTimeHours] = useState('');
  const [newTimeMinutes, setNewTimeMinutes] = useState('');
  const [correctionReason, setCorrectionReason] = useState(''); // New state for correction reason
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Function to fetch available dates for the selected student
  const fetchStudentDates = async (student) => {
    setIsLoading(true);
    try {
      // Fetch attendance logs for this student
      const response = await fetch(`/api/student-dates?stdid=${student.stdid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student dates');
      }
      
      const data = await response.json();
      
      // Extract unique dates and sort chronologically
      const uniqueDates = [...new Set(data.map(log => log.date.split(' ')[0]))].sort();
      setAvailableDates(uniqueDates);
      
      // Reset selected date and attendance record
      setSelectedDate('');
      setAttendanceRecord(null);
      
    } catch (error) {
      console.error('Error fetching student dates:', error);
      setAvailableDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student selection in correction tab
  const handleCorrectionStudentSelect = (e) => {
    const stdid = e.target.value;
    if (!stdid) {
      setCorrectionStudent(null);
      setAvailableDates([]);
      setDisplayedDate(''); // Reset displayed date
      return;
    }
    
    const student = attendanceData.students.find(s => s.stdid === stdid);
    setCorrectionStudent(student);
    fetchStudentDates(student);
  };

  // Handle date selection in correction tab
  const handleDateSelect = (e) => {
    setSelectedDate(e.target.value);
  };

  // Function to fetch attendance record for specific date
  const fetchAttendanceRecord = async () => {
    if (!correctionStudent || !selectedDate) return;
    
    setIsLoading(true);
    setUpdateSuccess(false);
    setUpdateError('');
    
    try {
      const response = await fetch(`/api/attendance-record?stdid=${correctionStudent.stdid}&date=${selectedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance record');
      }
      
      const data = await response.json();
      setAttendanceRecord(data);
      setDisplayedDate(selectedDate); // Update displayed date only when fetch is successful
      
      // Set default new time based on current record
      if (data && data.date) {
        const timePart = data.date.split(' ')[1] || '';
        const timeComponents = timePart.substring(0, 5).split(':');
        setNewTime(timePart.substring(0, 5));
        setNewTimeHours(timeComponents[0] || '');
        setNewTimeMinutes(timeComponents[1] || '');
      }
      
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      setAttendanceRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hour selection
  const handleHourChange = (e) => {
    const hours = e.target.value;
    setNewTimeHours(hours);
    setNewTime(`${hours}:${newTimeMinutes || '00'}`);
  };

  // Handle minute selection
  const handleMinuteChange = (e) => {
    const minutes = e.target.value;
    setNewTimeMinutes(minutes);
    setNewTime(`${newTimeHours || '00'}:${minutes}`);
  };

  // Generate hours options for dropdown (00-23)
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return <option key={hour} value={hour}>{hour}</option>;
  });

  // Generate minutes options for dropdown (00-59)
  const minutesOptions = Array.from({ length: 60 }, (_, i) => {
    const minute = i.toString().padStart(2, '0');
    return <option key={minute} value={minute}>{minute}</option>;
  });

  // Function to update attendance record
  const updateAttendanceRecord = async () => {
    if (!correctionStudent || !selectedDate || !attendanceRecord) return;
    
    // Validate time format (should be 24-hour HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newTime)) {
      setUpdateError('시간은 24시간 형식(00:00-23:59)으로 입력해주세요.');
      return;
    }

    // Validate reason field
    if (!correctionReason.trim()) {
      setUpdateError('정정 사유를 입력해주세요.');
      return;
    }

    // Validate student ID exists
    if (!correctionStudent.stdid) {
      setUpdateError('학생 ID가 없습니다. 다시 학생을 선택해주세요.');
      return;
    }
    
    // Validate attendance record and date
    if (!attendanceRecord.date) {
      setUpdateError('출결 기록의 날짜 정보가 없습니다. 다시 조회해주세요.');
      return;
    }
    
    setIsLoading(true);
    setUpdateSuccess(false);
    setUpdateError('');
    
    try {
      // This creates the date string in 'yyyy-MM-dd HH:mm:ss' format
      const dateTimeStr = `${selectedDate} ${newTime}:00`;
      
      const requestBody = {
        stdid: correctionStudent.stdid,
        originalDate: attendanceRecord.date,
        date: dateTimeStr,  // Using 'date' to match update-attendance.js API
        reason: correctionReason,
        type: '정정',
        tran_by: username // Username is correctly being used here
      };
      
      // This logs the data being sent to verify format
      console.log('Sending update request with data:', requestBody);
      
      const response = await fetch('/api/update-attendance-with-changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update record');
      }
      
      // Set update success state
      setUpdateSuccess(true);
      setCorrectionReason(''); // Clear reason field after successful update
      
      // Show success message with SweetAlert
      Swal.fire({
        icon: 'success',
        title: '출결기록 정정 완료',
        text: `${correctionStudent.name} 학생의 출결기록이 성공적으로 정정되었습니다.`,
        confirmButtonText: '확인',
        confirmButtonColor: '#3085d6',
      });
      
      // Refresh the record to show updated data
      fetchAttendanceRecord();
      
    } catch (error) {
      console.error('Error updating attendance record:', error);
      setUpdateError(error.message || '출결 기록 업데이트에 실패했습니다.');
      
      // Show error message with SweetAlert
      Swal.fire({
        icon: 'error',
        title: '출결기록 정정 실패',
        text: error.message || '출결 기록 업데이트에 실패했습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.headerWithAction}>
          <h3>출결기록정정</h3>

        </div>
      </div>
      
      <div className={styles.searchContainer} style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0'  // Remove gap completely
      }}>
        <div className={styles.searchGroup}>
          <label htmlFor="correctionStudentSelect">학생 선택</label>
          <div className={styles.searchControls}>
            <select 
              id="correctionStudentSelect" 
              className={styles.select}
              value={correctionStudent ? correctionStudent.stdid : ''}
              onChange={handleCorrectionStudentSelect}
            >
              <option value="">학생을 선택하세요</option>
              {attendanceData.students.map(student => {
                const { grade, class: classNum, number } = parseStudentId(student.stdid);
                return (
                  <option key={student.stdid} value={student.stdid}>
                    ({grade}-{classNum}-{number}) {student.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className={styles.searchGroup} style={{
          marginLeft: '-5px' // Use negative margin to pull closer to previous element
        }}>
          <label htmlFor="dateSelect">날짜 선택</label>
          <div className={styles.searchControls}>
            <select 
              id="dateSelect" 
              className={styles.select}
              value={selectedDate}
              onChange={handleDateSelect}
              disabled={!correctionStudent || availableDates.length === 0}
            >
              <option value="">날짜를 선택하세요</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
            
            <button 
              className={styles.searchButton}
              onClick={fetchAttendanceRecord}
              disabled={isLoading || !selectedDate || !correctionStudent}
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
        ) : (attendanceRecord && correctionStudent && displayedDate) ? (
          <div className={styles.studentDetailCard}>
            <div className={styles.studentInfo}>
              <h4>
                {correctionStudent.name} ({parseStudentId(correctionStudent.stdid).grade}학년 {parseStudentId(correctionStudent.stdid).class}반 {parseStudentId(correctionStudent.stdid).number}번) - {formatKoreanDate(displayedDate)}
              </h4>
            </div>
            
            {updateSuccess && (
              <div className={styles.successMessage}>
                <i className="fas fa-check-circle"></i>
                <span>출결 기록이 성공적으로 수정되었습니다.</span>
              </div>
            )}
            
            {updateError && (
              <div className={styles.errorMessage}>
                <i className="fas fa-exclamation-circle"></i>
                <span>{updateError}</span>
              </div>
            )}
            
            <div className={styles.correctionCardContainer}>
              {/* Current attendance record card */}
              <div className={styles.correctionCard}>
                <div className={styles.correctionCardHeader}>
                  <h5>현재 출결 기록</h5>
                </div>
                <div className={styles.correctionCardBody}>
                  {(() => {
                    if (!attendanceRecord.date) return (
                      <div className={styles.noRecordMessage}>
                        <i className="fas fa-exclamation-circle"></i>
                        <span>출석 기록 없음</span>
                      </div>
                    );
                    
                    const time = attendanceRecord.date.split(' ')[1];
                    // Ensure 24-hour format display
                    const timeDisplay = time ? time.substring(0, 5) : '-';
                    const onTimeLimit = '07:30:00';
                    const lateLimit = '08:30:00';
                    
                    let status, statusText, statusColor;
                    if (time < onTimeLimit) {
                      status = 'onTime';
                      statusText = '출석';
                      statusColor = '#34c759';
                    } else if (time < lateLimit) {
                      status = 'late';
                      statusText = '지각';
                      statusColor = '#ff9500';
                    } else {
                      status = 'absent';
                      statusText = '결석';
                      statusColor = '#ff3b30';
                    }
                    
                    return (
                      <div className={styles.recordDetails}>
                        <div className={styles.timeDisplay}>
                          <i className="fas fa-clock"></i>
                          <span className={styles.timeValue}>{timeDisplay}</span>
                        </div>
                        <div 
                          className={styles.statusIndicator} 
                          style={{backgroundColor: statusColor}}
                        >
                          <span>{statusText}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Arrow between cards */}
              <div className={styles.correctionArrow}>
                <i className="fas fa-arrow-right"></i>
              </div>
              
              {/* New attendance record card */}
              <div className={styles.correctionCard}>
                <div className={styles.correctionCardHeader}>
                  <h5>수정할 출결 기록</h5>
                </div>
                <div className={styles.correctionCardBody}>
                  <div className={styles.recordDetails}>
                    <div className={styles.timeInputContainer}>
                      <i className="fas fa-edit"></i>
                      <div className={styles.timeInputContainer}>
                        <select 
                          id="correctionHour" 
                          className={styles.timeSelect}
                          value={newTimeHours}
                          onChange={handleHourChange}
                        >
                          <option value="">시</option>
                          {hoursOptions}
                        </select>
                        <span className={styles.timeSeparator}>:</span>
                        <select 
                          id="correctionMinute" 
                          className={styles.timeSelect}
                          value={newTimeMinutes}
                          onChange={handleMinuteChange}
                        >
                          <option value="">분</option>
                          {minutesOptions}
                        </select>
                      </div>
                      <small className={styles.formatHint}>24시간 형식</small>
                    </div>
                    
                    {(() => {
                      if (!newTime) return (
                        <div className={styles.statusPlaceholder}>
                          <span>시간을 입력하세요</span>
                        </div>
                      );
                      
                      const timeStr = newTime + ':00';
                      const onTimeLimit = '07:30:00';
                      const lateLimit = '08:30:00';
                      
                      let status, statusText, statusColor;
                      if (timeStr < onTimeLimit) {
                        status = 'onTime';
                        statusText = '출석';
                        statusColor = '#34c759';
                      } else if (timeStr < lateLimit) {
                        status = 'late';
                        statusText = '지각';
                        statusColor = '#ff9500';
                      } else {
                        status = 'absent';
                        statusText = '결석';
                        statusColor = '#ff3b30';
                      }
                      
                      return (
                        <div 
                          className={styles.statusIndicator} 
                          style={{backgroundColor: statusColor}}
                        >
                          <span>{statusText}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add correction reason card below attendance cards */}
            <div className={styles.correctionCard} style={{marginTop: '20px', width: '100%'}}>
              <div className={styles.correctionCardHeader}>
                <h5>정정 사유</h5>
              </div>
              <div className={styles.correctionCardBody}>
                <div className={styles.recordDetails} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <div style={{width: '100%', marginBottom: '10px'}}>
                    <i className="fas fa-pencil-alt" style={{marginRight: '10px'}}></i>
                    <span>정정 사유를 입력하세요</span>
                  </div>
                  <input
                    id="correctionReason"
                    type="text"
                    className={styles.select}
                    style={{width: '100%', padding: '8px 12px'}}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="출결기록 정정 사유를 간단히 기재해주세요"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.actionsContainer} style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '30px'
            }}>
              <button 
                className={styles.updateButton}
                onClick={updateAttendanceRecord}
                disabled={isLoading || !correctionReason.trim()}
              >
                {isLoading ? 
                  <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                  <><i className="fas fa-edit"></i> 출결기록정정</>
                }
              </button>
            </div>
          </div>
        ) : correctionStudent && availableDates.length === 0 ? (
          <div className={styles.noDataMessage} style={{ color: '#ff3b30' }}>
            <i className="fas fa-times-circle" style={{ color: '#ff3b30' }}></i>
            <span>선택한 학생의 출석 기록이 없습니다.</span>
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <i className="fas fa-info-circle"></i>
            <span>학생과 날짜를 선택한 후 '조회' 버튼을 눌러 출결 기록을 수정하세요.</span>
          </div>
        )}
      </div>
    </>
  );
}
