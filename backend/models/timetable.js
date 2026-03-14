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

  substituteTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null
  },

  customName: String,

  type: {
    type: String,
    enum: ["lecture", "activity", "lunch", "free"],
    default: "lecture"
  },

  status: {
    type: String,
    enum: ["normal", "no-teacher", "teacher-absent"],
    default: "normal"
  }
});

const dayScheduleSchema = new mongoose.Schema({
  day: String,
  periods: [periodEntrySchema]
});

const periodConfigSchema = new mongoose.Schema({
  id: String,
  name: String,
  start: String,
  end: String
});

const timetableSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    unique: true
  },

  periodConfigs: [periodConfigSchema],

  schedule: [dayScheduleSchema]

}, { timestamps: true });

export default mongoose.model("Timetable", timetableSchema);