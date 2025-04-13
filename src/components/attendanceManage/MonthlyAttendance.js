import styles from "@/styles/Dashboard.module.css";
import { useState, useEffect, useRef } from "react";
import { formatMonth, formatDate, parseStudentId, getAttendanceStatus } from "./AttendanceUtils";

export default function MonthlyAttendance({ 
  attendanceData,
  setAttendanceData,
  availableMonths, 
  availableClasses,
  selectedMonth, 
  setSelectedMonth,
  isLoading, 
  setIsLoading,
  activeTab // Add this prop to track the active tab
}) {
  const [selectedClass, setSelectedClass] = useState('all');
  const [currentlyDisplayedClass, setCurrentlyDisplayedClass] = useState('all');
  const [filteredDates, setFilteredDates] = useState([]);
  const [tableHeight, setTableHeight] = useState('60vh');
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const tableContainerRef = useRef(null);
  const bodyTableRef = useRef(null);
  const headerTableRef = useRef(null);
  
  // Calculate scrollbar width and adjust table dimensions
  useEffect(() => {
    const calculateScrollbarWidth = () => {
      // Create a temporary div with a scrollbar
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      document.body.appendChild(outer);
      
      // Create inner div
      const inner = document.createElement('div');
      outer.appendChild(inner);
      
      // Calculate width difference
      const width = outer.offsetWidth - inner.offsetWidth;
      
      // Clean up
      document.body.removeChild(outer);
      
      return width;
    };
    
    const updateTableDimensions = () => {
      if (tableContainerRef.current) {
        // Calculate precise available height to prevent page scrolling
        const windowHeight = window.innerHeight;
        const tableTop = tableContainerRef.current.getBoundingClientRect().top;
        const safetyBuffer = 80; // Extra buffer to prevent page scrolling
        
        // Calculate available height with buffer
        const availableHeight = windowHeight - tableTop - safetyBuffer;
        setTableHeight(`${Math.max(200, availableHeight)}px`);
        
        // Set scrollbar width
        const sbWidth = calculateScrollbarWidth();
        setScrollbarWidth(sbWidth);
        
        // Apply width adjustments after tables are rendered
        setTimeout(() => {
          if (bodyTableRef.current && headerTableRef.current) {
            // Check if body has a vertical scrollbar
            const hasVerticalScrollbar = bodyTableRef.current.scrollHeight > bodyTableRef.current.clientHeight;
            
            // Apply padding to header container to account for scrollbar
            const headerContainer = headerTableRef.current.parentNode;
            if (hasVerticalScrollbar) {
              headerContainer.style.paddingRight = `${sbWidth}px`;
            } else {
              headerContainer.style.paddingRight = '0';
            }
            
            // Ensure both tables have the same width setting
            const bodyTable = bodyTableRef.current.querySelector('table');
            const headerTable = headerTableRef.current;
            
            if (bodyTable && headerTable) {
              // Make both tables the same width
              bodyTable.style.width = '100%';
              headerTable.style.width = '100%';
            }
          }
        }, 200);
      }
    };
    
    updateTableDimensions();
    window.addEventListener('resize', updateTableDimensions);
    return () => window.removeEventListener('resize', updateTableDimensions);
  }, [filteredDates]);

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const handleBodyScroll = () => {
      if (bodyTableRef.current && headerTableRef.current) {
        headerTableRef.current.parentNode.scrollLeft = bodyTableRef.current.scrollLeft;
      }
    };

    if (bodyTableRef.current) {
      bodyTableRef.current.addEventListener('scroll', handleBodyScroll);
      return () => {
        if (bodyTableRef.current) {
          bodyTableRef.current.removeEventListener('scroll', handleBodyScroll);
        }
      };
    }
  }, [bodyTableRef.current]);
  
  // Load attendance data based on selected month and class
  const loadAttendanceData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch fresh data from MySQL when search button is clicked
      const logsResponse = await fetch('/api/attendance-logs');
      
      if (!logsResponse.ok) {
        throw new Error('Failed to fetch attendance logs');
      }
      
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
      
      // Filter dates by selected month
      if (selectedMonth && dates.length > 0) {
        const filtered = dates.filter(date => 
          date.startsWith(selectedMonth)
        );
        setFilteredDates(filtered);
        
        // Store the selected class at the time the search button was clicked
        setCurrentlyDisplayedClass(selectedClass);
        
        // Update attendance logs with the new data
        setAttendanceData(prev => ({
          ...prev,
          attendanceLogs: logsData,
          dates
        }));
      } else {
        setFilteredDates([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  // Filter students based on selected class
  const getFilteredStudents = () => {
    if (currentlyDisplayedClass === 'all') {
      return attendanceData.students;
    }
    
    return attendanceData.students.filter(student => {
      const { class: classNum } = parseStudentId(student.stdid);
      return classNum === currentlyDisplayedClass;
    });
  };

  // Render attendance icon based on status
  const renderAttendanceIcon = (statusData) => {
    switch (statusData.status) {
      case 'onTime':
        return <span className={styles.attendanceOnTime}>⬤</span>; // Green circle
      case 'late':
        return (
          <div className={styles.lateAttendance}>
            <span className={styles.attendanceLate}>▲</span>
            <span className={styles.attendanceTime}>{statusData.time}</span>
          </div>
        ); // Yellow triangle with time
      case 'absent':
        return <span className={styles.attendanceAbsent}>✕</span>; // Red X
      default:
        return null;
    }
  };

  return (
    <div className="attendanceTab">
      <div className={styles.cardHeader}>
        <div className={styles.headerWithAction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3>월별 출석현황</h3>
          {/* Only show the legend when we're in the Monthly Attendance tab */}
          {(activeTab === 'monthly' || activeTab === undefined) && (
            <div className={styles.attendanceLegend} style={{ display: 'flex', marginLeft: 'auto', gap: '15px' }}>
              <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className={styles.attendanceOnTime}>⬤</span>
                <span>07:30 이전</span>
              </div>
              <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className={styles.attendanceLate}>▲</span>
                <span>07:30~08:30</span>
              </div>
              <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className={styles.attendanceAbsent}>✕</span>
                <span>08:30 이후/미출석</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="monthSelect">월 선택</label>
          <div className={styles.searchControls}>
            <select 
              id="monthSelect" 
              className={styles.select}
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
            
            <select 
              id="classSelect" 
              className={styles.select}
              value={selectedClass}
              onChange={handleClassChange}
            >
              <option value="all">전체</option>
              {availableClasses.map(classNum => (
                <option key={classNum} value={classNum}>
                  {classNum}반
                </option>
              ))}
            </select>
            
            <button 
              className={styles.searchButton}
              onClick={loadAttendanceData}
              disabled={isLoading}
            >
              {isLoading ? 
                <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                <><i className="fas fa-search"></i> 조회</>
              }
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={tableContainerRef} 
        className={styles.tableContainer}
        style={{
          position: 'relative'
        }}
      >
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>출석 데이터를 불러오는 중...</span>
          </div>
        ) : filteredDates.length > 0 ? (
          <div className={styles.tableWrapperWithScrollbar} style={{ 
            width: '100%', 
            position: 'relative',
            border: '1px solid #dee2e6'
          }}>
            {/* Header Table */}
            <div 
              className={styles.headerTableContainer} 
              style={{ 
                overflow: 'hidden',
                borderBottom: '1px solid #adb5bd', // Changed from 2px to 1px for thinner line
                position: 'relative',
                zIndex: 10,
                background: 'white',
                boxSizing: 'border-box'  // Important to include padding in width calculation
              }}
            >
              <table 
                ref={headerTableRef}
                className={styles.attendanceTable} 
                style={{ 
                  width: '100%', 
                  tableLayout: 'fixed', 
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  margin: 0 
                }}
              >
                <colgroup>
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '13px' }} /> {/* Reduced from 15% */}
                  {filteredDates.map(date => (
                    <col key={`header-col-${date}`} style={{ width: `${81 / filteredDates.length}%` }} /> 
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan="3" className={styles.groupHeader} style={{ 
                      border: '1px solid #dee2e6', 
                      borderLeft: 'none',
                      borderTop: 'none'
                    }}>학번</th>
                    <th rowSpan="2" style={{ 
                      border: '1px solid #dee2e6', 
                      borderTop: 'none' 
                    }}>이름</th>
                    {filteredDates.map(date => (
                      <th key={date} rowSpan="2" style={{ 
                        border: '1px solid #dee2e6', 
                        borderTop: 'none' 
                      }}>{formatDate(date)}</th>
                    ))}
                  </tr>
                  <tr>
                    <th style={{ 
                      border: '1px solid #dee2e6', 
                      borderLeft: 'none' 
                    }}>학년</th>
                    <th style={{ border: '1px solid #dee2e6' }}>반</th>
                    <th style={{ border: '1px solid #dee2e6' }}>번호</th>
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* Body Table with scrollbar */}
            <div 
              ref={bodyTableRef}
              className={styles.bodyTableContainer} 
              style={{ 
                maxHeight: 'calc(100vh - 535px)', // Reduced from 300px to 350px subtraction
                height: 'calc(100vh - 535px)',     // Match the maxHeight
                overflow: 'auto',
                borderTop: 'none',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onScroll={(e) => {
                if (headerTableRef.current) {
                  headerTableRef.current.parentNode.scrollLeft = e.target.scrollLeft;
                }
              }}
            >
              <table 
                className={styles.attendanceTable} 
                style={{ 
                  width: '100%', 
                  tableLayout: 'fixed', 
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  margin: 0 
                }}
              >
                <colgroup>
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '5px' }} /> {/* Reduced from 5% */}
                  <col style={{ width: '13px' }} /> {/* Reduced from 15% */}
                  {filteredDates.map(date => (
                    <col key={`body-col-${date}`} style={{ width: `${81 / filteredDates.length}%` }} />
                  ))}
                </colgroup>
                <tbody>
                  {getFilteredStudents().map(student => {
                    const { grade, class: classNum, number } = parseStudentId(student.stdid);
                    return (
                      <tr key={student.fid || student.stdid}>
                        <td className={styles.idCell} style={{ 
                          border: '1px solid #dee2e6', 
                          borderTop: 'none', 
                          borderLeft: 'none' 
                        }}>{grade}</td>
                        <td className={styles.idCell} style={{ 
                          border: '1px solid #dee2e6', 
                          borderTop: 'none' 
                        }}>{classNum}</td>
                        <td className={styles.idCell} style={{ 
                          border: '1px solid #dee2e6', 
                          borderTop: 'none' 
                        }}>{number}</td>
                        <td style={{ border: '1px solid #dee2e6', borderTop: 'none' }}>
                          {student.name}
                        </td>
                        {filteredDates.map(date => (
                          <td 
                            key={`${student.stdid}-${date}`} 
                            className={styles.attendanceCell} 
                            style={{ border: '1px solid #dee2e6', borderTop: 'none' }}
                          >
                            {renderAttendanceIcon(getAttendanceStatus(student.stdid, date, attendanceData.attendanceLogs))}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <i className="fas fa-info-circle"></i>
            <span>선택한 월의 출석 데이터가 없습니다. 다른 월을 선택하거나 '조회' 버튼을 눌러주세요.</span>
          </div>
        )}
      </div>
    </div>
  );
}
