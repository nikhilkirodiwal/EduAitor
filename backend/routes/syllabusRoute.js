// routes/syllabusRoutes.js
import express from "express";
import {
  // Chapter routes
  createChapter,
  getChapters,
  updateChapter,
  deleteChapter,
  reorderChapters,
  // Topic routes
  createTopic,
  getTopics,
  updateTopic,
  deleteTopic,
  reorderTopics,
  // Bulk fetch
  getSyllabusStructure,
  getCompleteSyllabus,
} from "../controllers/syllabusController.js";

const router = express.Router();

// ==================== CHAPTER ROUTES ====================
router.post("/chapters", createChapter);
router.get("/chapters", getChapters);
router.put("/chapters/:chapterId", updateChapter);
router.delete("/chapters/:chapterId", deleteChapter);
router.post("/chapters/reorder", reorderChapters);

// ==================== TOPIC ROUTES ====================
router.post("/topics", createTopic);
router.get("/topics", getTopics);
router.put("/topics/:topicId", updateTopic);
router.delete("/topics/:topicId", deleteTopic);
router.post("/topics/reorder", reorderTopics);

// ==================== BULK ROUTES ====================
router.get("/structure", getSyllabusStructure);
router.get("/complete/:schoolId",getCompleteSyllabus);

export default router;
