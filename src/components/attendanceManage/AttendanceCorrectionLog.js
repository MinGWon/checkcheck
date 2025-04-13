import styles from "@/styles/Dashboard.module.css";
import { useState, useEffect, useRef } from "react";
import { formatMonth, formatDate, parseStudentId } from "./AttendanceUtils";

export default function AttendanceCorrectionLog({ isLoading, setIsLoading }) {
  const [correctionLogs, setCorrectionLogs] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableYearMonths, setAvailableYearMonths] = useState([]);
  const [tableHeight, setTableHeight] = useState('60vh');
  const [hasSearched, setHasSearched] = useState(false);
  const [scrollbarWidth, setScrollbarWidth] = useState(17); // Default scrollbar width
  const [activeTab, setActiveTab] = useState('correction'); // 'correction' or 'consent'
  const tableContainerRef = useRef(null);
  const bodyTableRef = useRef(null);
  const headerTableRef = useRef(null);

  // Fetch available year-months on component mount
  useEffect(() => {
    const fetchAvailableYearMonths = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/attendance-correction-logs?fetchOptions=availableMonths');
        if (!response.ok) {
          throw new Error('Failed to fetch available months');
        }

        const yearMonths = await response.json();
        setAvailableYearMonths(yearMonths);

        // Set default selection to the most recent year-month if available
        if (yearMonths.length > 0) {
          const [firstYear, firstMonth] = yearMonths[0].split('-');
          setSelectedYear(firstYear);
          setSelectedMonth(firstMonth);
        }
      } catch (error) {
        console.error('Error fetching available months:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableYearMonths();
  }, []);

  // Calculate available years and months from the available year-months
  const availableYears = [...new Set(availableYearMonths.map(ym => ym.split('-')[0]))];

  // Get available months for the selected year
  const getAvailableMonthsForYear = (year) => {
    return availableYearMonths
      .filter(ym => ym.startsWith(year))
      .map(ym => ym.split('-')[1]);
  };

  const availableMonths = selectedYear ? getAvailableMonthsForYear(selectedYear) : [];

  // Calculate table dimensions
  useEffect(() => {
    const calculateScrollbarWidth = () => {
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      document.body.appendChild(outer);
      
      const inner = document.createElement('div');
      outer.appendChild(inner);
      
      const width = outer.offsetWidth - inner.offsetWidth;
      
      document.body.removeChild(outer);
      
      return width;
    };
    
    const updateTableDimensions = () => {
      if (tableContainerRef.current) {
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
          }
        }, 200);
      }
    };
    
    updateTableDimensions();
    window.addEventListener('resize', updateTableDimensions);
    return () => window.removeEventListener('resize', updateTableDimensions);
  }, [correctionLogs]);

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

  // Format datetime for display in MM-dd HH:mm:ss format
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr || dateTimeStr === 'none') return '-';
    
    try {
      if (dateTimeStr.includes(' ')) {
        const [datePart, timePart] = dateTimeStr.split(' ');
        const [year, month, day] = datePart.split('-');
        return `${month}-${day} ${timePart || ''}`;
      } else if (dateTimeStr.includes('-')) {
        const [year, month, day] = dateTimeStr.split('-');
        return `${month}-${day}`;
      }
      return dateTimeStr;
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateTimeStr;
    }
  };

  // Render type as colored tag
  const renderTypeTag = (type) => {
    const tagClass = type === '추가' ? styles.tagBlue : styles.tagOrange;
    return <span className={`${styles.typeTag} ${tagClass}`}>{type}</span>;
  };

  // Handle year change
  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    setSelectedMonth('');
    setCorrectionLogs([]);
    setHasSearched(false);
  };

  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setHasSearched(false);
  };

  // Load correction logs data
  const loadCorrectionLogs = async () => {
    if (!selectedYear || !selectedMonth) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const yearMonth = `${selectedYear}-${selectedMonth}`;
      const response = await fetch(`/api/attendance-correction-logs?yearMonth=${yearMonth}`);

      if (!response.ok) {
        throw new Error('Failed to fetch correction logs');
      }

      const data = await response.json();
      setCorrectionLogs(data);
    } catch (error) {
      console.error('Error fetching correction logs:', error);
      setCorrectionLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset search state when switching tabs
    if (tab !== activeTab) {
      setHasSearched(false);
      setCorrectionLogs([]);
    }
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'correction' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('correction')}
          >
            출결자료정정대장
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'consent' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('consent')}
          >
            개인정보동의서관리대장
          </button>
        </div>
      </div>

      {activeTab === 'correction' ? (
        <>
          <div className={styles.cardHeader}>
            <div className={styles.headerWithAction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>출결자료정정대장</h3>
              <div className={styles.attendanceLegend} style={{ display: 'flex', marginLeft: 'auto', gap: '15px' }}>
                <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={`${styles.typeTag} ${styles.tagBlue}`}>추가</span>
                  <span>출결정보 추가</span>
                </div>
                <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={`${styles.typeTag} ${styles.tagOrange}`}>수정</span>
                  <span>출결정보 수정</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchGroup}>
              <label>기간 선택</label>
              <div className={styles.searchControls}>
                <select 
                  className={styles.select}
                  value={selectedYear}
                  onChange={handleYearChange}
                  disabled={isLoading || availableYears.length === 0}
                >
                  <option value="">연도 선택</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
                
                <select 
                  className={styles.select}
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  disabled={isLoading || !selectedYear || availableMonths.length === 0}
                >
                  <option value="">월 선택</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
                
                <button 
                  className={styles.searchButton}
                  onClick={loadCorrectionLogs}
                  disabled={isLoading || !selectedYear || !selectedMonth}
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
            style={{ position: 'relative' }}
          >
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <i className="fas fa-spinner fa-spin"></i>
                <span>출결정정 데이터를 불러오는 중...</span>
              </div>
            ) : hasSearched ? (
              correctionLogs.length > 0 ? (
                <div className={styles.tableWrapperWithScrollbar} style={{ 
                  width: '100%', 
                  position: 'relative',
                  border: '1px solid #dee2e6'
                }}>
                  <div 
                    className={styles.headerTableContainer} 
                    style={{ 
                      overflow: 'hidden',
                      borderBottom: '1px solid #adb5bd',
                      position: 'relative',
                      zIndex: 10,
                      background: 'white',
                      boxSizing: 'border-box'
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
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '30%' }} />
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
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>처리자</th>
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>종류</th>
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>처리리일시</th>
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>정정 전</th>
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>정정 후</th>
                          <th rowSpan="2" style={{ 
                            border: '1px solid #dee2e6', 
                            borderTop: 'none' 
                          }}>정정 사유</th>
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
                  
                  <div 
                    ref={bodyTableRef}
                    className={styles.bodyTableContainer} 
                    style={{ 
                      maxHeight: 'calc(100vh - 530px)', 
                      height: 'calc(100vh - 530px)',
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
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '30px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '30%' }} />
                      </colgroup>
                      <tbody>
                        {correctionLogs.map((log, index) => {
                          const { grade, class: classNum, number } = parseStudentId(log.stdid);
                          return (
                            <tr key={index}>
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
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none' 
                              }}>{log.name}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none' 
                              }}>{log.tran_by}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none',
                                textAlign: 'center'
                              }}>{renderTypeTag(log.type)}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none' 
                              }}>{formatDateTime(log.tran_date)}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none' 
                              }}>{formatDateTime(log.original_date)}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none' 
                              }}>{formatDateTime(log.modified_date)}</td>
                              <td style={{ 
                                border: '1px solid #dee2e6', 
                                borderTop: 'none',
                                textAlign: 'left',
                                padding: '0 8px'
                              }}>{log.reason}</td>
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
                  <span>선택한 기간의 출결정정 데이터가 없습니다. 다른 기간을 선택하거나 '조회' 버튼을 눌러주세요.</span>
                </div>
              )
            ) : (
              <div className={styles.noDataMessage}>
                <i className="fas fa-info-circle"></i>
                <span>연도와 월을 선택한 후 '조회' 버튼을 눌러주세요.</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.cardHeader}>
            <div className={styles.headerWithAction} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>개인정보동의서관리대장</h3>
              <div className={styles.attendanceLegend} style={{ display: 'flex', marginLeft: 'auto', gap: '15px' }}>
                <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={`${styles.typeTag} ${styles.tagBlue}`}>제출</span>
                  <span>개인정보동의서 제출</span>
                </div>
                <div className={styles.legendItem} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={`${styles.typeTag} ${styles.tagOrange}`}>미제출</span>
                  <span>개인정보동의서 미제출</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchGroup}>
              <label>기간 선택</label>
              <div className={styles.searchControls}>
                <select 
                  className={styles.select}
                  value={selectedYear}
                  onChange={handleYearChange}
                  disabled={isLoading}
                >
                  <option value="">연도 선택</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
                
                <select 
                  className={styles.select}
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  disabled={isLoading || !selectedYear}
                >
                  <option value="">월 선택</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
                
                <button 
                  className={styles.searchButton}
                  onClick={() => {}} // Placeholder for consent logs search function
                  disabled={isLoading || !selectedYear || !selectedMonth}
                >
                  {isLoading ? 
                    <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                    <><i className="fas fa-search"></i> 조회</>
                  }
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.tableContainer} style={{ position: 'relative' }}>
            <div className={styles.noDataMessage}>
              <i className="fas fa-info-circle"></i>
              <span>연도와 월을 선택한 후 '조회' 버튼을 눌러주세요.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
