import express from "express";
import upload from "../middlewares/upload.js";

import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "studentPhoto", maxCount: 1 },
    { name: "fatherPhoto", maxCount: 1 },
    { name: "motherPhoto", maxCount: 1 },
    { name: "guardianPhoto", maxCount: 1 },

    { name: "birthCertificate", maxCount: 1 },
    { name: "transferCertificate", maxCount: 1 },

    { name: "studentAadhar", maxCount: 1 },
    { name: "fatherAadhar", maxCount: 1 },
    { name: "motherAadhar", maxCount: 1 },
  ]),
  createStudent,
);

router.put(
  "/:id",
  upload.fields([
    { name: "studentPhoto", maxCount: 1 },
    { name: "fatherPhoto", maxCount: 1 },
    { name: "motherPhoto", maxCount: 1 },
    { name: "guardianPhoto", maxCount: 1 },

    { name: "birthCertificate", maxCount: 1 },
    { name: "transferCertificate", maxCount: 1 },

    { name: "studentAadhar", maxCount: 1 },
    { name: "fatherAadhar", maxCount: 1 },
    { name: "motherAadhar", maxCount: 1 },
  ]),
  updateStudent,
);

router.get("/", getStudents);

router.get("/:id", getStudent);

router.delete("/:id", deleteStudent);

export default router;
