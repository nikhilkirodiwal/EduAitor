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

    assignedClasses: String,
    role: String,
    username: String,
    password: String,

    rating: {
      type: Number,
      default: 4,
    },

    status: {
      type: String,
      default: "Present",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Teacher", teacherSchema);
