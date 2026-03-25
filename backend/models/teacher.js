import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    dob: Date,
    gender: String,
    phone: String,
    email: String,
    address: String,
    governmentId: String,

    photo: {
      url: String,
      public_id: String,
    },

    qualification: String,
    experience: Number,
    subject: String,
    department: String,

    teacherId: {
      type: String,
      unique: true,
    },

    designation: String,
    joiningDate: Date,
    employmentType: String,
    salary: Number,

    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    role: {
      type: String,
      default: "teacher_admin",
    },
    username: String,
    password: String,

    rating: {
      type: Number,
      default: 4,
    },

    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    status: {
      type: String,
      default: "Present",
    },
  },
  { timestamps: true },
);

// unique index scoped to school
teacherSchema.index({ schoolId: 1, teacherId: 1 }, { unique: true });

export default mongoose.model("Teacher", teacherSchema);
