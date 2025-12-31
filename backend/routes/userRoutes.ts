import express from "express";
import { 
  login, 
  logout, 
  refreshToken, 
  checkAuth 
} from "../controllers/authController";
import { registerUser } from "../controllers/userController"; // ← ADD THIS
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/register", registerUser); // ← ADD THIS LINE
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// Protected route (requires authentication)
router.get("/check", verifyToken, checkAuth);

export default router;