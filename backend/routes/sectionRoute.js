import express from "express";

import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
  addSubSection,
  updateSubSection,
  deleteSubSection,
} from "../controllers/sectionController.js";

const router = express.Router();


// SECTION ROUTES
router.post("/create", createSection);

router.get("/all", getSections);

router.put("/update/:id", updateSection);

router.delete("/delete/:id", deleteSection);


// SUBSECTION ROUTES
router.post("/sub/create/:sectionId", addSubSection);

router.put("/sub/update/:sectionId/:subId", updateSubSection);

router.delete("/sub/delete/:sectionId/:subId", deleteSubSection);


export default router;