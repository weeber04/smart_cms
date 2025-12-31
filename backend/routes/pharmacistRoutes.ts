// backend/routes/pharmacistRoutes.ts
import express from 'express';
import { getPendingPrescriptions, dispenseMedication, getDrugs } from '../controllers/pharmacistController';
import { verifyToken, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('Pharmacist', 'pharmacist')); // Fixes case-sensitivity error

// Endpoint for THE QUEUE section
router.get('/prescriptions/pending', getPendingPrescriptions);
router.put('/dispense/:itemId', dispenseMedication);
router.get('/inventory', getDrugs);

export default router;