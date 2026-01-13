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
  processPaymentForBilling,
  getPatientBillDetails,
  getConsultationDetails,
  getPrescriptionDetails,
  getMedicationCost,
  getPatientBillingInfo,
  medicationItems,
  getUpcomingAppointments,
  sendAppointmentReminder,
  getPatientByICForAccount,
  createPatientAccount,
  checkPatientAccountExists,
  findPatientByIC,
  cancelAppointment,
  rescheduleAppointment


} from '../controllers/receptionistController';

const router = express.Router();

  router.post('/reschedule-appointment', rescheduleAppointment);
router.post('/cancel-appointment', cancelAppointment);
router.get('/patient-by-ic/:icNumber', getPatientByICForAccount);
router.post('/create-patient-account', createPatientAccount);

// In your receptionistRoutes.ts
router.get('/search-patient', searchPatient);
router.post('/walkin', registerWalkIn);
router.post('/cancel-visit', cancelVisit);
router.post('/mark-noshow', markNoShow);
// ... other routes
router.get('/consultation-details/:consultationId', getConsultationDetails);

router.get('/prescription-details/:consultationId', getPrescriptionDetails);
router.get('/medication-cost/:consultationId', getMedicationCost);
router.get('/patient-billing-info/:patientId/:consultationId', getPatientBillingInfo);
router.get('/medication-items/:consultationId', medicationItems);

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

router.post('/create-billing-from-patient', createBillingFromPatient);
router.post('/process-payment', processPaymentForBilling);
router.get('/billing-items/:billId', getBillingItems);

router.get('/patients-to-bill', getPatientsToBill);
router.get('/bill-details/:consultationId', getPatientBillDetails);
router.post('/create-billing-consultation', createBillingForConsultation);

router.get('/upcoming-appointments', getUpcomingAppointments);
router.post('/send-reminder', sendAppointmentReminder);

router.get('/check-account/:icNumber', checkPatientAccountExists);
router.get('/find-patient-by-ic/:icNumber', findPatientByIC);

// Doctors
router.get('/doctors', getDoctors);

export default router;