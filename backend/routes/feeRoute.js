import express from "express";
import {
  getFeeStructures,
  addFeeComponent,
  editFeeComponent,
  deleteFeeComponent,
  collectStudentFee,
  AllStudentHistory,
  getAllDefaulter,
  getAllAdminDefaulter,
  getAllStudentAdminHistory,
  getStudentFeeDetails,
  getMyFeeDetails,
} from "../controllers/feeController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

/***************** FEE STRUCTURE ROUTES *****************/

// router.post("/", createFeeStructure);
// router.get("/:classId", getFeeStructures);

// SUPER ADMIN ROUTES
router.get("/defaulters/admin", authMiddleware, getAllAdminDefaulter);
router.get("/admin", authMiddleware, getAllStudentAdminHistory);

// fee collect routes
router.post("/", authMiddleware, collectStudentFee);

// fetch all student history
router.get("/", authMiddleware, AllStudentHistory);

//  fee details for student
router.get("/parent/student/me", authMiddleware, getMyFeeDetails);
// GET /api/fees/parent/student/:studentId
router.get("/parent/student/:studentId", authMiddleware, getStudentFeeDetails);

// fetch all defaulter
router.get("/defaulters", authMiddleware, getAllDefaulter);

router.get("/:classId", authMiddleware, getFeeStructures);
router.post("/:classId/fee", authMiddleware, addFeeComponent);
router.put("/:classId/fee/:feeId", authMiddleware, editFeeComponent);
router.delete("/:classId/fee/:feeId", authMiddleware, deleteFeeComponent);
export default router;
