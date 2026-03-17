import Subject from "../models/subject.js";
import Class from "../models/class.js";

/* ── CREATE ── */
export const createSubject = async (req, res) => {
  try {
    const { name, status } = req.body;

    const existing = await Subject.findOne({ name });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Subject already exists" });

    const subject = await Subject.create({ name, status });

    res
      .status(201)
      .json({
        success: true,
        message: "Subject created successfully",
        subject,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET ALL ── */
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });

    const classes = await Class.find()
      .populate("details.sectionId", "name")
      .select("name details");

    const result = subjects.map((sub) => {
      const subId = sub._id.toString();

      /*
        For each class, check each detail entry's subjects array.
        Collect unique class+section combos that use this subject.
      */
      const usedIn = [];

      classes.forEach((cls) => {
        cls.details.forEach((detail) => {
          const hasSubject = detail.subjects?.some(
            (s) => s.toString() === subId,
          );

          if (hasSubject) {
            usedIn.push({
              _id: `${cls._id}_${detail._id}`,
              classId: cls._id,
              name: cls.name,
              section: detail.sectionId?.name || null,
              // display label e.g. "Class 1 - A" or "Class 1"
              label: detail.sectionId
                ? `${cls.name} - ${detail.sectionId.name}`
                : cls.name,
            });
          }
        });
      });

      return {
        _id: sub._id,
        name: sub.name,
        status: sub.status,
        classCount: usedIn.length,
        classes: usedIn,
      };
    });

    res.status(200).json({ success: true, subjects: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── UPDATE ── */
export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });

    res
      .status(200)
      .json({
        success: true,
        message: "Subject updated successfully",
        subject,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE ── */
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });

    res
      .status(200)
      .json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
