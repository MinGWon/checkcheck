import styles from "@/styles/Dashboard.module.css";
import { useState } from "react";
import AttendanceCorrectionLog from "./attendanceManage/AttendanceCorrectionLog";

export default function DocsTab() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className={styles.pageContent}>
      <AttendanceCorrectionLog isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
}