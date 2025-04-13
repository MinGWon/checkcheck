import styles from "@/styles/Dashboard.module.css";

export default function UpdateLogsList({ logs, getTypeStyle, renderMarkdown }) {
  // Group logs by date for better organization
  const groupByDate = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupByDate(logs);

  return (
    <div className={styles.logsList}>
      {Object.entries(groupedLogs).map(([date, logsForDate]) => (
        <div key={date} className={styles.dateSection}>
          <h3 className={styles.dateHeader}>{date}</h3>
          
          {logsForDate.map((log, index) => (
            <div key={index} className={styles.logCard}>
              <div className={styles.logHeader}>
                <div className={styles.versionTag}>v{log.ver}</div>
                <div className={`${styles.typeTag} ${getTypeStyle(log.type)}`}>
                  {log.type}
                </div>
              </div>
              
              <div 
                className={styles.logContent}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(log.detail) }}
              />
            </div>
          ))}
        </div>
      ))}
      
      <div className={styles.footer}>
        <p>총 {logs.length}개의 업데이트</p>
      </div>
    </div>
  );
}
