// routes/waitingListRoutes.ts
import express from "express";
import { 
  getTodayAllVisits, 
  getTodayActiveVisits, 
  getTodayCompletedVisits 
} from "../controllers/waitingListController";

const router = express.Router();

// Get all today's visits (including completed/cancelled)
router.get("/today-all", getTodayAllVisits);

// Get only active visits
router.get("/today-active", getTodayActiveVisits);

// Get only completed/cancelled visits
router.get("/today-completed", getTodayCompletedVisits);

export default router;