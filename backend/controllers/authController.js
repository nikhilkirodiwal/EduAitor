import School from "../models/school.js";

/* ---------------- LOGIN ---------------- */

export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    /* ---------- SUPER ADMIN LOGIN ---------- */

    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {

      return res.json({
        success: true,
        message: "Super Admin login successful",
        data: {
          role: "super_admin",
          email: process.env.SUPER_ADMIN_EMAIL
        }
      });

    }

    /* ---------- SCHOOL ADMIN LOGIN ---------- */

    const school = await School.findOne({ admin_email: email });

    if (!school) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (school.admin_password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    return res.json({
      success: true,
      message: "School Admin login successful",
      data: {
        role: "school_admin",
        school_id: school._id,
        school_name: school.school_name,
        email: school.admin_email
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};