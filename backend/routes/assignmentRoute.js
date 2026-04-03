import express from "express";
import {
  createAssignment,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  togglePublishAssignment,
} from "../controllers/assignmentController.js";
import { authMiddleware } from "../auth/auth.js";
import { generateAIQuestions } from "../controllers/aiController.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/create", authMiddleware, createAssignment);

/* ================= GET (TEACHER) ================= */
router.get("/teacher", authMiddleware, getTeacherAssignments);

/* ================= GET SINGLE ================= */
router.get("/:id", authMiddleware, getAssignmentById);

/* ================= UPDATE ================= */
router.put("/:id", authMiddleware, updateAssignment);

/* ================= DELETE ================= */
router.delete("/:id", authMiddleware, deleteAssignment);

/* ================= PUBLISH ================= */
router.patch("/publish/:id", authMiddleware, togglePublishAssignment);

/* ================= AI INTEGRATE =================*/
router.post("/generate-questions", authMiddleware, generateAIQuestions);

export default router;