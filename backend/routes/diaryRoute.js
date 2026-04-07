import express from "express";
import {
  createDiary,
  getDiary,
  updateDiary,
  deleteDiary,
  getPrincipalDiaryFilters,
  getPrincipalDiary,
} from "../controllers/diaryController.js";

import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createDiary);
router.get("/", authMiddleware, getDiary);
router.put("/:id", authMiddleware, updateDiary);
router.delete("/:id", authMiddleware, deleteDiary);
router.get("/principal/filters", authMiddleware, getPrincipalDiaryFilters);
router.get("/principal", authMiddleware, getPrincipalDiary);

export default router;