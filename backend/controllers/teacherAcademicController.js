import Teacher from "../models/teacher.js";
import Class from "../models/class.js";
import Chapter from "../models/chapter.js";
import Topic from "../models/topic.js";

/* ================= GET TEACHER CLASSES ================= */

export const getTeacherClasses = async (req, res) => {
  try {
    const { teacherId } = req.query;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classes = await Class.find({
      _id: { $in: teacher.assignedClasses },
      schoolId: teacher.schoolId,
      status: "Active",
    }).sort({ name: 1 });

    res.json({ success: true, data: classes });
  } catch (err) {
    console.error("getTeacherClasses:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET SUBJECTS BY CLASS ================= */

export const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    const cls = await Class.findById(classId).populate(
      "details.subjects",
      "name status",
    );

    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // ✅ Extract unique subjects
    const subjectMap = new Map();

    cls.details.forEach((d) => {
      d.subjects.forEach((s) => {
        subjectMap.set(s._id.toString(), s);
      });
    });

    const subjects = Array.from(subjectMap.values());

    res.json({ success: true, data: subjects });
  } catch (err) {
    console.error("getSubjectsByClass:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET CHAPTERS ================= */

export const getChaptersBySubject = async (req, res) => {
  try {
    const { classId, subjectId, schoolId } = req.query;

    if (!classId || !subjectId || !schoolId) {
      return res.status(400).json({
        message: "classId, subjectId, schoolId are required",
      });
    }

    const chapters = await Chapter.find({
      classId,
      subjectId,
      schoolId,
      status: "active",
    }).sort({ order: 1 });

    res.json({ success: true, data: chapters });
  } catch (err) {
    console.error("getChapters:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET TOPICS ================= */

export const getTopicsByChapter = async (req, res) => {
  try {
    const { chapterId, schoolId } = req.query;

    if (!chapterId || !schoolId) {
      return res.status(400).json({
        message: "chapterId and schoolId are required",
      });
    }

    const topics = await Topic.find({
      chapterId,
      schoolId,
      status: "active",
    }).sort({ order: 1 });

    res.json({ success: true, data: topics });
  } catch (err) {
    console.error("getTopics:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
