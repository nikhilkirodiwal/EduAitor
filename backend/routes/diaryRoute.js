import express from "express";
import {
  createDiary,
  getDiary,
  updateDiary,
  deleteDiary,
} from "../controllers/diaryController.js";

import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createDiary);
router.get("/", authMiddleware, getDiary);
router.put("/:id", authMiddleware, updateDiary);
router.delete("/:id", authMiddleware, deleteDiary);

export default router;