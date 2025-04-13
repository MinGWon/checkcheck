import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// API Key 검증을 위한 상수 - 실제 환경에서는 환경 변수로 관리하세요
const VALID_API_KEY = "your_secure_api_key_here";

export default async function handler(req, res) {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === "OPTIONS") {
    return handleCors(res);
  }

  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // CORS 헤더 설정
  handleCors(res);

  // API Key 검증
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== VALID_API_KEY) {
    return res.status(401).json({ success: false, message: "Invalid API Key" });
  }

  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "아이디와 비밀번호를 모두 입력해주세요." 
      });
    }

    // 사용자 정보 조회
    const [users] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "아이디 또는 비밀번호가 일치하지 않습니다." 
      });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "아이디 또는 비밀번호가 일치하지 않습니다." 
      });
    }

    // 세션 타임아웃 계산 (10분)
    const expiryTime = Date.now() + (10 * 60 * 1000);
    
    // 토큰 정보 생성 (실제 환경에서는 JWT 등 더 안전한 방식 사용 권장)
    const token = {
      userId: user.user_id,
      name: user.name,
      sessionExpiry: expiryTime,
    };
    
    // 성공 응답
    return res.status(200).json({ 
      success: true,
      message: "로그인 성공!",
      token: token,
      user: {
        id: user.id,
        userId: user.user_id,
        name: user.name
      }
    });
  } catch (error) {
    console.error("External login error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "서버 오류가 발생했습니다." 
    });
  }
}

// CORS 헤더 설정 함수
function handleCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-API-KEY, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type'
  );
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
}
