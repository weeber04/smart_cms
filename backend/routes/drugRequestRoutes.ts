// backend/routes/drugRequestRoutes.ts
import express from 'express';
import { 
  getDrugRequests, 
  updateDrugRequestStatus, 
  createDrugRequest,
  getDrugRequestStats 
} from '../controllers/drugRequestController';

const router = express.Router();

// Get all drug requests with optional status filter
router.get('/', getDrugRequests);

// Get drug request statistics
router.get('/stats', getDrugRequestStats);

// Update drug request status
router.put('/:requestId/status', updateDrugRequestStatus);

// Create new drug request
router.post('/', createDrugRequest);

export default router;