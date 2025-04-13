import { useState, useEffect } from "react";
import styles from "@/styles/Dashboard.module.css";
import UpdateLogsList from "./updatelogs/UpdateLogsList";
import UpdateLogsFilter from "./updatelogs/UpdateLogsFilter";

export default function UpdateLogs() {
  const [updateLogs, setUpdateLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Define update types for filtering
  const updateTypes = [
    { id: 'all', label: '전체' },
    { id: '기능 추가', label: '기능 추가' },
    { id: '버그 수정', label: '버그 수정' },
    { id: '성능 개선', label: '성능 개선' },
    { id: '보안 패치', label: '보안 패치' }
  ];

  useEffect(() => {
    const fetchUpdateLogs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/updatelogs');
        
        if (!response.ok) {
          throw new Error('업데이트 기록을 불러오는데 실패했습니다');
        }
        
        const data = await response.json();
        setUpdateLogs(data);
        setFilteredLogs(data);
      } catch (err) {
        console.error('Error fetching update logs:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdateLogs();
  }, []);

  // Apply filters whenever filter settings change
  useEffect(() => {
    let result = [...updateLogs];
    
    // Filter by type
    if (activeFilter !== 'all') {
      result = result.filter(log => log.type === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.detail.toLowerCase().includes(query) || 
        log.ver.toString().includes(query) ||
        log.type.toLowerCase().includes(query)
      );
    }
    
    setFilteredLogs(result);
  }, [updateLogs, activeFilter, searchQuery]);

  // Convert markdown-like syntax to HTML
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Basic markdown parsing (could use a library like react-markdown for more complex needs)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
      .replace(/\n/g, '<br />');                         // Line breaks
  };

  // Get appropriate badge style based on update type
  const getTypeStyle = (type) => {
    const typeMap = {
      '버그 수정': styles.badgeBugfix || 'bg-red-100 text-red-800',
      '기능 추가': styles.badgeFeature || 'bg-green-100 text-green-800',
      '성능 개선': styles.badgePerformance || 'bg-blue-100 text-blue-800',
      '보안 패치': styles.badgeSecurity || 'bg-yellow-100 text-yellow-800'
    };
    
    return typeMap[type] || styles.badgeDefault || 'bg-gray-100';
  };

  // Handle filter changes
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  // Handle search query changes
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.pageDescription}>CheckCheck의 기능 추가 및 개선 사항을 확인하세요.</p>
        </header>

        <div className={styles.controlsContainer}>
          {/* Enhanced Search Input */}
          <div className={styles.searchWrapper}>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                placeholder="업데이트 내용 검색..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={styles.enhancedSearchInput}
              />
              {searchQuery ? (
                <button 
                  className={styles.searchClearButton}
                  onClick={() => handleSearchChange('')}
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              ) : (
                <span className={styles.searchIcon}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 19L13.8 13.8M16 8.5C16 12.6421 12.6421 16 8.5 16C4.35786 16 1 12.6421 1 8.5C1 4.35786 4.35786 1 8.5 1C12.6421 1 16 4.35786 16 8.5Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Filter Buttons */}
          <div className={styles.filterButtonsWrapper}>
            {updateTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleFilterChange(type.id)}
                className={`${styles.enhancedFilterButton} ${activeFilter === type.id ? styles.activeEnhancedFilter : ''}`}
              >
                {type.id === '기능 추가' && (
                  <span className={`${styles.filterDot} ${styles.dotFeature}`}></span>
                )}
                {type.id === '버그 수정' && (
                  <span className={`${styles.filterDot} ${styles.dotBugfix}`}></span>
                )}
                {type.id === '성능 개선' && (
                  <span className={`${styles.filterDot} ${styles.dotPerformance}`}></span>
                )}
                {type.id === '보안 패치' && (
                  <span className={`${styles.filterDot} ${styles.dotSecurity}`}></span>
                )}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={styles.statusMessage}>
            <p>업데이트 기록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className={styles.statusMessage}>
            <p className={styles.errorText}>오류가 발생했습니다: {error}</p>
            <button className={styles.button} onClick={() => window.location.reload()}>
              다시 시도
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.statusMessage}>
            <p>표시할 업데이트 기록이 없습니다.</p>
            {activeFilter !== 'all' && (
              <button className={styles.button} onClick={() => setActiveFilter('all')}>
                모든 업데이트 보기
              </button>
            )}
          </div>
        ) : (
          <div className={styles.cardsContainer}>
            {Object.entries(groupByDate(filteredLogs)).map(([date, logs]) => (
              <div key={date} className={styles.dateGroup}>
                {/* Remove date display from the header */}
                <div className={styles.dateHeader} style={{ display: 'none' }}>
                  <span className={styles.dateBadge}>{date}</span>
                  <hr className={styles.dateDivider} />
                </div>
                
                <div className={styles.cardsGrid}>
                  {logs.map((log, index) => (
                    <div key={index} className={styles.updateCard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.versionPill}>v{log.ver}</span>
                        <span className={`${styles.typePill} ${getTypeStyle(log.type)}`}>
                          {log.type}
                        </span>
                        <span className={`${styles.typePill} ${styles.datePill}`} style={{backgroundColor: '#F0F0F0', color: '#666666', marginLeft: 'auto'}}>
                          {log.date}
                        </span>
                      </div>
                      
                      <div className={styles.cardBody}>
                        <div 
                          className={styles.cardContent}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(log.detail) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className={styles.cardsFooter}>
              <div className={styles.countIndicator}>
                총 <span className={styles.countNumber}>{filteredLogs.length}</span>개의 업데이트
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Group logs by date for better organization
function groupByDate(logs) {
  const grouped = {};
  logs.forEach(log => {
    if (!grouped[log.date]) {
      grouped[log.date] = [];
    }
    grouped[log.date].push(log);
  });
  return grouped;
}