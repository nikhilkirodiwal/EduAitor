import express from "express";
import {
  createExam,
  getExams,
  getSubjects,
  updateExam,
  deleteExam,
} from "../controllers/examController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createExam);
router.get("/list", authMiddleware, getExams);
router.get("/subjects/get-multiple", authMiddleware, getSubjects);

router.put("/edit/:id", authMiddleware, updateExam);
router.delete("/delete/:id", authMiddleware, deleteExam);

export default router;
