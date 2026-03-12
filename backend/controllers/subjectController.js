import Subject from "../models/subject.js";
import Class from "../models/class.js";

/* ---------------- CREATE SUBJECT ---------------- */

export const createSubject = async (req, res) => {
  try {
    const { name, status } = req.body;

    const existing = await Subject.findOne({ name });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists",
      });
    }

    const subject = await Subject.create({
      name,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET ALL SUBJECTS ---------------- */

export const getSubjects = async (req, res) => {
  try {

    const subjects = await Subject.find().sort({ createdAt: -1 });

    const classes = await Class.find()
      .populate("sectionId", "name")
      .select("name subjects sectionId");

    const result = subjects.map((sub) => {

      const usedClasses = classes.filter((cls) =>
        cls.subjects?.some(
          (s) => s.toString() === sub._id.toString()
        )
      );

      return {
        _id: sub._id,
        name: sub.name,
        status: sub.status,

        classCount: usedClasses.length,

        classes: usedClasses.map((c) => ({
          _id: c._id,
          name: c.name,
          section: c.sectionId?.name || null
        })),
      };

    });

    res.status(200).json({
      success: true,
      subjects: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ---------------- UPDATE SUBJECT ---------------- */

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE SUBJECT ---------------- */

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};