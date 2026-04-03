import express from "express";

const router = express.Router();
import { authMiddleware } from "../auth/auth.js";
import {
  getMetaData,
  getStudentsByClassAndSection,
  getExistingAttendance,
  saveAttendance,
  updateAttendance,
  getStudentAttendanceReport,
} from "../controllers/attendanceController.js";

router.get("/meta", authMiddleware, getMetaData);
router.get("/students/filter", authMiddleware, getStudentsByClassAndSection);
router.get("/existing", authMiddleware, getExistingAttendance);
router.post("/save", authMiddleware, saveAttendance);
router.put("/update", authMiddleware, updateAttendance);
router.get("/report", authMiddleware, getStudentAttendanceReport);

export default router;
