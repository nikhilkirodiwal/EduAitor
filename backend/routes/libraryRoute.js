import express from "express";

const router = express.Router();

import {issueBook,addBook,getBooks,returnBook} from "../controllers/libraryController.js"
router.post("/book/issues",issueBook)
router.get("/books",getBooks)
router.post('/books/return',returnBook)
router.post("/add/books",addBook)


export default router;