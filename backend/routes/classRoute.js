import express from "express";
import {
  createClass,
  getClasses,
  getClassById,
  getClassesFlat,
  updateClass,
  deleteClass,
  getAllClasses,
} from "../controllers/classController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

// SUPER ADMIN ROUTES
router.get("/all/admin", authMiddleware, getAllClasses); 

// CLASS ROUTES
router.get("/flat", authMiddleware, getClassesFlat);
router.get("/all", authMiddleware, getClasses);
router.get("/:id", authMiddleware, getClassById);
router.post("/create", authMiddleware, createClass);
router.put("/update/:id", authMiddleware, updateClass);
router.delete("/delete/:id", authMiddleware, deleteClass);

export default router;
