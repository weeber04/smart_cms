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
  registerWalkIn,
  callPatientToBilling,
  goToBilling

} from '../controllers/receptionistController';

const router = express.Router();

// In your receptionistRoutes.ts
router.get('/search-patient', searchPatient);
router.post('/walkin', registerWalkIn);
router.post('/cancel-visit', cancelVisit);
router.post('/mark-noshow', markNoShow);
// ... other routes

// Profile & Dashboard
router.get('/profile/:receptionistId', getReceptionistProfile);
router.get('/dashboard-stats', getDashboardStats);

// Patient Management
router.get('/search-patient', searchPatient);
router.get('/patient/:patientId', getPatientDetails);
router.post('/register-patient', registerPatient);

// NEW: Walk-in registration route
router.post('/walkin', registerWalkIn);
router.post('/call-patient-to-billing', callPatientToBilling);
router.post('/go-to-billing', goToBilling);

// Appointment Management
router.get('/appointments', getAppointments);


// Waiting List & Check-in
router.get('/today-visits', getTodayVisits);
router.post('/check-in', checkInPatient);
router.post('/update-visit-status', updateVisitStatus);

// Billing
router.get('/billing', getBillingRecords);
router.post('/process-payment', processPayment);

// Doctors
router.get('/doctors', getDoctors);

export default router;