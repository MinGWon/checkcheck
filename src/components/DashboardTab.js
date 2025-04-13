import styles from "@/styles/Dashboard.module.css";
import { useState, useEffect } from "react";

export default function DashboardTab() {
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    tardy: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: ''
  });

  useEffect(() => {
    // Update date and time
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date: YYYY년 MM월 DD일
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const formattedDate = `${year}년 ${month}월 ${day}일`;
      
      // Format time: HH:MM:SS
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}:${seconds}`;
      
      setCurrentDateTime({
        date: formattedDate,
        time: formattedTime
      });
    };
    
    // Update date/time immediately and then every second
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    
    async function fetchAttendanceStats() {
      try {
        const response = await fetch('/api/attendance-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        const data = await response.json();
        setAttendanceStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance stats:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    async function fetchRecentActivities() {
      try {
        const response = await fetch('/api/recent-activities');
        if (!response.ok) {
          throw new Error('Failed to fetch recent activities');
        }
        const data = await response.json();
        setRecentActivities(data);
        setActivitiesLoading(false);
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setActivitiesError(err.message);
        setActivitiesLoading(false);
      }
    }

    fetchAttendanceStats();
    fetchRecentActivities();
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to render status tag
  const renderStatusTag = (status) => {
    switch (status) {
      case 'present':
        return <span className={styles.statusTagPresent}>출석</span>;
      case 'late':
        return <span className={styles.statusTagLate}>지각</span>;
      case 'absent':
        return <span className={styles.statusTagAbsent}>미출석</span>;
      default:
        return null;
    }
  };

  // Helper function to get icon class based on status
  const getStatusIconClass = (status) => {
    switch (status) {
      case 'present':
        return "fas fa-user-check";
      case 'late':
        return "fas fa-user-clock";
      case 'absent':
        return "fas fa-user-times";
      default:
        return "fas fa-user";
    }
  };

  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>출석 학생</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.stat}>
            <i className="fas fa-user-check"></i>
            <div className={styles.statInfo}>
              {loading ? (
                <span className={styles.statValue}>로딩 중...</span>
              ) : error ? (
                <span className={styles.statValue}>오류 발생</span>
              ) : (
                <span className={styles.statValue}>{attendanceStats.present}</span>
              )}
              <span className={styles.statLabel}>출석 학생수</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>미출석 학생</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.stat}>
            <i className="fas fa-user-times"></i>
            <div className={styles.statInfo}>
              {loading ? (
                <span className={styles.statValue}>로딩 중...</span>
              ) : error ? (
                <span className={styles.statValue}>오류 발생</span>
              ) : (
                <span className={styles.statValue}>{attendanceStats.absent}</span>
              )}
              <span className={styles.statLabel}>미출석 학생수</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>지각 학생</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.stat}>
            <i className="fas fa-user-clock"></i>
            <div className={styles.statInfo}>
              {loading ? (
                <span className={styles.statValue}>로딩 중...</span>
              ) : error ? (
                <span className={styles.statValue}>오류 발생</span>
              ) : (
                <span className={styles.statValue}>{attendanceStats.tardy}</span>
              )}
              <span className={styles.statLabel}>지각 학생수</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>오늘은</h3>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.stat}>
            <i className="fas fa-calendar"></i>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{currentDateTime.date}</span>
              <span className={styles.statTimeValue}>{currentDateTime.time}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* New row for Recent Activities */}
      <div className={styles.fullWidthBreak}></div>
      
      <div className={`${styles.card} ${styles.largeCard}`}>
        <div className={styles.cardHeader}>
          <h3>최근 활동</h3>
        </div>
        <div className={styles.cardBody}>
          {activitiesLoading ? (
            <div className={styles.loadingContainer}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>최근 활동을 불러오는 중...</span>
            </div>
          ) : activitiesError ? (
            <div className={styles.errorContainer}>
              <i className="fas fa-exclamation-circle"></i>
              <span>최근 활동을 불러오는데 오류가 발생했습니다.</span>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className={styles.emptyContainer}>
              <i className="fas fa-info-circle"></i>
              <span>금일 출결 자료가 존재하지 않습니다.</span>
            </div>
          ) : (
            <ul className={styles.activityList}>
              {recentActivities.map((activity, index) => (
                <li key={index} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <i className={getStatusIconClass(activity.status)}></i>
                  </div>
                  <div className={styles.activityContent}>
                    <p>
                      {renderStatusTag(activity.status)} {activity.name} 학생이 출석했습니다.
                    </p>
                    <span className={styles.activityTime}>{activity.relativeTime}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}