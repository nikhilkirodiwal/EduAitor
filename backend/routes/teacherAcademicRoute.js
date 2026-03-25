import express from "express";
import {
  getTeacherClasses,
  getSubjectsByClass,
  getChaptersBySubject,
  getTopicsByChapter,
} from "../controllers/teacherAcademicController.js";

const router = express.Router();

router.get("/classes", getTeacherClasses);
router.get("/subjects", getSubjectsByClass);
router.get("/chapters", getChaptersBySubject);
router.get("/topics", getTopicsByChapter);

export default router;