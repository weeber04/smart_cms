import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";

// Define the user interface for TypeScript
interface UserPayload {
  userId: number;
  role: string;
  email: string;
  name: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Verify JWT token from Authorization header
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🔐 Auth Middleware - Verifying token for:", req.path);
  
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log("📝 Token from Authorization header");
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log("🍪 Token from cookie");
    } else {
      console.log("❌ No token found");
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided."
      });
    }
    
    if (!token) {
      console.log("❌ Token is empty");
      return res.status(401).json({
        success: false,
        error: "Access denied. Invalid token."
      });
    }
    
    console.log("🔍 Verifying token...");
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    
    // Check if user still exists and is active
    const [users]: any = await db.query(
      "SELECT UserID, Role, Status FROM UserAccount WHERE UserID = ?",
      [decoded.userId]
    );
    
    if (users.length === 0) {
      console.log("❌ User not found in database");
      return res.status(401).json({
        success: false,
        error: "User no longer exists."
      });
    }
    
    const user = users[0];
    
    if (user.Status !== 'Active') {
      console.log("❌ User account is not active:", user.Status);
      return res.status(403).json({
        success: false,
        error: "Account is deactivated."
      });
    }
    
    // Attach user to request
    req.user = decoded;
    console.log("✅ User authenticated:", {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    });
    
    next();
  } catch (error: any) {
    console.error("❌ Token verification failed:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please log in again."
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: "Invalid token."
      });
    }
    
    return res.status(500).json({
      success: false,
      error: "Authentication error."
    });
  }
};

// Middleware to require specific role
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required."
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`❌ Role ${req.user.role} not allowed for ${roles}`);
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions."
      });
    }
    
    next();
  };
};

// Optional: Development bypass for testing (remove in production)
export const devAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    const devUserId = req.headers['x-dev-user-id'];
    const devUserRole = req.headers['x-dev-user-role'];
    
    if (devUserId && devUserRole) {
      console.log("🔧 Development auth bypass enabled");
      req.user = {
        userId: parseInt(devUserId as string),
        role: devUserRole as string,
        email: 'dev@example.com',
        name: 'Dev User'
      };
      return next();
    }
  }
  
  // If not using dev bypass, require real auth
  verifyToken(req, res, next);
};