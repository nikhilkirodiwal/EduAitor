import express from "express";
import {
  saveTimetable,
  getTimetable,
  markTeacherAbsent,
} from "../controllers/timetableController.js";

const router = express.Router();

router.post("/save", saveTimetable);
router.post("/teacher-absent", markTeacherAbsent);
router.get("/:classId", getTimetable);

export default router;
