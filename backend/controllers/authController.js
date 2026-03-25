import School from "../models/school.js";
import Teacher from "../models/teacher.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ---------- SUPER ADMIN ---------- */
    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      return res.json({
        success: true,
        message: "Super Admin login successful",
        data: {
          role: "super_admin",
          email: process.env.SUPER_ADMIN_EMAIL,
        },
      });
    }

    /* ---------- TEACHER ADMIN ---------- */
    const teacher = await Teacher.findOne({
      $or: [{ email }, { username: email }],
    });

    if (teacher && teacher.password === password) {
      return res.json({
        success: true,
        message: "Teacher login successful",
        data: {
          role: "teacher_admin",

          teacher_id: teacher._id,
          name: teacher.fullName,
          email: teacher.email,

          school_id: teacher.schoolId,
        },
      });
    }

    /* ---------- SCHOOL ADMIN ---------- */
    const school = await School.findOne({ admin_email: email });

    if (!school || school.admin_password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.json({
      success: true,
      message: "School Admin login successful",
      data: {
        role: "school_admin",
        school_id: school._id,
        school_name: school.school_name,
        email: school.admin_email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
