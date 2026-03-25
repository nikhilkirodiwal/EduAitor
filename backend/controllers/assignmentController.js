import Assignment from "../models/assignment.js";
import Teacher from "../models/teacher.js";

/* ================= CREATE ================= */

export const createAssignment = async (req, res) => {
  try {
    const {
      teacherId,
      schoolId,
      title,
      description,
      classId,
      subjectId,
      chapterId,
      topicId,
      questions,
      dueDate,
      duration,
      maxAttempts,
    } = req.body;

    if (!teacherId || !schoolId || !classId || !subjectId || !chapterId) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // ✅ CLASS VALIDATION
    const isAllowed = teacher.assignedClasses.some(
      (c) => c.toString() === classId,
    );

    if (!isAllowed) {
      return res.status(403).json({
        message: "Unauthorized class",
      });
    }

    // ✅ CALCULATE MARKS
    const totalMarks = (questions || []).reduce(
      (sum, q) => sum + (q.marks || 0),
      0,
    );

    const assignment = await Assignment.create({
      title,
      description,
      classId,
      subjectId,
      chapterId,
      topicId,
      questions,
      totalMarks,
      dueDate,
      duration,
      maxAttempts,
      teacherId,
      schoolId,
    });

    res.json({
      success: true,
      message: "Assignment created",
      data: assignment,
    });
  } catch (err) {
    console.error("createAssignment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET TEACHER ASSIGNMENTS ================= */

export const getTeacherAssignments = async (req, res) => {
  try {
    const { teacherId } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        message: "teacherId is required",
      });
    }

    const assignments = await Assignment.find({ teacherId })
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .populate("topicId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) {
    console.error("getTeacherAssignments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET SINGLE ================= */

export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .populate("topicId", "name");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ success: true, data: assignment });
  } catch (err) {
    console.error("getAssignmentById:", err);
    res.status(500).json({ success: false });
  }
};

/* ================= UPDATE ================= */

export const updateAssignment = async (req, res) => {
  try {
    const { questions } = req.body;

    if (questions) {
      req.body.totalMarks = questions.reduce(
        (sum, q) => sum + (q.marks || 0),
        0,
      );
    }

    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateAssignment:", err);
    res.status(500).json({ success: false });
  }
};

/* ================= DELETE ================= */

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Not found" });
    }

    await assignment.deleteOne();

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("deleteAssignment:", err);
    res.status(500).json({ success: false });
  }
};

/* ================= TOGGLE PUBLISH ================= */

export const togglePublishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Not found" });
    }

    assignment.isPublished = !assignment.isPublished;

    if (assignment.isPublished) {
      assignment.status = "active";
    }

    await assignment.save();

    res.json({
      success: true,
      message: "Publish status updated",
      data: assignment,
    });
  } catch (err) {
    console.error("togglePublish:", err);
    res.status(500).json({ success: false });
  }
};
