import Notice from "../models/notice.js";

export const getAllNotices = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    const notices = await Notice.find({ schoolId }).sort({ createdAt: -1 });

    const total = notices.length;
    const active = notices.filter((n) => n.isActive).length;
    const highPriority = notices.filter((n) => n.priority === "High").length;
    const audiences = [...new Set(notices.map((n) => n.audience))].length;

    res.status(200).json({
      success: true,
      stats: { total, active, highPriority, audiences },
      notices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    res.status(200).json({ success: true, notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createNotice = async (req, res) => {
  try {
    const schoolId = req.user?.school_id;
    if (req.body.audience !== "Class") req.body.assignedClass = "";
    const notice = await Notice.create({ ...req.body, schoolId });
    res
      .status(201)
      .json({ success: true, message: "Notice created successfully", notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateNotice = async (req, res) => {
  try {
    if (req.body.audience !== "Class") req.body.assignedClass = "";
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    res
      .status(200)
      .json({ success: true, message: "Notice updated successfully", notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    res
      .status(200)
      .json({ success: true, message: "Notice deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllAdminNotices = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const schoolId = req.query.schoolId;
    const notices = await Notice.find({ schoolId }).sort({ createdAt: -1 });

    const total = notices.length;
    const active = notices.filter((n) => n.isActive).length;
    const highPriority = notices.filter((n) => n.priority === "High").length;
    const audiences = [...new Set(notices.map((n) => n.audience))].length;

    res.status(200).json({
      success: true,
      stats: { total, active, highPriority, audiences },
      notices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
