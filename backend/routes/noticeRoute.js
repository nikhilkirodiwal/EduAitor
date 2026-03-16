import express from "express";
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../controllers/noticeController.js";

const router = express.Router();

router.get("/:schoolId", getAllNotices);
router.get("/detail/:id", getNoticeById);
router.post("/:schoolId", createNotice);
router.put("/:id", updateNotice);
router.delete("/:id", deleteNotice);

export default router;
