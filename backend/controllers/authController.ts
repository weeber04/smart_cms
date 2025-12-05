import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log("🔐 Login attempt received:", { 
    email, 
    passwordLength: password?.length 
  });

  try {
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ 
        success: false,
        error: "Email and password are required" 
      });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM UserAccount WHERE Email = ?",
      [email]
    );

    console.log("📊 Database query result count:", rows.length);

    if (rows.length === 0) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
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
      return res.status(403).json({ 
        success: false,
        error: "Account is not active. Please contact administrator." 
      });
    }

    // Compare hashed password
    console.log("🔑 Comparing password...");
    
    // IMPORTANT: Check if password hash exists
    if (!user.PasswordHash) {
      console.log("❌ No password hash found for user");
      return res.status(500).json({
        success: false,
        error: "User password not properly configured. Contact administrator."
      });
    }
    
    const match = await bcrypt.compare(password, user.PasswordHash);

    if (!match) {
      console.log("❌ Password doesn't match");
      return res.status(401).json({ 
        success: false,
        error: "Invalid email or password" 
      });
    }

    console.log("✅ Login successful for:", email);

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not set in environment variables");
      throw new Error("Server configuration error");
    }

    // Create JWT token
    const tokenPayload = {
      userId: user.UserID,
      role: user.Role,
      email: user.Email,
      name: user.Name
    };

    console.log("Creating token with payload:", tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    console.log("✅ Token created successfully");

    // Return response
    res.json({
      success: true,
      message: "Login successful",
      role: user.Role,
      name: user.Name,
      userId: user.UserID,
      email: user.Email,
      token: token
    });

  } catch (error: any) {
    console.error("🔥 Login error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Check specific errors
    if (error.code === 'ECONNREFUSED') {
      console.error("Database connection refused");
    }
    
    if (error.sql) {
      console.error("SQL Error:", error.sql);
      console.error("SQL Message:", error.sqlMessage);
    }
    
    res.status(500).json({ 
      success: false,
      error: "Server error during login",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sqlError: process.env.NODE_ENV === 'development' && error.sqlMessage ? error.sqlMessage : undefined
    });
  }
};

// Add logout function
export const logout = (req: Request, res: Response) => {
  console.log("👋 Logout requested");
  
  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  
  res.json({
    success: true,
    message: "Logged out successfully"
  });
};

// Add token refresh function
export const refreshToken = async (req: Request, res: Response) => {
  console.log("🔄 Token refresh requested");
  
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token required"
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET!
    ) as { userId: number };
    
    // Get user from database
    const [users]: any = await db.query(
      "SELECT UserID, Role, Email, Name, Status FROM UserAccount WHERE UserID = ?",
      [decoded.userId]
    );
    
    if (users.length === 0 || users[0].Status !== 'Active') {
      return res.status(401).json({
        success: false,
        error: "User not found or inactive"
      });
    }
    
    const user = users[0];
    
    // Create new access token
    const newTokenPayload = {
      userId: user.UserID,
      role: user.Role,
      email: user.Email,
      name: user.Name
    };
    
    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );
    
    // Set new token cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: "Token refreshed",
      token: newToken
    });
    
  } catch (error: any) {
    console.error("Token refresh error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Refresh token expired. Please log in again."
      });
    }
    
    res.status(401).json({
      success: false,
      error: "Invalid refresh token"
    });
  }
};

// Add check-auth endpoint to verify current auth status
export const checkAuth = (req: Request, res: Response) => {
  console.log("🔍 Auth check requested");
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      error: "Not authenticated"
    });
  }
  
  res.json({
    success: true,
    authenticated: true,
    user: req.user
  });
};