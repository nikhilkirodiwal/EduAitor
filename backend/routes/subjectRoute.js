import express from "express";

import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/create", createSubject);

router.get("/all", getSubjects);

router.put("/update/:id", updateSubject);

router.delete("/delete/:id", deleteSubject);

export default router;