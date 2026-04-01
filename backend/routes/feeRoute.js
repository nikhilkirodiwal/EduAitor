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
} from "../controllers/feeController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

/***************** FEE STRUCTURE ROUTES *****************/

// router.post("/", createFeeStructure);
// router.get("/:classId", getFeeStructures);

// SUPER ADMIN ROUTES
router.get("/defaulters/admin", authMiddleware, getAllAdminDefaulter);
router.get("/admin", authMiddleware, getAllStudentAdminHistory);

// fetch all defaulter
router.get("/defaulters", authMiddleware, getAllDefaulter);

router.get("/:classId", authMiddleware, getFeeStructures);
router.post("/:classId/fee", authMiddleware, addFeeComponent);
router.put("/:classId/fee/:feeId", authMiddleware, editFeeComponent);
router.delete("/:classId/fee/:feeId", authMiddleware, deleteFeeComponent);

// fee collect routes
router.post("/", authMiddleware, collectStudentFee);

// fetch all student history
router.get("/", authMiddleware, AllStudentHistory);

//  fetch all defaulters
router.get("/defaulters", authMiddleware, getAllDefaulter);

export default router;
