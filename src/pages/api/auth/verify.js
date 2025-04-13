import { db } from "@/lib/db";

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { userId, id, sessionExpiry } = req.body;

    // 필수 파라미터 검증
    if (!userId || !id) {
      return res.status(400).json({ 
        success: false, 
        message: "필수 인증 정보가 없습니다." 
      });
    }

    // 세션 만료 확인
    if (sessionExpiry && Date.now() > sessionExpiry) {
      return res.status(401).json({ 
        success: false, 
        message: "세션이 만료되었습니다." 
      });
    }

    // 데이터베이스에서 사용자 정보 조회
    const [users] = await db.query(
      "SELECT * FROM users WHERE user_id = ? AND id = ?",
      [userId, id]
    );

    const user = users[0];

    // 사용자가 존재하지 않는 경우
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "유효하지 않은 사용자입니다." 
      });
    }

    // 인증 성공 응답
    return res.status(200).json({
      success: true,
      message: "사용자 인증 성공",
    });
    
  } catch (error) {
    console.error("사용자 검증 오류:", error);
    return res.status(500).json({ 
      success: false, 
      message: "서버 오류가 발생했습니다." 
    });
  }
}
