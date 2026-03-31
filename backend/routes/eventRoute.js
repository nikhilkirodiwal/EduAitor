import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { authMiddleware } from "../auth/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getAllEvents);
router.get("/detail/:id", getEventById);
router.post("/create", authMiddleware, createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
