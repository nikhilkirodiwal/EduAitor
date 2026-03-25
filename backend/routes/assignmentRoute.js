import express from "express";
import {
  createAssignment,
  getTeacherAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  togglePublishAssignment,
} from "../controllers/assignmentController.js";

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

export default router;
