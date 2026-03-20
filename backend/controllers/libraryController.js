import mongoose from "mongoose";
import Issue from "../models/issueschema.js";
import Book from "../models/bookschema.js"


export const issueBook = async (req, res) => {
  try {
    const { schoolId, bookId, studentId, dueDate } = req.body;

    const book = await Book.findOne({ _id: bookId, schoolId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({ error: 'No copies available' });
    }

    const issue = await Issue.create({
      schoolId,
      bookId,
      studentId,
      dueDate,
      status: 'Issued',
    });

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      message: 'Book issued successfully',
      issue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



    // add book 
 export const addBook = async (req, res) => {
    console.log("route hit")
  try {
    const {
      schoolId,
      title,
      author,
      isbn,
      totalCopies,
      category
    } = req.body;

    // Basic validation
    if (!schoolId || !title || !author || !isbn) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check duplicate ISBN in same school
    const existingBook = await Book.findOne({ schoolId, isbn });
    if (existingBook) {
      return res.status(400).json({ error: "Book with this ISBN already exists" });
    }

    const book = await Book.create({
      schoolId,
      title,
      author,
      isbn,
      category,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1
    });

    res.status(201).json({
      message: "Book added successfully",
      book
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get all  book with search also -
export const getBooks = async (req, res) => {
  try {
    const { schoolId, search = '' } = req.query;

    if (!schoolId) {
      return res.status(400).json({ error: "schoolId is required" });
    }

    let query = { schoolId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 }); // latest first

    res.json(books);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Return Book
export const returnBook = async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ error: "issueId is required" });
    }

    const issue = await Issue.findById(issueId).populate('bookId');

    if (!issue) {
      return res.status(404).json({ error: "Issue record not found" });
    }

    if (issue.status === 'Returned') {
      return res.status(400).json({ error: "Book already returned" });
    }

    const today = new Date();
    let lateFee = 0;

    // Late fee calculation
    if (today > issue.dueDate) {
      const diffDays = Math.ceil(
        (today - issue.dueDate) / (1000 * 60 * 60 * 24)
      );
      lateFee = diffDays * 10; // ₹10 per day
    }

    // Update issue record
    issue.status = 'Returned';
    issue.returnDate = today;
    await issue.save();

    // Increase available copies
    await Book.findByIdAndUpdate(issue.bookId._id, {
      $inc: { availableCopies: 1 }
    });

    res.json({
      message: "Book returned successfully",
      lateFee,
      issue
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};