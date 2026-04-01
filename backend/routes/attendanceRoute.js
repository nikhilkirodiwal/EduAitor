import express from 'express';

const router  = express.Router();
import { authMiddleware } from '../auth/auth.js';
import {getMetaData ,getStudentsByClassAndSection} from '../controllers/attendanceController.js';

// router.post("/mark", authMiddleware, markAttendance);
// router.get("/get", authMiddleware, getAttendance);
router.get("/meta",authMiddleware,getMetaData)
router.get("/students/filter",authMiddleware,getStudentsByClassAndSection)

export default router;