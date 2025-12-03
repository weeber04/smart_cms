// routes/receptionistRoutes.ts
import express from 'express';

import {
  // Profile & Dashboard
  getReceptionistProfile,
  getDashboardStats,
  
  // Patient Management
  registerPatient,
  searchPatient,
  getPatientDetails,
  
  // Appointment Management
  getAppointments,
  scheduleAppointment,
  cancelAppointment,
  
  // Waiting List & Check-in
  getTodayVisits,
  checkInPatient,
  updateVisitStatus,
  
  // Billing
  getBillingRecords,
  processPayment,
  
  // Doctors
  getDoctors,
  cancelVisit,
  markNoShow,

    // NEW: Walk-in registration
  registerWalkIn
} from '../controllers/receptionistController';

const router = express.Router();

// Profile & Dashboard
router.get('/profile/:receptionistId', getReceptionistProfile);
router.get('/dashboard-stats', getDashboardStats);

// Patient Management
router.get('/search-patient', searchPatient);
router.get('/patient/:patientId', getPatientDetails);
router.post('/register-patient', registerPatient);

// NEW: Walk-in registration route
router.post('/walkin', registerWalkIn);

// Appointment Management
router.get('/appointments', getAppointments);
router.post('/schedule-appointment', scheduleAppointment);
router.post('/cancel-appointment', cancelAppointment);

// Waiting List & Check-in
router.get('/today-visits', getTodayVisits);
router.post('/check-in', checkInPatient);
router.post('/update-visit-status', updateVisitStatus);
// In receptionistRoutes.ts
router.post('/cancel-visit', cancelVisit);
router.post('/mark-noshow', markNoShow);

// Billing
router.get('/billing', getBillingRecords);
router.post('/process-payment', processPayment);

// Doctors
router.get('/doctors', getDoctors);

export default router;