import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";
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
  const [isExternal, setIsExternal] = useState(false);
  const [callback, setCallback] = useState("");
  const router = useRouter();

  useEffect(() => {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const external = urlParams.get('external');
    const callbackUrl = urlParams.get('callback');
    const token = urlParams.get('token'); // C# 애플리케이션에서 받은 토큰
    
    console.log("로그인 파라미터:", { external, callback: callbackUrl, token });
    
    // 외부 로그인 요청인 경우
    if (external === '1') {
      setIsExternal(true);
      
      // 콜백 URL이 있으면 저장
      if (callbackUrl) {
        setCallback(callbackUrl);
      }
      
      // 토큰이 있으면 저장 (C# 애플리케이션에서 전달)
      if (token) {
        console.log("토큰 저장:", token);
        // sessionStorage는 브라우저 탭 내에서만 유효하므로 더 안전
        sessionStorage.setItem('authToken', token);
      }
    }
  }, []);

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
        
        // Check if external login process with callback
        if (isExternal) {
          // 저장된 토큰 가져오기
          const token = sessionStorage.getItem('authToken') || '';
          console.log("로그인 성공, 토큰:", token);
          
          if (callback) {
            router.push(`/external-callback?callback=${encodeURIComponent(callback)}&token=${token}`);
          } else {
            router.push("/external-callback");
          }
        } else {
          // Normal redirect to dashboard
          router.push("/dashboard");
        }
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
