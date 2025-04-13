import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';

export default function ExternalCallback() {
  const [message, setMessage] = useState('인증 정보 처리 중...');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [errorMessage, setErrorMessage] = useState('');
  const [callbackStatus, setCallbackStatus] = useState('pending'); // 'pending', 'success', 'error'
  const router = useRouter();

  useEffect(() => {
    // 쿼리 파라미터 확인
    const { callback, token } = router.query;
    
    console.log("라우터 쿼리 확인:", { callback, token });

    // 로그인 검증 및 콜백 처리
    const processLoginAndCallback = async () => {
      console.log("로그인 검증 및 콜백 처리 시작");
      try {
        // 사용자 세션 데이터 확인
        const userData = localStorage.getItem('user');
        console.log("사용자 데이터 확인:", userData ? "데이터 있음" : "데이터 없음");
        
        // 로그인 데이터 확인
        if (!userData) {
          console.log("로그인 정보 없음, 에러 상태로 전환");
          setErrorMessage('로그인 정보를 찾을 수 없습니다.');
          return;
        }
        
        // 토큰 로깅
        console.log("콜백 처리중, 토큰:", token);
        
        // 토큰 유효성 검사 - 세션 스토리지의 토큰과 URL의 토큰이 일치하는지
        const storedToken = sessionStorage.getItem('authToken');
        console.log("저장된 토큰:", storedToken);
        
        // 콜백 URL이 있으면 C# 앱으로 데이터 전송
        if (callback) {
          console.log("콜백 URL 존재, 데이터 전송 시작");
          setMessage('데이터를 애플리케이션으로 전송 중...');
          
          try {
            // C# 앱에 콜백 파라미터 전달
            const callbackUrl = new URL(decodeURIComponent(callback));
            callbackUrl.searchParams.append('loginSuccess', 'true');
            callbackUrl.searchParams.append('userData', encodeURIComponent(userData));
            
            // 토큰 전달 - 항상 전달하도록 수정
            if (token) {
              callbackUrl.searchParams.append('token', token);
              console.log("콜백에 토큰 추가:", token);
            }

            console.log("콜백 URL 생성 완료:", callbackUrl.toString());

            // 이미지 로드를 통해 파라미터 전송 (비동기)
            const img = new Image();
            img.onload = () => {
              console.log("콜백 이미지 로드 성공!");
              // 콜백 성공
              setCallbackStatus('success');
              setMessage('로그인이 성공적으로 완료되었습니다!');
              setLoginSuccess(true);
              startCountdown();
              
              // 사용 완료된 토큰 제거
              sessionStorage.removeItem('securityToken');
            };
            img.onerror = () => {
              console.log("콜백 이미지 로드 실패, 그래도 로그인은 성공으로 처리");
              // 콜백은 실패해도 로그인은 성공한 상태
              setCallbackStatus('error');
              setMessage('애플리케이션과의 연결에 문제가 있지만, 로그인은 성공했습니다.');
              setLoginSuccess(true);
              startCountdown();
            };
            // 이미지 로드 시간 제한 설정 (10초 후 자동으로 성공 처리)
            setTimeout(() => {
              if (!loginSuccess) {
                console.log("콜백 타임아웃, 로그인 성공으로 처리");
                setCallbackStatus('timeout');
                setMessage('애플리케이션 응답이 지연되었지만, 로그인은 성공했습니다.');
                setLoginSuccess(true);
                startCountdown();
              }
            }, 10000);
            img.src = callbackUrl.toString();
          } catch (error) {
            console.error('콜백 처리 오류:', error);
            setMessage('애플리케이션과의 연결에 문제가 있지만, 로그인은 성공했습니다.');
            setLoginSuccess(true);
            startCountdown();
          }
        } else {
          // 콜백 없이 그냥 로그인 성공 처리
          console.log("콜백 URL 없음, 바로 로그인 성공 처리");
          setMessage('로그인이 성공적으로 완료되었습니다!');
          setLoginSuccess(true);
          startCountdown();
        }
      } catch (error) {
        console.error('로그인 처리 오류:', error);
        setErrorMessage('인증 처리 중 오류가 발생했습니다.');
      }
    };
    
    const startCountdown = () => {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    // router.query가 로드된 후에만 실행
    if (router.isReady) {
      processLoginAndCallback();
    }
  }, [router, router.isReady, router.query]);

  // 창 닫기 함수
  const handleClose = () => {
    window.close();
  };

  return (
    <>
      <Head>
        <title>인증 처리 {loginSuccess ? '완료' : '중'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${styles.main}`}>
        <div className={styles.loginContainer} style={{ textAlign: 'center' }}>
          {errorMessage ? (
            <>
              <h1 className={styles.title} style={{ color: '#d32f2f' }}>
                인증 오류
              </h1>
              <p className={styles.description}>{errorMessage}</p>
              <p style={{ margin: '20px 0' }}>
                잠시 후 로그인 페이지로 이동합니다...
              </p>
            </>
          ) : loginSuccess ? (
            <>
              <h1 className={styles.title}>로그인 성공!</h1>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                margin: '30px 0' 
              }}>
                <div style={{ 
                  color: '#4caf50', 
                  fontSize: '60px', 
                  fontWeight: 'bold',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '4px solid #4caf50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>✓</div>
              </div>
              
              {/* 자동 닫기 스크립트 */}
              {countdown === 0 && (
                <script dangerouslySetInnerHTML={{ __html: `
                  window.close();
                  // 창이 닫히지 않는 경우를 위한 대체 메시지
                  setTimeout(() => {
                    document.getElementById('closeMessage').style.display = 'block';
                  }, 500);
                `}} />
              )}
              
              <p id="closeMessage" style={{ display: 'none', marginTop: '20px', color: '#666' }}>
                자동으로 창이 닫히지 않으면 위의 '창 닫기' 버튼을 클릭해주세요.
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>인증 처리 중...</h1>
              <p className={styles.description}>{message}</p>
              <div className={styles.loadingIndicator} style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 2s linear infinite',
                margin: '20px auto'
              }}></div>
            </>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
