import express from "express";
import {
  createClass, getClasses, getClassById,
  getClassesFlat, updateClass, deleteClass,
} from "../controllers/classController.js";

const router = express.Router();

router.get("/flat",       getClassesFlat);  // ← before /:id
router.get("/all",        getClasses);
router.get("/:id",        getClassById);
router.post("/create",    createClass);
router.put("/update/:id", updateClass);
router.delete("/delete/:id", deleteClass);

export default router;