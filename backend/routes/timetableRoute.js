import express from "express";
import {
  saveTimetable,
  getTimetable,
  markTeacherAbsent
} from "../controllers/timetableController.js";

const router = express.Router();

router.post("/save", saveTimetable);

router.get("/:classId", getTimetable);

router.post("/teacher-absent", markTeacherAbsent);

export default router;