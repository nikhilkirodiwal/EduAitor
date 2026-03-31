import express from "express";

import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createSubject);

router.get("/all", authMiddleware, getSubjects);

router.put("/update/:id", authMiddleware, updateSubject);

router.delete("/delete/:id", authMiddleware, deleteSubject);

export default router;