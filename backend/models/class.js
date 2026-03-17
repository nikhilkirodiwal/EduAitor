import mongoose from "mongoose";

/* ── per-section fields (or class-level if no sections) ── */
const sectionDetailSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null, // null = class-level entry (no section)
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    capacity: {
      type: Number,
      default: 40,
    },

    studentCount: {
      type: Number,
      default: 0,
    },

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
  },
  { _id: true },
);

/* ── main class schema ── */
const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // only one "Class 1" document
    },

    /*
      details array rules:
      - no sections → one entry with sectionId: null
      - with sections → one entry per section, sectionId populated
    */
    details: [sectionDetailSchema],

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Class", classSchema);
