import Diary from "../models/diary.js";
import Class from "../models/class.js";
import mongoose from "mongoose";

export const createDiary = async (req, res) => {
  console.log(req.body);
  console.log(req.user);
  try {
    const data = await Diary.create({
      ...req.body,
      schoolId: req.user.school_id,
      teacherId: req.user.teacher_id,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDiary = async (req, res) => {
  try {
    const data = await Diary.find({
      teacherId: req.user.teacher_id,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDiary = async (req, res) => {
  try {
    const data = await Diary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDiary = async (req, res) => {
  try {
    await Diary.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/// principal controller -
export const getPrincipalDiary = async (req, res) => {
  try {
    const {
      classId,
      sectionId,
      subjectId,
      teacherId,
      type,
      date,
      month,
      year,
      page = 1,
      limit = 30,
    } = req.query;
    console.log("Filters:", req.query);

    // schoolId should come from authenticated principal session
    const schoolId = req.user?.school_id || req.query.schoolId;

    const filter = { schoolId };

    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
    if (type) filter.type = type;

    // Single date filter — match the full day
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    // Month + year filter (if date not set)
    if (!date && (month || year)) {
      const y = parseInt(year) || new Date().getFullYear();
      const m = month !== undefined ? parseInt(month) : null; // 0-indexed from frontend

      if (m !== null) {
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 1);
        filter.date = { $gte: start, $lt: end };
      } else {
        // Only year filter
        filter.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [entries, total] = await Promise.all([
      Diary.find(filter)
        .populate("teacherId", "name email profilePic")
        .populate("classId", "name details")
        .populate("subjectId", "name code")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Diary.countDocuments(filter),
    ]);

    // Resolve section name from class.details since sectionId has no ref
    const enriched = entries.map((entry) => {
      const classDetails = entry.classId?.details || [];
      const sectionDetail = classDetails.find(
        (d) => d.sectionId?.toString() === entry.sectionId?.toString(),
      );
      return {
        ...entry,
        sectionName: sectionDetail?.sectionId?.name || null,
        roomNumber: sectionDetail?.roomNumber || null,
        // strip bulky details array from response
        classId: entry.classId
          ? { _id: entry.classId._id, name: entry.classId.name }
          : null,
      };
    });

    // Aggregate stats for the current filter
    const stats = await Diary.aggregate([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const typeCounts = { homework: 0, classwork: 0, remark: 0 };
    stats.forEach(({ _id, count }) => {
      if (_id in typeCounts) typeCounts[_id] = count;
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      stats: { ...typeCounts, total },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getPrincipalDiary:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── GET /api/diary/principal/filters ─────────────────────────────────────────
// Returns distinct classes, teachers for filter dropdowns
export const getPrincipalDiaryFilters = async (req, res) => {
  try {
    const schoolId = req.user?.school_id || req.query.schoolId;

    const [classes, teachers] = await Promise.all([
      Class.find({ schoolId, status: "Active" })
        .select("name details")
        .populate("details.sectionId", "name")
        .lean(),
      Diary.distinct("teacherId", { schoolId }).then((ids) =>
        ids.length
          ? mongoose
              .model("Teacher")
              .find({ _id: { $in: ids } })
              .select("fullName")
              .lean()
          : [],
      ),
    ]);

    return res.status(200).json({ success: true, classes, teachers });
  } catch (error) {
    console.error("getPrincipalDiaryFilters:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
