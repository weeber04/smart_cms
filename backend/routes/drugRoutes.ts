  // backend/routes/drugRoutes.ts
import express from 'express';
import { 
  getDrugs, 
  getDrugById, 
  searchDrugs, 
  getDrugCategories, 
  checkDrugStock,
  savePrescription,
  getPatientPrescriptions,
  getExpiringDrugs, 
  disposeDrug,
  getPendingPrescriptions, 
  scanDispenseItem, 
  getDispensingHistory,
  restockDrug,
  getDrugBatches,
  addDrug
} from '../controllers/drugController';
// backend/routes/drugRoutes.ts

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

router.get('/api/pharmacist/pending-rx', getPendingPrescriptions);

router.get('/api/drugs', getDrugs);

router.post('/api/pharmacist/scan-item', scanDispenseItem);

router.get('/api/pharmacist/pending-rx', getPendingPrescriptions);

router.post('/api/pharmacist/scan-item', scanDispenseItem);      

router.get('/api/pharmacist/dispensing-history', getDispensingHistory); 

router.get('/api/pharmacist/pending-rx', getPendingPrescriptions);

router.post('/api/pharmacist/scan-item', scanDispenseItem);  

router.get('/api/pharmacist/dispensing-history', getDispensingHistory);

router.get('/api/pharmacist/expiring', getExpiringDrugs); 

router.post('/api/pharmacist/dispose', disposeDrug);   

router.post('/api/drug/restock', restockDrug);

router.get('/api/drug/:id/batches', getDrugBatches);

router.post('/api/drug/new', addDrug);

export default router;