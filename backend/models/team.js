const termSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    name: {
      type: String, // "Half Yearly", "Final"
      required: true,
    },
    order: Number,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);
