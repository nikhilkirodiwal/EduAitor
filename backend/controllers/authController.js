import School from "../models/school.js";
import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    /* ---------- SUPER ADMIN ---------- */
    if (
      email === process.env.SUPER_ADMIN_EMAIL &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      const token = generateToken({ role: "super_admin", email });
      res.cookie("token", token, cookieOptions);
      return res.json({
        success: true,
        token,
        message: "Super Admin login successful",
        data: { role: "super_admin", email: process.env.SUPER_ADMIN_EMAIL },
      });
    }

    /* ---------- TEACHER ADMIN ---------- */
    const teacher = await Teacher.findOne({
      $or: [{ email }, { username: email }],
    });

    if (teacher && (await bcrypt.compare(password, teacher.password))) {
      const token = generateToken({
        role: "teacher_admin",
        email: teacher.email,
        school_id: teacher.schoolId,
        teacher_id: teacher._id,
        name: teacher.fullName,
      });
      res.cookie("token", token, cookieOptions);
      return res.json({
        success: true,
        token,
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

    /* ---------- STUDENT / PARENT ADMIN ---------- */
    const student = await Student.findOne({ username: email });

    if (student && (await bcrypt.compare(password, student.password))) {
      const token = generateToken({
        role: "student_admin",
        username: student.username,
        school_id: student.schoolId,
        student_id: student._id,
        name: `${student.firstName} ${student.lastName}`,
      });
      res.cookie("token", token, cookieOptions);
      return res.json({
        success: true,
        token,
        message: "Parent login successful",
        data: {
          role: "student_admin",
          student_id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          username: student.username,
          school_id: student.schoolId,
        },
      });
    }

    /* ---------- SCHOOL ADMIN ---------- */
    const school = await School.findOne({ admin_email: email });

    if (!school || !(await bcrypt.compare(password, school.admin_password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      role: "school_admin",
      email: school.admin_email,
      school_id: school._id,
      name: school.school_name,
    });
    res.cookie("token", token, cookieOptions);
    return res.json({
      success: true,
      token,
      message: "School Admin login successful",
      data: {
        role: "school_admin",
        school_id: school._id,
        school_name: school.school_name,
        email: school.admin_email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//   import School from "../models/school.js";
// import Teacher from "../models/teacher.js";
// import Student from "../models/student.js";
// import Role from "../models/role.js";
// import Access from "../models/access.js";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

// const generateToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });
// };

// const cookieOptions = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
// };

// export const getPermissionsForRole = async (roleName) => {
//   const roleDoc = await Role.findOne({ name: roleName });
//   if (!roleDoc) return {};

//   const access = await Access.findOne({ role: roleDoc._id });
//   return access?.permissions || {};
// };

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     /* ---------- SUPER ADMIN ---------- */
//     if (
//       email === process.env.SUPER_ADMIN_EMAIL &&
//       password === process.env.SUPER_ADMIN_PASSWORD
//     ) {
//       const access = await getPermissionsForRole("super_admin");
//     const token = generateToken({ role: "super_admin", email });
//       res.cookie("token", token, cookieOptions);
//       return res.json({
//         success: true,
//         message: "Super Admin login successful",
//         data: { role: "super_admin", email: process.env.SUPER_ADMIN_EMAIL, access },
//       });
//     }

//     /* ---------- TEACHER ADMIN ---------- */
//     const teacher = await Teacher.findOne({
//       $or: [{ email }, { username: email }],
//     });

//     if (teacher && (await bcrypt.compare(password, teacher.password))) {
//       const access = await getPermissionsForRole("teacher_admin");
//       const token = generateToken({
//         role: "teacher_admin",
//         email: teacher.email,
//         school_id: teacher.schoolId,
//         teacher_id: teacher._id,
//         name: teacher.fullName,
//       });
//       res.cookie("token", token, cookieOptions);
//       return res.json({
//         success: true,
//         message: "Teacher login successful",
//         data: {
//           role: "teacher_admin",
//           teacher_id: teacher._id,
//           name: teacher.fullName,
//           email: teacher.email,
//           school_id: teacher.schoolId,
//           access,
//         },
//       });
//     }

//     /* ---------- STUDENT / PARENT ADMIN ---------- */
//     const student = await Student.findOne({ username: email });

//     if (student && (await bcrypt.compare(password, student.password))) {
//       const access = await getPermissionsForRole("student_admin");
//       const token = generateToken({
//         role: "student_admin",
//         username: student.username,
//         school_id: student.schoolId,
//         student_id: student._id,
//         name: `${student.firstName} ${student.lastName}`,
//       });
//       res.cookie("token", token, cookieOptions);
//       return res.json({
//         success: true,
//         message: "Parent login successful",
//         data: {
//           role: "student_admin",
//           student_id: student._id,
//           name: `${student.firstName} ${student.lastName}`,
//           username: student.username,
//           school_id: student.schoolId,
//           access,
//         },
//       });
//     }

//     /* ---------- SCHOOL ADMIN ---------- */
//     const school = await School.findOne({ admin_email: email });

//     if (!school || !(await bcrypt.compare(password, school.admin_password))) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     const access = await getPermissionsForRole("school_admin");
//     const token = generateToken({
//       role: "school_admin",
//       email: school.admin_email,
//       school_id: school._id,
//       name: school.school_name,
//     });
//     res.cookie("token", token, cookieOptions);
//     return res.json({
//       success: true,
//       message: "School Admin login successful",
//       data: {
//         role: "school_admin",
//         school_id: school._id,
//         school_name: school.school_name,
//         email: school.admin_email,
//         access,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
