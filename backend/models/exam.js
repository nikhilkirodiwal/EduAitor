import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
  schoolId: { type: String, required: true }, // Filter for multi-school
  className: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: String, required: true },
  examDate: { type: Date, required: true },
  dayOfWeek: { type: String }, // e.g., "Monday"
  startTime: { type: String, required: true }, // e.g., "09:00 AM"
  endTime: { type: String, required: true },   // e.g., "12:00 PM"
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true }
});

export default  mongoose.model('Exam', ExamSchema);