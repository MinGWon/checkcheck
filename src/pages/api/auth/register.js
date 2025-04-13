import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId, password, name, email, ccode } = req.body;

    if (!userId || !password || !ccode) {
      return res.status(400).json({ message: "아이디, 비밀번호, 그리고 C코드는 필수 입력사항입니다." });
    }

    // Validate that the code exists and is active
    const [codeResult] = await db.query(
      "SELECT * FROM codes WHERE code = ? AND isActive = 1",
      [ccode]
    );

    if (codeResult.length === 0) {
      return res.status(400).json({ message: "유효하지 않은 C코드입니다." });
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    await db.query(
      "INSERT INTO users (user_id, password, name, email, registration_code) VALUES (?, ?, ?, ?, ?)",
      [userId, hashedPassword, name || null, email || null, ccode]
    );

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}