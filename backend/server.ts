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
import pharmacistRoutes from './routes/pharmacistRoutes'; // ADDED: Import pharmacist routes

// =========== ENVIRONMENT VARIABLE DEBUG ===========
console.log("=== ENVIRONMENT VARIABLE DEBUG ===");
console.log("Current directory:", __dirname);
console.log("Working directory:", process.cwd());

// Load environment variables with explicit path
const envPath = path.join(__dirname, '.env'); // Load from same directory as server.ts
console.log("Looking for .env at:", envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  console.error("Trying fallback...");
  dotenv.config(); // Try default location
} else {
  console.log("✅ .env file loaded successfully");
}

// Check if critical environment variables are loaded
console.log("🔑 JWT_SECRET loaded:", process.env.JWT_SECRET ? "YES" : "NO");
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
  console.log("JWT_SECRET length:", process.env.JWT_SECRET.length);
  console.log("JWT_SECRET first 10 chars:", process.env.JWT_SECRET.substring(0, 10) + "...");
}

console.log("📊 DB_NAME:", process.env.DB_NAME || "NOT SET");
console.log("🌐 NODE_ENV:", process.env.NODE_ENV || "development");
console.log("🚪 PORT:", process.env.PORT || "3001 (default)");
console.log("==================================");

// IMPORTANT: Import db for scanner routes
import { db } from './db'; // ADDED: Import database connection

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
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

// Cookie parser middleware (MUST come before routes)
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'ieZKyXigqhtv45K6cAIaN6pf4YgSOfZZoneiJRsmxEo=',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

console.log("=== ENVIRONMENT VARIABLE DEBUG ===");
console.log("Current directory:", process.cwd());
console.log("NODE_ENV:", process.env.NODE_ENV);

// Try different .env file loading methods
try {
  // Method 1: Load from specific path
  const envPath = path.join(process.cwd(), '.env');
  console.log("Looking for .env at:", envPath);
  
  // Method 2: Load with explicit path
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error("❌ Error loading .env file:", result.error);
  } else {
    console.log("✅ .env file loaded successfully");
  }
} catch (error) {
  console.error("❌ Failed to load .env:", error);
}

// Check if JWT_SECRET is loaded
console.log("🔑 JWT_SECENT loaded:", process.env.JWT_SECRET ? "YES" : "NO");
console.log("JWT_SECENT first 5 chars:", process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + "..." : "NOT SET");
console.log("DB_NAME loaded:", process.env.DB_NAME ? "YES" : "NO");
console.log("==================================");

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced request logging middleware
app.use((req, res, next) => {
  console.log(`
  =========== REQUEST START ===========
  📅 ${new Date().toISOString()}
  🔗 ${req.method} ${req.url}
  📍 Origin: ${req.headers.origin}
  📍 Referer: ${req.headers.referer}
  📍 IP: ${req.ip}
  🍪 Cookies: ${JSON.stringify(req.cookies)}
  📦 Body: ${JSON.stringify(req.body).substring(0, 500)}...
  =========== REQUEST END =============
  `);
  next();
});

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Clinic Management System API',
    version: '1.0.0'
  });
});

// Debug endpoint (no auth required)
app.get('/api/debug', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    sessionID: req.sessionID,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 🛒 SCANNER & INVENTORY ROUTES (FROM PHARMACIST SYSTEM)
// ==========================================

// 1. SCAN API (Handles Dispense & Check)
app.post('/api/scan', async (req: any, res: any) => {
    const { barcode, mode } = req.body; 
    const userId = req.session?.user?.id || 1; 

    try {
        // CORRECTION: Used 'BarcodeID' instead of 'barcode_id'
        const [rows]: any = await db.query('SELECT * FROM Drug WHERE BarcodeID = ?', [barcode]);
        
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Item not found' });
        }

        const drug = rows[0];

        // MODE: CHECK (For Restock Dialog)
        if (mode === 'check') {
            return res.json({
                status: 'success',
                drug: {
                    id: drug.DrugID,
                    name: drug.DrugName,
                    stock: drug.QuantityInStock,
                    location: drug.Location || 'Pharmacy'
                }
            });
        }

        // MODE: DISPENSE (Deduct Stock)
        if (mode === 'dispense') {
            const newQty = drug.QuantityInStock - 1;
            
            if (newQty < 0) {
                 return res.json({ status: 'error', message: 'Out of stock' });
            }

            // Update Stock
            await db.query('UPDATE Drug SET QuantityInStock = ? WHERE DrugID = ?', [newQty, drug.DrugID]);
            
            // Log Transaction
            await db.query(
                "INSERT INTO InventoryLog (Action, QuantityChange, DrugID, PerformedBy) VALUES ('IOT_SCAN_OUT', -1, ?, ?)", 
                [drug.DrugID, userId]
            );

            return res.json({
                status: 'success',
                message: 'Dispensed successfully',
                drug: drug.DrugName,
                remaining: newQty
            });
        }
    } catch (error: any) {
        console.error("Scanner Error:", error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// 2. RESTOCK API (Adds Stock)
app.post('/api/restock', async (req: any, res: any) => {
    const { drug_id, quantity } = req.body;
    const userId = req.session?.user?.id || 1;

    try {
        const qtyNum = parseInt(quantity);
        
        const [result]: any = await db.query(
            'UPDATE Drug SET QuantityInStock = QuantityInStock + ? WHERE DrugID = ?', 
            [qtyNum, drug_id]
        );

        if (result.affectedRows > 0) {
             await db.query(
                "INSERT INTO InventoryLog (Action, QuantityChange, DrugID, PerformedBy) VALUES ('RESTOCK', ?, ?, ?)", 
                [qtyNum, drug_id, userId]
            );
             return res.json({ status: 'success', message: 'Stock updated' });
        } else {
             return res.json({ status: 'error', message: 'Update failed' });
        }
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: 'Database error' });
    }
});

// API Routes
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
app.use('/api/pharmacist', pharmacistRoutes); // ADDED: Pharmacist routes

app.use(drugRoutes); 
app.use(medicalHistoryRoutes); 

// 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log(`❌ 404 Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Global error handler:', error);
  
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
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📍 Local: http://localhost:${PORT}
  🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing!'}
  📦 Environment: ${process.env.NODE_ENV || 'development'}
  
  📊 Available Routes:
  🔐 Auth:      http://localhost:${PORT}/api/auth
  👤 Users:     http://localhost:${PORT}/api/users
  👥 Manage:    http://localhost:${PORT}/api/manage-users
  👨‍⚕️ Doctor:    http://localhost:${PORT}/api/doctor
  📋 Reception: http://localhost:${PORT}/api/receptionist
  📅 Appointments: http://localhost:${PORT}/api/appointments
  🏥 Waiting List: http://localhost:${PORT}/api/waiting-list
  💊 Pharmacist: http://localhost:${PORT}/api/pharmacist
  📊 Dashboard: http://localhost:${PORT}/api/dashboard
  📈 Analytics: http://localhost:${PORT}/api/analytics
  💊 Drug Requests: http://localhost:${PORT}/api/admin/drug-requests
  ⚙️ Settings: http://localhost:${PORT}/api/settings
  🔍 Scanner:   http://localhost:${PORT}/api/scan
  📦 Restock:   http://localhost:${PORT}/api/restock
  ❤️ Health:    http://localhost:${PORT}/api/health
  🐛 Debug:     http://localhost:${PORT}/api/debug
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