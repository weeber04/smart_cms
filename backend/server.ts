import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import manageUserRoutes from "./routes/manageUserRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import receptionistRoutes from "./routes/receptionistRoutes"; 

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// In server.ts, update the CORS configuration:
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite default port
    'http://127.0.0.1:5173', // Alternative localhost
    'http://localhost:3000', // If you also run on port 3000
    process.env.FRONTEND_URL // From environment variable
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Clinic Management System API',
    version: '1.0.0'
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/manage-users", manageUserRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.details
    })
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📍 Local: http://localhost:${PORT}
  
  📊 Available Routes:
  🔐 Auth:      http://localhost:${PORT}/api/auth
  👤 Users:     http://localhost:${PORT}/api/users
  👥 Manage:    http://localhost:${PORT}/api/manage-users
  👨‍⚕️ Doctor:    http://localhost:${PORT}/api/doctor
  📋 Reception: http://localhost:${PORT}/api/receptionist
  ❤️ Health:    http://localhost:${PORT}/api/health
  `);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;