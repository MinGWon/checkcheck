import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "아이디와 비밀번호를 모두 입력해주세요." });
    }

    // Get user from the database
    const [users] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }

    // Create session or token logic can be added here
    // For simplicity, we're just returning a success message
    
    return res.status(200).json({ 
      message: "로그인 성공!",
      user: {
        id: user.id,
        userId: user.user_id,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}