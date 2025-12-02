import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log("🔐 Login attempt received:", { email, passwordLength: password?.length });

  try {
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM UserAccount WHERE Email = ?",
      [email]
    );

    console.log("📊 Database query result count:", rows.length);

    if (rows.length === 0) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    console.log("👤 User found:", { 
      id: user.UserID, 
      name: user.Name, 
      role: user.Role,
      status: user.Status 
    });

    // Check if user is active
    if (user.Status !== 'Active') {
      console.log("❌ User account not active:", user.Status);
      return res.status(403).json({ error: "Account is not active. Please contact administrator." });
    }

    // Compare hashed password
    console.log("🔑 Comparing password...");
    const match = await bcrypt.compare(password, user.PasswordHash);

    if (!match) {
      console.log("❌ Password doesn't match");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ Login successful for:", email);

    // SUCCESS
    res.json({
      message: "Login successful",
      role: user.Role,
      name: user.Name,
      userId: user.UserID,
      email: user.Email 
    });

  } catch (error: any) {
    console.error("🔥 Login error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Server error during login",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};