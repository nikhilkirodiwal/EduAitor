import Teacher from "../models/teacher.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* ================= GENERATE TEACHER ID ================= */

const generateTeacherId = async (schoolId) => {
  const count = await Teacher.countDocuments({ schoolId });

  const next = count + 1;

  return `TCH${String(next).padStart(4, "0")}`;
};

/* ================= CREATE TEACHER ================= */

export const createTeacher = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const files = req.files || {};

    let photo = {};

    if (files.photo) {
      const uploaded = await uploadToCloudinary(files.photo[0], "teachers");

      photo = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // Auto-generate teacher ID based on school
    const teacherId = await generateTeacherId(schoolId);

    // Parse assignedClasses if it's a JSON string
    let assignedClasses = req.body.assignedClasses;
    if (typeof assignedClasses === "string") {
      try {
        assignedClasses = JSON.parse(assignedClasses);
      } catch (e) {
        assignedClasses = [];
      }
    }

    const teacher = await Teacher.create({
      ...req.body,
      teacherId,
      photo,
      assignedClasses,
      schoolId,
    });

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Create teacher error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create teacher",
    });
  }
};

/* ================= GET ALL TEACHERS ================= */

export const getTeachers = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const teachers = await Teacher.find({ schoolId })
      .populate("assignedClasses", "name className section")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("Get teachers error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch teachers",
    });
  }
};

/* ================= GET SINGLE TEACHER ================= */

export const getTeacher = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const teacher = await Teacher.findOne({
      _id: req.params.id,
      schoolId,
    }).populate("assignedClasses", "name className section");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch teacher",
    });
  }
};

/* ================= UPDATE TEACHER ================= */

export const updateTeacher = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const safeSchoolId = Array.isArray(schoolId) ? schoolId[0] : schoolId;

    const teacher = await Teacher.findOne({
      _id: req.params.id,
      schoolId: safeSchoolId,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const files = req.files || {};
    let photo = teacher.photo;

    if (files.photo) {
      // Delete old photo if exists
      if (photo?.public_id) {
        await deleteFromCloudinary(photo.public_id);
      }

      const uploaded = await uploadToCloudinary(files.photo[0], "teachers");

      photo = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    // Parse assignedClasses if it's a JSON string
    let assignedClasses = req.body.assignedClasses;
    if (typeof assignedClasses === "string") {
      try {
        assignedClasses = JSON.parse(assignedClasses);
      } catch (e) {
        assignedClasses = teacher.assignedClasses;
      }
    }

    delete req.body.schoolId;

    // Prepare update data
    const updateData = {
      ...req.body,
      schoolId: req.body.schoolId,
      photo,
      assignedClasses,
    };

    // Remove password from update if not provided
    if (!req.body.password || req.body.password === "") {
      delete updateData.password;
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    ).populate("assignedClasses", "name className section");

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    console.error("Update teacher error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update teacher",
    });
  }
};

/* ================= DELETE TEACHER ================= */

export const deleteTeacher = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const teacher = await Teacher.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Delete photo from cloudinary if exists
    if (teacher.photo?.public_id) {
      await deleteFromCloudinary(teacher.photo.public_id);
    }

    await teacher.deleteOne();

    res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete teacher",
    });
  }
};
