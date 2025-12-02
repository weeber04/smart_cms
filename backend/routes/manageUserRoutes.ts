import express from "express";
import { 
  getAllUsers, 
  updateUser, 
  deleteUser 
} from "../controllers/manageUserController";

const router = express.Router();

router.get("/", getAllUsers); // GET /api/manage-users
router.put("/:id", updateUser); // PUT /api/manage-users/:id
router.delete("/:id", deleteUser); // DELETE /api/manage-users/:id

export default router;