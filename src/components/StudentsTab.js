import styles from "@/styles/Dashboard.module.css";
import { useState, useEffect } from "react";
import Swal from 'sweetalert2'; // Import SweetAlert2

// Add inline styles for enhanced statistics display
const inlineStyles = {
  enhancedStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    margin: '1rem 0'
  },
  enhancedStatsCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  statsCardTitle: {
    borderBottom: '1px solid #eaeaea',
    paddingBottom: '10px',
    marginBottom: '15px',
    fontWeight: '600',
    color: '#333'
  },
  chartCardContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '1rem'
  },
  statsChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '200px',
    marginTop: '1rem',
    padding: '0 1rem'
  },
  chartBarWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px'
  },
  chartBarContainer: {
    height: '200px',
    width: '40px',
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '10px'
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#4dabf7',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    transition: 'height 0.3s ease',
    minHeight: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  chartLabelContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  chartLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '2px'
  },
  chartValue: {
    fontSize: '0.8rem',
    color: '#555'
  },
  horizontalChartContainer: {
    padding: '0.5rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  horizontalStatItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  horizontalStatLabel: {
    width: '50px',
    fontWeight: '600',
    textAlign: 'right',
    marginRight: '10px',
    fontSize: '0.9rem'
  },
  horizontalBarContainer: {
    flex: '1',
    backgroundColor: '#f1f3f5',
    height: '24px',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden'
  },
  horizontalBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    transition: 'width 0.3s ease',
    minWidth: '10px',
    display: 'flex',
    alignItems: 'center'
  },
  horizontalBarValue: {
    position: 'absolute',
    right: '10px',
    color: '#333',
    fontSize: '0.8rem',
    fontWeight: '600',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  statsDataContainer: {
    marginTop: '1rem',
    borderTop: '1px solid #eaeaea',
    paddingTop: '1rem'
  },
  statsDataTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  statsTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    padding: '8px 0',
    borderBottom: '1px solid #eaeaea',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.9rem'
  },
  statsTableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    padding: '8px 0',
    borderBottom: '1px solid #f5f5f5',
    fontSize: '0.9rem'
  },
  containerBox: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '20px',
    margin: '10px 0',
    border: '1px solid #e6e6e6'
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '15px',
    border: '1px solid #e6e6e6'
  },
  barBase: {
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    height: '25px',
    width: '100%',
    position: 'relative',
    marginBottom: '8px'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4a6bdf',
    borderRadius: '4px',
    position: 'absolute',
    left: 0,
    top: 0,
    transition: 'width 0.5s ease'
  },
  barLabel: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#333',
    fontWeight: '600',
    fontSize: '0.85rem',
    zIndex: 1
  },
  barValue: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#333',
    fontWeight: '600',
    fontSize: '0.85rem',
    zIndex: 1
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px'
  }
};

export default function StudentsTab() {
  // Apply the inline styles to your component
  const styles = { ...require("@/styles/Dashboard.module.css"), ...inlineStyles };

  const [activeTab, setActiveTab] = useState('studentList');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const studentsPerPage = 10;
  
  // New state variables for statistics
  const [statsLoading, setStatsLoading] = useState(false);
  const [classStats, setClassStats] = useState({});
  const [gradeStats, setGradeStats] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  // Form state for the student registration
  const [formData, setFormData] = useState({
    fid: '',
    stdid: '',
    name: ''
  });
  
  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        // Fetch students data from students table
        const response = await fetch('/api/students');
        const data = await response.json();
        
        // Sort students by grade, class, and number
        const sortedStudents = [...data].sort((a, b) => {
          const idA = parseStudentId(a.stdid);
          const idB = parseStudentId(b.stdid);
          
          // Compare grade (ascending)
          if (parseInt(idA.grade) !== parseInt(idB.grade)) {
            return parseInt(idA.grade) - parseInt(idB.grade);
          }
          
          // If grade is the same, compare class (ascending)
          if (parseInt(idA.class) !== parseInt(idB.class)) {
            return parseInt(idA.class) - parseInt(idB.class);
          }
          
          // If grade and class are the same, compare number (ascending)
          return parseInt(idA.number) - parseInt(idB.number);
        });
        
        setStudents(sortedStudents);
        
        // Extract available classes and grades for the filter options
        const classes = new Set();
        const grades = new Set();
        
        sortedStudents.forEach(student => {
          const parsedId = parseStudentId(student.stdid);
          if (parsedId.class !== '-') classes.add(parsedId.class);
          if (parsedId.grade !== '-') grades.add(parsedId.grade);
        });
        
        setAvailableClasses(Array.from(classes).sort());
        
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (activeTab === 'studentList' || activeTab === 'statistics') {
      fetchStudents();
    }
  }, [activeTab]);

  // Calculate total pages whenever students array changes
  useEffect(() => {
    if (students.length > 0) {
      setTotalPages(Math.ceil(students.length / studentsPerPage));
    } else {
      setTotalPages(1);
    }
  }, [students]);

  // Helper function to parse student ID into grade, class, and number
  const parseStudentId = (stdid) => {
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

  // Get current students for the page
  const getCurrentPageStudents = () => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return students.slice(startIndex, endIndex);
  };

  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    // Map form field IDs to formData keys
    const fieldMap = {
      'fingerprintId': 'fid',
      'studentId': 'stdid',
      'studentName': 'name'
    };
    
    setFormData({
      ...formData,
      [fieldMap[id] || id]: value
    });
  };
  
  // Form validation
  const validateForm = () => {
    // Check that all fields are filled
    if (!formData.fid || !formData.stdid || !formData.name) {
      return false;
    }
    
    // Fingerprint ID should be numeric
    if (isNaN(formData.fid)) {
      return false;
    }
    
    // Student ID validation (3-4 digits)
    if (!/^\d{3,4}$/.test(formData.stdid)) {
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Show SweetAlert2 confirmation dialog
      Swal.fire({
        title: '등록 확인',
        html: `
          <p>정말 등록하시겠습니까?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '예',
        cancelButtonText: '아니요'
      }).then((result) => {
        if (result.isConfirmed) {
          handleConfirmSubmit();
        }
      });
    } else {
      Swal.fire({
        title: '입력 오류',
        text: '모든 필드를 올바르게 입력해주세요.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    }
  };
  
  // Handle final confirmation and submission to API
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Call API to submit the student data
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '서버 오류가 발생했습니다.');
      }
      
      // Reset form and show success message
      setFormData({ fid: '', stdid: '', name: '' });
      Swal.fire({
        title: '등록 완료',
        text: '학생 정보가 성공적으로 등록되었습니다.',
        icon: 'success',
        confirmButtonText: '확인'
      });
      setActiveTab('addStudent'); // Go back to list view
      
      // Refresh the student list
      const fetchStudents = async () => {
        const response = await fetch('/api/students');
        const data = await response.json();
        setStudents(data);
      };
      fetchStudents();
      
    } catch (error) {
      console.error('Error submitting student data:', error);
      Swal.fire({
        title: '등록 오류',
        text: error.message || '학생 등록 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
  };

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to calculate statistics
  const calculateStatistics = () => {
    setStatsLoading(true);
    
    // Simulate network delay to show loading animation
    // (In a real app, you'd remove this setTimeout and just rely on the actual data fetching time)
    setTimeout(() => {
      try {
        // Calculate stats per class
        const classCountData = {};
        const gradeCountData = {};
        
        students.forEach(student => {
          const { grade, class: classNum } = parseStudentId(student.stdid);
          
          // Skip invalid IDs
          if (grade === '-' || classNum === '-') return;
          
          // Count by class
          if (!classCountData[classNum]) {
            classCountData[classNum] = 0;
          }
          classCountData[classNum]++;
          
          // Count by grade
          if (!gradeCountData[grade]) {
            gradeCountData[grade] = 0;
          }
          gradeCountData[grade]++;
        });
        
        // Filter by selected grade if not "all"
        if (selectedGrade !== 'all') {
          const filteredClassStats = {};
          
          Object.keys(classCountData).forEach(classNum => {
            // Check if any student in this class belongs to the selected grade
            if (students.some(student => {
              const parsed = parseStudentId(student.stdid);
              return parsed.grade === selectedGrade && parsed.class === classNum;
            })) {
              // Get count of students in this class with the selected grade
              filteredClassStats[classNum] = students.filter(student => {
                const parsed = parseStudentId(student.stdid);
                return parsed.grade === selectedGrade && parsed.class === classNum;
              }).length;
            }
          });
          
          // Set the filtered class stats
          setClassStats(filteredClassStats);
          
          // Only include the selected grade in grade stats
          const filteredGradeStats = {};
          filteredGradeStats[selectedGrade] = gradeCountData[selectedGrade];
          setGradeStats(filteredGradeStats);
        } else {
          // Set the statistics for all grades
          setClassStats(classCountData);
          setGradeStats(gradeCountData);
        }
        
      } catch (error) {
        console.error('Error calculating statistics:', error);
      } finally {
        setStatsLoading(false);
      }
    }, 800); // Show loading for at least 800ms for better UX
  };

  // Get the maximum value for scaling the chart bars
  const getMaxClassCount = () => {
    if (Object.keys(classStats).length === 0) return 0;
    return Math.max(...Object.values(classStats));
  };
  
  const handleGradeChange = (e) => {
    setSelectedGrade(e.target.value);
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'studentList' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('studentList')}
          >
            학생 목록
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'addStudent' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('addStudent')}
          >
            학생 등록
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'statistics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            통계
          </button>
        </div>
      </div>

      {activeTab === 'studentList' && (
        <>
          <div className={styles.cardHeader}>
            <div className={styles.headerWithAction}>
              <h3>학생 목록</h3>

            </div>
          </div>
          
          <div className={styles.tableContainer}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <i className="fas fa-spinner fa-spin"></i>
                <span>학생 데이터를 불러오는 중...</span>
              </div>
            ) : (
              <>
                <table className={styles.attendanceTable}>
                  <thead>
                    <tr>
                      <th colSpan="3" className={styles.groupHeader}>학번</th>
                      <th rowSpan="2" className={styles.nameCell} style={{ width: '80px' }}>이름</th>
                      <th rowSpan="2" className={styles.idCell}>지문번호</th>
                      <th rowSpan="2">관리</th>
                    </tr>
                    <tr>
                      <th>학년</th>
                      <th>반</th>
                      <th>번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageStudents().map(student => {
                      const { grade, class: classNum, number } = parseStudentId(student.stdid);
                      return (
                        <tr key={student.fid}>
                          <td className={styles.idCell}>{grade}</td>
                          <td className={styles.idCell}>{classNum}</td>
                          <td className={styles.idCell}>{number}</td>
                          <td className={styles.nameCell}>{student.name}</td>
                          <td className={styles.idCell}>{student.fid}</td>
                          <td className={styles.actionCell}>
                            <button className={styles.iconButton} title="수정">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className={styles.iconButton} title="삭제">
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {students.length === 0 && !isLoading && (
                  <div className={styles.noDataMessage}>
                    <i className="fas fa-info-circle"></i>
                    <span>등록된 학생이 없습니다.</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton} 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1 || isLoading}
            >
              이전
            </button>
            <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
            <button 
              className={styles.paginationButton} 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages || isLoading}
            >
              다음
            </button>
          </div>
        </>
      )}

      {activeTab === 'addStudent' && (
        <div className={styles.formContainer}>
          <div className={styles.cardHeader}>
            <div className={styles.headerWithAction}>
              <h3>학생 등록</h3>
            </div>
          </div>

          <form className={styles.formGrid} onSubmit={(e) => e.preventDefault()}>
            <div className={`${styles.formGroup} ${styles.enhancedInput}`}>
              <label htmlFor="fingerprintId">
                <i className="fas fa-fingerprint"></i> 지문 ID
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  type="number" 
                  id="fingerprintId" 
                  className={`${styles.formControl} ${styles.roundedInput}`}
                  placeholder="지문 번호"
                  value={formData.fid}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className={`${styles.formGroup} ${styles.enhancedInput}`}>
              <label htmlFor="studentId">
                <i className="fas fa-id-card"></i> 학번
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  type="text" 
                  id="studentId" 
                  className={`${styles.formControl} ${styles.roundedInput}`}
                  placeholder="예: 3102 (학년-반-번호)" 
                  value={formData.stdid}
                  onChange={handleInputChange}
                  required
                  pattern="\d{3,4}"
                  title="3~4자리 숫자로 입력해주세요."
                />
                <div className={styles.inputInfo}>
                  <small className={styles.formText}>
                    첫째 자리: 학년, 둘째 자리: 반, 나머지: 번호 (예: 3102)
                  </small>
                </div>
              </div>
            </div>
            <div className={`${styles.formGroup} ${styles.enhancedInput}`}>
              <label htmlFor="studentName">
                <i className="fas fa-user"></i> 이름
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  type="text"
                  id="studentName" 
                  className={`${styles.formControl} ${styles.roundedInput}`}
                  placeholder="학생 이름"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            {/* Preview section for print functionality - moved above the button */}
            <div className={styles.previewContainer}>
              <h4>등록신청서 (미리보기)</h4>
              <div className={styles.studentPreviewCard}>
                <table className={styles.previewTable}>
                  <tbody>
                    <tr>
                      <th>지문 ID</th>
                      <td>{formData.fid || '-'}</td>
                    </tr>
                    <tr>
                      <th>학번</th>
                      <td>
                        {formData.stdid ? (
                          <>
                            {parseStudentId(formData.stdid).grade}학년 {parseStudentId(formData.stdid).class}반 {parseStudentId(formData.stdid).number}번
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>이름</th>
                      <td>{formData.name || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className={styles.formActionCenter}>
              <button 
                type="button" 
                className={styles.searchButton} 
                onClick={handleSubmit}
                style={{ width: '100%', maxWidth: '200px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> 처리 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i> 학생 등록하기
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Hidden div for printing */}
          <div className="print-preview" style={{ display: 'none' }}>
            <div className="student-card">
              <h5>학생 정보</h5>
              <table className="preview-table">
                <tbody>
                  <tr>
                    <th>지문 ID</th>
                    <td>{formData.fid || '-'}</td>
                  </tr>
                  <tr>
                    <th>학번</th>
                    <td>
                      {formData.stdid ? (
                        <>
                          {parseStudentId(formData.stdid).grade}학년 {parseStudentId(formData.stdid).class}반 {parseStudentId(formData.stdid).number}번
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>이름</th>
                    <td>{formData.name || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="form-navigation">
            <button className="back-button" onClick={() => setActiveTab('studentList')}>
              <i className="fas fa-arrow-left"></i> 목록으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className={styles.statsContainer}>
          <div className={styles.cardHeader}>
            <div className={styles.headerWithAction}>
              <h3>학생 통계</h3>
            </div>
          </div>
          
          {/* Search controls in a separate container similar to MonthlyAttendance.js */}
          <div className={styles.searchContainer}>
            <div className={styles.searchGroup}>
              <label htmlFor="gradeSelect">학년 선택</label>
              <div className={styles.searchControls}>
                <select 
                  id="gradeSelect" 
                  className={styles.select}
                  value={selectedGrade}
                  onChange={handleGradeChange}
                >
                  <option value="all">전체</option>
                  {Object.keys(gradeStats).length > 0 && 
                    Object.keys(gradeStats).sort().map(grade => (
                      <option key={grade} value={grade}>
                        {grade}학년
                      </option>
                    ))
                  }
                </select>
                
                <button 
                  className={styles.searchButton}
                  onClick={calculateStatistics}
                  disabled={statsLoading}
                >
                  {statsLoading ? 
                    <><i className="fas fa-spinner fa-spin"></i> 처리 중...</> : 
                    <><i className="fas fa-search"></i> 조회</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Data display area in a separate container */}
          <div className={styles.statsContainer}>
            {statsLoading ? (
              <div className={styles.loadingContainer}>
                <i className="fas fa-spinner fa-spin"></i>
                <span>통계 데이터를 불러오는 중...</span>
              </div>
            ) : (
              <div className={styles.statsGrid} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px'
              }}>
                {/* Grade-wise statistics in left container */}
                <div className={styles.containerBox} style={styles.containerBox}>
                  <h4 className={styles.sectionTitle}>학년별 학생수</h4>
                  
                  {Object.keys(gradeStats).length > 0 ? (
                    <>
                      {/* Vertical bar graph for grades */}
                      <div className={styles.chartContainer} style={styles.chartContainer}>
                        <div className={styles.statsChart} style={{
                          display: 'flex',
                          justifyContent: 'space-around',
                          height: '250px',
                          alignItems: 'flex-end',
                          padding: '0 20px'
                        }}>
                          {Object.keys(gradeStats).sort().map(grade => {
                            const maxCount = Math.max(...Object.values(gradeStats));
                            const percentage = (gradeStats[grade] / maxCount) * 100;
                            
                            return (
                              <div key={grade} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '60px'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  height: '200px'
                                }}>
                                  <div style={{
                                    width: '40px',
                                    backgroundColor: '#4a6bdf',
                                    borderTopLeftRadius: '4px',
                                    borderTopRightRadius: '4px',
                                    height: `${percentage}%`,
                                    minHeight: '20px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                  }}>
                                    <span style={{
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      padding: '3px 0'
                                    }}>{gradeStats[grade]}</span>
                                  </div>
                                </div>
                                <div style={{ 
                                  marginTop: '8px',
                                  fontWeight: 'bold',
                                  fontSize: '14px'
                                }}>{grade}학년</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Tabular data for grades */}
                      <div className={styles.statsDataContainer} style={{ marginTop: '20px' }}>
                        <div className={styles.statsDataTable} style={{
                          width: '100%',
                          borderCollapse: 'collapse'
                        }}>
                          <div className={styles.statsTableHeader} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            padding: '10px',
                            backgroundColor: '#f5f7fa',
                            fontWeight: 'bold',
                            borderRadius: '4px 4px 0 0'
                          }}>
                            <span>학년</span>
                            <span>학생수</span>
                          </div>
                          {Object.keys(gradeStats).sort().map(grade => (
                            <div key={grade} className={styles.statsTableRow} style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              padding: '10px',
                              borderBottom: '1px solid #edf2f7'
                            }}>
                              <span>{grade}학년</span>
                              <span>{gradeStats[grade]}명</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.noDataMessage}>
                      <i className="fas fa-info-circle"></i>
                      <span>조회 버튼을 눌러 통계를 확인하세요.</span>
                    </div>
                  )}
                </div>
                
                {/* Class-wise statistics in right container */}
                <div className={styles.containerBox} style={styles.containerBox}>
                  <h4 className={styles.sectionTitle}>반별 학생수</h4>
                  
                  {Object.keys(classStats).length > 0 ? (
                    <>
                      {/* Horizontal bar graph for classes */}
                      <div className={styles.chartContainer} style={styles.chartContainer}>
                        {Object.keys(classStats).sort().map(classNum => {
                          const maxCount = getMaxClassCount();
                          const percentage = maxCount > 0 ? (classStats[classNum] / maxCount) * 100 : 0;
                          
                          return (
                            <div key={classNum} style={{ marginBottom: '15px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                <span style={{ width: '50px', fontWeight: 'bold', fontSize: '14px' }}>{classNum}반</span>
                                <span>{classStats[classNum]}명</span>
                              </div>
                              
                              <div style={styles.barBase}>
                                <div style={{
                                  ...styles.barFill,
                                  width: `${percentage}%`
                                }}></div>
                                <span style={styles.barValue}>{classStats[classNum]}명</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Tabular data for classes */}
                      <div className={styles.statsDataContainer} style={{ marginTop: '20px' }}>
                        <div className={styles.statsDataTable} style={{
                          width: '100%',
                          borderCollapse: 'collapse'
                        }}>
                          <div className={styles.statsTableHeader} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            padding: '10px',
                            backgroundColor: '#f5f7fa',
                            fontWeight: 'bold',
                            borderRadius: '4px 4px 0 0'
                          }}>
                            <span>반</span>
                            <span>학생수</span>
                          </div>
                          {Object.keys(classStats).sort().map(classNum => (
                            <div key={classNum} className={styles.statsTableRow} style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              padding: '10px',
                              borderBottom: '1px solid #edf2f7'
                            }}>
                              <span>{classNum}반</span>
                              <span>{classStats[classNum]}명</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.noDataMessage}>
                      <i className="fas fa-info-circle"></i>
                      <span>조회 버튼을 눌러 통계를 확인하세요.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}