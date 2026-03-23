import express from "express";

const router = express.Router();

import {
  issueBook,
  addBook,
  getBooks,
  returnBook,
  getIssueBooks,
  updateBook,
  deleteBook,
} from "../controllers/libraryController.js";

router.get("/books", getBooks);
router.post("/books", addBook);
router.post("/add/books", addBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

router.get("/issues", getIssueBooks);
router.get("/book/getissues", getIssueBooks);
router.post("/issues", issueBook);
router.post("/book/issues", issueBook);
router.post("/issues/:issueId/return", returnBook);
router.post("/book/return", returnBook);
router.post("/books/return", returnBook);


export default router;
