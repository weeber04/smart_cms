import { Router } from "express";
import {
  getSettings,
  updateSettings
} from "../controllers/settingsController";

const router = Router();

// GET all settings
router.get("/", getSettings);

// PUT to update settings (partial updates supported)
router.put("/", updateSettings);

export default router;
