import express from "express";
import {
  createTerm,
  getTerms,
  updateTerm,
  deleteTerm
} from "../controllers/termController.js";

const router = express.Router();

router.post("/", createTerm);
router.get("/", getTerms);
router.put("/:termId", updateTerm);
router.delete("/:termId", deleteTerm);

export default router;