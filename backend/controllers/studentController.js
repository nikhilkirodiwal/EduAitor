import Student from "../models/student.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* ================= GENERATE STUDENT ID ================= */

const generateStudentId = async (schoolId) => {
  const count = await Student.countDocuments({ schoolId });

  const next = count + 1;

  return `STU${String(next).padStart(4, "0")}`;
};

/* ================= CREATE STUDENT ================= */

export const createStudent = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { ...safeBody } = req.body;

    const totalDue = Number(safeBody.finalFee) || 0;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const files = req.files || {};
    const documents = {};

    const uploadFile = async (field, folder) => {
      try {
        if (!files[field] || !files[field][0]) return;

        const uploaded = await uploadToCloudinary(files[field][0], folder);

        documents[field] = {
          url: uploaded.url,
          public_id: uploaded.public_id,
        };
      } catch (err) {
        console.error(`Upload failed for ${field}`, err);
      }
    };

    // Upload images
    await uploadFile("studentPhoto", "students");
    await uploadFile("fatherPhoto", "students");
    await uploadFile("motherPhoto", "students");
    await uploadFile("guardianPhoto", "students");

    // Upload documents
    await uploadFile("birthCertificate", "documents");
    await uploadFile("transferCertificate", "documents");

    await uploadFile("studentAadhar", "documents");
    await uploadFile("fatherAadhar", "documents");
    await uploadFile("motherAadhar", "documents");

    const studentId = await generateStudentId(schoolId);

    const student = await Student.create({
      ...safeBody,
      schoolId,
      studentId,
      totalDue,
      totalPaid: 0,
      documents,
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error("Create student error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create student",
    });
  }
};

/* ================= GET ALL STUDENTS ================= */

export const getStudents = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const students = await Student.find({ schoolId })
      .populate("classId", "name className")
      .populate("sectionId", "name sectionName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch students",
    });
  }
};

/* ================= GET SINGLE STUDENT ================= */

export const getStudent = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      schoolId,
    })
      .populate("classId", "name className")
      .populate("sectionId", "name sectionName");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student",
    });
  }
};

/* ================= UPDATE STUDENT ================= */

export const updateStudent = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const { ...safeBody } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const files = req.files || {};
    const documents = student.documents || {};

    const updateFile = async (field, folder) => {
      if (files[field] && files[field][0]) {
        // Delete old file
        if (documents[field]?.public_id) {
          await deleteFromCloudinary(documents[field].public_id);
        }

        const uploaded = await uploadToCloudinary(files[field][0], folder);

        documents[field] = {
          url: uploaded.url,
          public_id: uploaded.public_id,
        };
      }
    };

    // Update images
    await updateFile("studentPhoto", "students");
    await updateFile("fatherPhoto", "students");
    await updateFile("motherPhoto", "students");
    await updateFile("guardianPhoto", "students");

    // Update documents
    await updateFile("birthCertificate", "documents");
    await updateFile("transferCertificate", "documents");

    await updateFile("studentAadhar", "documents");
    await updateFile("fatherAadhar", "documents");
    await updateFile("motherAadhar", "documents");

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      {
        ...safeBody,
        documents,
      },
      { new: true },
    )
      .populate("classId", "name className")
      .populate("sectionId", "name sectionName");

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update student",
    });
  }
};

/* ================= DELETE STUDENT ================= */

export const deleteStudent = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const student = await Student.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const docs = student.documents || {};

    // Delete all files from Cloudinary
    for (const key in docs) {
      if (docs[key]?.public_id) {
        await deleteFromCloudinary(docs[key].public_id);
      }
    }

    await student.deleteOne();

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete student",
    });
  }
};

/* ================= GET ALL STUDENTS FOR SUPER ADMIN ================= */
export const getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const schoolId = req.query.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const students = await Student.find({ schoolId })
      .populate("classId", "name className")
      .populate("sectionId", "name sectionName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch students",
    });
  }
};
