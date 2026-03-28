import express from "express";
import {
  createAssignment,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  togglePublishAssignment,
} from "../controllers/assignmentController.js";

import { generateAIQuestions } from "../controllers/aiController.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/create", createAssignment);

/* ================= GET (TEACHER) ================= */
router.get("/teacher", getTeacherAssignments);

/* ================= GET SINGLE ================= */
router.get("/:id", getAssignmentById);

/* ================= UPDATE ================= */
router.put("/:id", updateAssignment);

/* ================= DELETE ================= */
router.delete("/:id", deleteAssignment);

/* ================= PUBLISH ================= */
router.patch("/publish/:id", togglePublishAssignment);

/* ================= AI INTEGRATE =================*/
router.post("/generate-questions", generateAIQuestions);

export default router;