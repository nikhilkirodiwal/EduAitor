import express from "express";

import {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
} from "../controllers/classController.js";

const router = express.Router();

router.post("/create", createClass);
router.get("/all", getClasses);
router.put("/update/:id", updateClass);
router.delete("/delete/:id", deleteClass);

export default router;