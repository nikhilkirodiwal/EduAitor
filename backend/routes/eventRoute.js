import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/:schoolId", getAllEvents);
router.get("/detail/:id", getEventById);
router.post("/:schoolId", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
