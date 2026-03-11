import Student from "../models/student.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* ================= GENERATE TEACHER ID ================= */

const generateStudentId = async () => {

  const count = await Student.countDocuments();

  const next = count + 1;

  return `STU${String(next).padStart(4,"0")}`;

};

/* ================= CREATE STUDENT ================= */

export const createStudent = async (req, res) => {
  try {
    const files = req.files || {};

    const documents = {};

    const uploadFile = async (field, folder) => {
      if (files[field]) {
        const uploaded = await uploadToCloudinary(files[field][0], folder);

        documents[field] = {
          url: uploaded.url,
          public_id: uploaded.public_id,
        };
      }
    };

    await uploadFile("studentPhoto", "students");
    await uploadFile("fatherPhoto", "students");
    await uploadFile("motherPhoto", "students");
    await uploadFile("guardianPhoto", "students");

    await uploadFile("birthCertificate", "documents");
    await uploadFile("transferCertificate", "documents");

    await uploadFile("studentAadhar", "documents");
    await uploadFile("fatherAadhar", "documents");
    await uploadFile("motherAadhar", "documents");

    const studentId = await generateStudentId();

    const student = await Student.create({
      ...req.body,
      studentId,
      documents,
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL STUDENTS ================= */

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET SINGLE STUDENT ================= */

export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE STUDENT ================= */

export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const files = req.files || {};
    const documents = student.documents || {};

    const updateFile = async (field, folder) => {
      if (files[field]) {
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

    await updateFile("studentPhoto", "students");
    await updateFile("fatherPhoto", "students");
    await updateFile("motherPhoto", "students");
    await updateFile("guardianPhoto", "students");

    await updateFile("birthCertificate", "documents");
    await updateFile("transferCertificate", "documents");

    await updateFile("studentAadhar", "documents");
    await updateFile("fatherAadhar", "documents");
    await updateFile("motherAadhar", "documents");

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        documents,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE STUDENT ================= */

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const docs = student.documents || {};

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
