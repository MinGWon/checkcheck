import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { useRouter } from "next/router";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Session timeout in milliseconds (10 minutes)
const SESSION_TIMEOUT = 10 * 60 * 1000;

export default function Home() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Calculate session expiry time (current time + 10 minutes)
        const expiryTime = Date.now() + SESSION_TIMEOUT;
        
        // Store user data with expiry timestamp in localStorage
        localStorage.setItem("user", JSON.stringify({
          ...data.user,
          sessionExpiry: expiryTime
        }));
        
        // Redirect to dashboard after successful login
        router.push("/dashboard");
      } else {
        setError(data.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("로그인 처리 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>로그인 시스템</title>
        <meta name="description" content="MySQL 기반 로그인 시스템" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.loginContainer}>
          <h1 className={styles.title}>로그인</h1>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="userId">아이디</label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          
          <p className={styles.registerText}>
            계정이 없으신가요? <a href="/register" className={styles.link}>회원가입</a>
          </p>
        </div>
      </main>
    </>
  );
}
