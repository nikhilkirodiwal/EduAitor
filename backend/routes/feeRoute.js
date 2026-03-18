import mongoose from "mongoose";
import express from "express";
import Student from "../models/student.js";
import Payment from "../models/payment.js";
import FeeStructure from "../models/feeStructure.js";

import {
  getFeeStructures,
  addFeeComponent,
  editFeeComponent,
  deleteFeeComponent,
  collectStudentFee,
  AllStudentHistory,
  getAllDefaulter,
} from "../controllers/feeController.js";
const router = express.Router();

/***************** FEE STRUCTURE ROUTES *****************/

// router.post("/", createFeeStructure);
// router.get("/:classId", getFeeStructures);

// fetch all defaulter
router.get("/defaulters", getAllDefaulter);

router.get("/:classId", getFeeStructures);
router.post("/:classId/fee", addFeeComponent);
router.put("/:classId/fee/:feeId", editFeeComponent);
router.delete("/:classId/fee/:feeId", deleteFeeComponent);

// fee collect routes
router.post("/", collectStudentFee);

// fetch all student history
router.get("/", AllStudentHistory);

//  fetch all defaulters
router.get("/defaulters", getAllDefaulter);

export default router;
