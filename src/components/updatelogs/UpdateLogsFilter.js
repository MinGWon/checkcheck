import styles from "@/styles/Dashboard.module.css";

export default function UpdateLogsFilter({ types, activeFilter, onFilterChange, searchQuery, onSearchChange }) {
  return (
    <div className={styles.filterSection}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="업데이트 내용 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button 
            className={styles.clearButton}
            onClick={() => onSearchChange('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.filterButtons}>
        {types.map(type => (
          <button
            key={type.id}
            className={`${styles.filterButton} ${activeFilter === type.id ? styles.activeFilter : ''}`}
            onClick={() => onFilterChange(type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
