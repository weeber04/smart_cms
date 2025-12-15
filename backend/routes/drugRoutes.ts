// backend/routes/drugRoutes.ts
import express from 'express';
import { 
  getDrugs, 
  getDrugById, 
  searchDrugs, 
  getDrugCategories, 
  checkDrugStock,
  savePrescription,
  getPatientPrescriptions
} from '../controllers/drugController';

const router = express.Router();

// Get all drugs with optional search
router.get('/api/doctor/drugs', getDrugs);

// Search drugs with advanced filters
router.get('/api/doctor/drugs/search', searchDrugs);

// Get drug by ID
router.get('/api/doctor/drugs/:id', getDrugById);

// Get drug categories
router.get('/api/doctor/drugs/categories', getDrugCategories);

// Check drug stock availability
router.get('/api/doctor/drugs/:id/stock', checkDrugStock);

// Save prescription
router.post('/api/doctor/prescriptions', savePrescription);

// Get patient prescriptions
router.get('/api/doctor/patient/:id/prescriptions', getPatientPrescriptions);

export default router;