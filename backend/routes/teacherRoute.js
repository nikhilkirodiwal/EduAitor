import express from "express";
import upload from "../middlewares/upload.js";

import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  createTeacher,
);

router.put(
  "/:id",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  updateTeacher,
);

router.get("/", getTeachers);

router.get("/:id", getTeacher);

router.delete("/:id", deleteTeacher);

export default router;
