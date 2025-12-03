// routes/appointmentRoutes.ts
import express from 'express';
import {
  getTodayAppointments,
  checkInAppointment,
  markAppointmentLate,
  cancelAppointment,
  rescheduleAppointment
} from '../controllers/appointmentController';

const router = express.Router();

// Appointment management routes
router.get('/today', getTodayAppointments);
router.post('/checkin', checkInAppointment);
router.post('/mark-late', markAppointmentLate);
router.post('/cancel', cancelAppointment);
router.post('/reschedule', rescheduleAppointment);

export default router;