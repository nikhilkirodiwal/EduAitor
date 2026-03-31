import express from "express";
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../controllers/noticeController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllNotices);
router.get("/detail/:id", getNoticeById);
router.post("/create", authMiddleware , createNotice);
router.put("/:id", updateNotice);
router.delete("/:id", deleteNotice);

export default router;
