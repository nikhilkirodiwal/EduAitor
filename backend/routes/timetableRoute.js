import express from "express";

import {
  saveTimetable,
  getTimetable
} from "../controllers/timetableController.js";

const router = express.Router();


router.post("/save", saveTimetable);

router.get("/:classId/:sectionId", getTimetable);


export default router;