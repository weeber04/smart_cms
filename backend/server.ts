import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import manageUserRoutes from "./routes/manageUserRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import receptionistRoutes from "./routes/receptionistRoutes"; 
import appointmentRoutes from './routes/appointmentRoutes';
import waitingListRoutes from "./routes/waitingListRoutes";
import drugRoutes from './routes/drugRoutes';
import medicalHistoryRoutes from './routes/medicalHistoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import drugRequestRoutes from './routes/drugRequestRoutes';
import settingsRoutes from "./routes/settingsRoutes";
import pharmacistRoutes from './routes/pharmacistRoutes'; 
import { db } from './db'; 

// =========== ENVIRONMENT CONFIG ===========
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    process.env.FRONTEND_URL 
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`🔗 [${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==========================================
// 🚀 ROUTE HANDLERS
// ==========================================

// Mount modular routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/manage-users", manageUserRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/drug-requests', drugRequestRoutes);
app.use("/api/settings", settingsRoutes);
app.use('/api/pharmacist', pharmacistRoutes);

// ✅ THIS IS THE IMPORTANT PART
// This loads all drug logic (Restock, New Drug, Scan) from your Controller
// instead of using "dumb" code in this file.
app.use(drugRoutes); 
app.use(medicalHistoryRoutes); 

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 Route not found: ${req.originalUrl}`);
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;