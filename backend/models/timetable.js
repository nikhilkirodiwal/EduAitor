import mongoose from "mongoose";

const periodEntrySchema = new mongoose.Schema({
  periodId: {
    type: String,
    required: true
  },

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  },

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },

  type: {
    type: String,
    enum: ["subject", "activity", "break", "free"],
    default: "subject"
  }
});

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true
  },

  periods: [periodEntrySchema]
});

const timetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true
  },

  schedule: [dayScheduleSchema]

}, { timestamps: true });

export default mongoose.model("Timetable", timetableSchema);