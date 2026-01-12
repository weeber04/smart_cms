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
  goToBilling,
  getPatientsToBill,
  getAllBilling,
  getBillingItems,
  createBilling,
  getServices,
  createBillingForConsultation,
  createBillingFromPatient,
  processPaymentForBilling


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

// ============ BILLING MANAGEMENT ROUTES ============

router.get('/billing', getAllBilling);
router.get('/services', getServices);
router.post('/create-billing', createBilling);
router.post('/update-visit-status', updateVisitStatus);
router.post('/process-payment', processPayment);

// receptionistRoutes.ts
router.post('/create-billing-consultation', createBillingForConsultation);
router.post('/create-billing-from-patient', createBillingFromPatient);
router.post('/process-payment', processPaymentForBilling);
router.get('/patients-to-bill', getPatientsToBill);
router.get('/billing-items/:billId', getBillingItems);

// Doctors
router.get('/doctors', getDoctors);

export default router;