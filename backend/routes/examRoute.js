import express from "express";
import {
  createExam,
  getExams,
  updateExam,
  deleteExam,
  getTeacherExams
} from "../controllers/examController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createExam);
router.get("/list", authMiddleware, getExams);

router.put("/edit/:id", authMiddleware, updateExam);
router.delete("/delete/:id", authMiddleware, deleteExam);
router.get("/teacher-exams", authMiddleware, getTeacherExams);

export default router;
