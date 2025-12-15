// src/routes/medicalHistoryRoutes.ts
import express from 'express';
import {
  createMedicalHistory,
  getPatientMedicalHistory,
  getConsultationMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  createMultipleMedicalHistory,
  autoCreateMedicalHistoryFromConsultation
} from '../controllers/medicalHistoryController';

const router = express.Router();

// Create a new medical history entry
router.post('/create', createMedicalHistory);

// Create multiple medical history entries at once
router.post('/create-multiple', createMultipleMedicalHistory);

// Get medical history for a specific patient
router.get('/patient/:patientId', getPatientMedicalHistory);

// Get medical history for a specific consultation
router.get('/consultation/:consultationId', getConsultationMedicalHistory);

// Update a medical history entry
router.put('/update/:historyId', updateMedicalHistory);

// Delete a medical history entry
router.delete('/delete/:historyId', deleteMedicalHistory);

export default router;