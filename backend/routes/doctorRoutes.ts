import express from "express";
import {
  getDoctorProfile,
  getTodayAppointments,
  getPatientQueue,
  getPatientDetails,
  saveConsultation,
  createPrescription,
  getRecentPrescriptions,
  scheduleFollowUp
} from "../controllers/doctorController";

const router = express.Router();

router.get("/profile/:doctorId", getDoctorProfile);
router.get("/appointments/:doctorId", getTodayAppointments);
router.get("/queue/:doctorId", getPatientQueue);
router.get("/patient/:patientId", getPatientDetails);
router.post("/consultation", saveConsultation);
router.post("/prescription", createPrescription);
router.get("/prescriptions/:doctorId", getRecentPrescriptions);
router.post("/follow-up", scheduleFollowUp);

export default router;