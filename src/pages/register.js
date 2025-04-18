import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { useRouter } from "next/router";
import Swal from 'sweetalert2'; // Import SweetAlert2

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Register() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ccode, setCcode] = useState(""); // New state for C code
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simple validation
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // C code validation
    if (!ccode) {
      setError("C코드를 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      // First validate the C code
      const codeResponse = await fetch("/api/auth/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: ccode }),
      });

      const codeData = await codeResponse.json();

      if (!codeResponse.ok) {
        // Use SweetAlert2 for invalid C code message
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: '유효하지 않은 C코드입니다.',
          confirmButtonText: '확인'
        });
        setLoading(false);
        return;
      }

      // If code is valid, proceed with registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password, name, email, ccode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful registration
        router.push("/?registered=true");
      } else {
        setError(data.message || "회원가입에 실패했습니다.");
      }
    } catch (err) {
      setError("회원가입 처리 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>회원가입</title>
        <meta name="description" content="MySQL 기반 로그인 시스템 회원가입" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${geistSans.variable} ${geistMono.variable}`}>
        <div className={styles.loginContainer}>
          <h1 className={styles.title}>회원가입</h1>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form onSubmit={handleRegister} className={styles.form}>
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
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="ccode">C코드</label>
              <input
                type="text"
                id="ccode"
                value={ccode}
                onChange={(e) => setCcode(e.target.value)}
                required
                className={styles.input}
                placeholder="C코드 입력"
              />
              <small className={styles.helperText}>
                <i>예: C12345678</i>
              </small>
            </div>
            
            <button 
              type="submit" 
              className={styles.button}
              disabled={loading}
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>
          
          <p className={styles.registerText}>
            이미 계정이 있으신가요? <a href="/" className={styles.link}>로그인</a>
          </p>
        </div>
      </main>
    </>
  );
}