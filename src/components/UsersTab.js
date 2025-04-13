import React from 'react';
import AttendanceManager from './attendanceManage/AttendanceManager';
import styles from '@/styles/Dashboard.module.css';

export default function UsersTab({ userName }) {
  return (
    <div className={styles.tabContent}>
      <AttendanceManager userName={userName} />
    </div>
  );
}