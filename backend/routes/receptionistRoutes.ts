import express from 'express';
import {
  getReceptionistProfile,
  getAppointments,
  getTodayVisits,
  getBillingRecords,
  getDoctors,
  registerPatient,
  searchPatient,
  scheduleAppointment,
  checkInPatient,
  updateVisitStatus,
  processPayment,
  getPatientAppointments,
  cancelAppointment,
  scheduleFollowUp
} from '../controllers/receptionistController';

const router = express.Router();

// Profile
router.get('/profile/:receptionistId', getReceptionistProfile);

// Appointments
router.get('/appointments', getAppointments); // All appointments
router.get('/patient-appointments/:patientId', getPatientAppointments);
router.post('/schedule-appointment', scheduleAppointment);
router.post('/schedule-followup', scheduleFollowUp);
router.post('/cancel-appointment', cancelAppointment);

// Visits
router.get('/today-visits', getTodayVisits);
router.post('/check-in', checkInPatient);
router.post('/update-visit-status', updateVisitStatus);

// Patient Management
router.get('/search-patient', searchPatient);
router.post('/register-patient', registerPatient);

// Billing
router.get('/billing', getBillingRecords);
router.post('/process-payment', processPayment);

// Doctors
router.get('/doctors', getDoctors);

export default router;