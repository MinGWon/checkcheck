import styles from "@/styles/Dashboard.module.css";
import { useState } from "react";
import { parseStudentId } from "./AttendanceUtils";
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function ManualAttendanceEntry({ attendanceData, isLoading, setIsLoading, userName }) {
  const [manualStudent, setManualStudent] = useState(null);
  const [manualDate, setManualDate] = useState('');
  const [manualHour, setManualHour] = useState('');
  const [manualMinute, setManualMinute] = useState('');
  const [manualReason, setManualReason] = useState(''); // New state for reason
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');

  // Function to handle student selection in manual entry tab
  const handleManualStudentSelect = (e) => {
    const stdid = e.target.value;
    if (!stdid) {
      setManualStudent(null);
      return;
    }
    
    const student = attendanceData.students.find(s => s.stdid === stdid);
    setManualStudent(student);
  };

  // Handle date selection in manual entry tab
  const handleManualDateChange = (e) => {
    setManualDate(e.target.value);
  };

  // Handle hour selection
  const handleHourChange = (e) => {
    setManualHour(e.target.value);
  };

  // Handle minute selection
  const handleMinuteChange = (e) => {
    setManualMinute(e.target.value);
  };

  // Function to add a new attendance record
  const addAttendanceRecord = async () => {
    if (!manualStudent || !manualDate || !manualHour || !manualMinute) {
      setAddError('학생, 날짜, 시간을 모두 입력해주세요.');
      return;
    }
    
    // Validate reason field
    if (!manualReason.trim()) {
      setAddError('추가 사유를 입력해주세요.');
      return;
    }
    
    // Use SweetAlert2 for confirmation
    const confirmResult = await Swal.fire({
      title: '출결기록 추가',
      text: `${manualStudent.name} 학생의 출결기록을 추가하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '예',
      cancelButtonText: '아니요',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });
    
    // If user cancels, exit function
    if (!confirmResult.isConfirmed) {
      return;
    }
    
    setIsLoading(true);
    setAddSuccess(false);
    setAddError('');
    
    try {
      // Keep original ISO format (yyyy-MM-dd) instead of converting to yyyy/MM/dd
      const formattedDate = manualDate;
      
      // Format time as HH:MM:00
      const timeStr = `${manualHour.padStart(2, '0')}:${manualMinute.padStart(2, '0')}:00`;
      
      // Combine date and time in yyyy-MM-dd HH:mm:ss format
      const dateTimeStr = `${formattedDate} ${timeStr}`;
      
      const response = await fetch('/api/add-attendance-with-changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stdid: manualStudent.stdid,
          fid: manualStudent.fid || '',
          name: manualStudent.name,
          date: dateTimeStr,
          reason: manualReason,
          type: '추가',
          originalDate: 'none',
          tran_by: userName || 'PROPS_ERR' // Add the tran_by field with the userName
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add record');
      }
      
      setAddSuccess(true);
      
      // Reset form fields
      setManualHour('');
      setManualMinute('');
      setManualReason(''); // Clear reason after success
      
      // Show success message with SweetAlert
      Swal.fire({
        icon: 'success',
        title: '출결기록 추가 완료',
        text: `${manualStudent.name} 학생의 출결기록이 성공적으로 추가되었습니다.`,
        confirmButtonText: '확인',
        confirmButtonColor: '#3085d6',
      });
      
    } catch (error) {
      console.error('Error adding attendance record:', error);
      setAddError(error.message || '출결 기록 추가에 실패했습니다.');
      
      // Show error message with SweetAlert
      Swal.fire({
        icon: 'error',
        title: '출결기록 추가 실패',
        text: error.message || '출결 기록 추가에 실패했습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsLoading(false);
    }
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

  // Helper function to determine attendance status
  const getAttendanceStatus = () => {
    if (!manualHour || !manualMinute) return null;
    
    const timeStr = `${manualHour.padStart(2, '0')}:${manualMinute.padStart(2, '0')}:00`;
    const onTimeLimit = '07:30:00';
    const lateLimit = '08:30:00';
    
    let statusText, statusColor;
    if (timeStr < onTimeLimit) {
      statusText = '출석';
      statusColor = '#34c759';
    } else if (timeStr < lateLimit) {
      statusText = '지각';
      statusColor = '#ff9500';
    } else {
      statusText = '결석';
      statusColor = '#ff3b30';
    }
    
    return { statusText, statusColor };
  };

  const attendanceStatus = getAttendanceStatus();

  return (
    <>
      <div className={styles.cardHeader}>
        <div className={styles.headerWithAction}>
          <h3>출결기록수동입력</h3>

        </div>
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="manualStudentSelect">학생 선택</label>
          <div className={styles.searchControls}>
            <select 
              id="manualStudentSelect" 
              className={styles.select}
              value={manualStudent ? manualStudent.stdid : ''}
              onChange={handleManualStudentSelect}
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
      </div>
      
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>처리 중...</span>
          </div>
        ) : (
          <div className={styles.studentDetailCard}>
            {manualStudent ? (
              <>
                <div className={styles.studentInfo}>
                  <h4>
                    {manualStudent.name} ({parseStudentId(manualStudent.stdid).grade}학년 {parseStudentId(manualStudent.stdid).class}반 {parseStudentId(manualStudent.stdid).number}번)
                  </h4>
                </div>
                
                {addSuccess && (
                  <div className={styles.successMessage}>
                    <i className="fas fa-check-circle"></i>
                    <span>출결 기록이 성공적으로 추가되었습니다.</span>
                  </div>
                )}
                
                {addError && (
                  <div className={styles.errorMessage}>
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{addError}</span>
                  </div>
                )}
                
                <div className={styles.correctionCardContainer}>
                  <div className={styles.correctionCard} style={{ flexBasis: '100%' }}>
                    <div className={styles.correctionCardHeader}>
                      <h5>출결기록수동입력</h5>
                    </div>
                    <div className={styles.correctionCardBody}>
                      <div className={styles.recordDetails} style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                        <div className={styles.manualInputField}>
                          <label htmlFor="manualDate">날짜 (yyyy/mm/dd):</label>
                          <input
                            type="date"
                            id="manualDate"
                            className={styles.dateInput}
                            value={manualDate}
                            onChange={handleManualDateChange}
                          />
                        </div>
                        
                        <div className={styles.manualInputField}>
                          <label htmlFor="manualHour">시간 (24시간):</label>
                          <div className={styles.timeInputContainer}>
                            <select 
                              id="manualHour" 
                              className={styles.timeSelect}
                              value={manualHour}
                              onChange={handleHourChange}
                            >
                              <option value="">시</option>
                              {hoursOptions}
                            </select>
                            <span className={styles.timeSeparator}>:</span>
                            <select 
                              id="manualMinute" 
                              className={styles.timeSelect}
                              value={manualMinute}
                              onChange={handleMinuteChange}
                            >
                              <option value="">분</option>
                              {minutesOptions}
                            </select>
                          </div>
                        </div>
                        
                        {/* Add reason input field */}
                        <div className={styles.manualInputField} style={{width: '100%', marginTop: '15px'}}>
                          <label htmlFor="manualReason">추가 사유:</label>
                          <input
                            type="text"
                            id="manualReason"
                            className={styles.select}
                            style={{width: '100%', padding: '8px 12px'}}
                            value={manualReason}
                            onChange={(e) => setManualReason(e.target.value)}
                            placeholder="출결기록 추가 사유를 간단히 기재해주세요"
                          />
                        </div>
                        
                        {manualHour && manualMinute && (
                          <div className={styles.statusPreview}>
                            <span>상태: </span>
                            <div 
                              className={styles.statusIndicator} 
                              style={{backgroundColor: attendanceStatus.statusColor, display: 'inline-block', marginLeft: '8px'}}
                            >
                              <span>{attendanceStatus.statusText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.actionsContainer}>
                  <button 
                    className={styles.updateButton}
                    onClick={addAttendanceRecord}
                    disabled={isLoading || !manualDate || !manualHour || !manualMinute || !manualReason.trim()}
                  >
                    {isLoading ? 
                      <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                      <><i className="fas fa-plus"></i> 출결기록추가</>
                    }
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.noDataMessage} style={{ 
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-info-circle"></i>
                <span>학생을 먼저 선택해주세요.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
