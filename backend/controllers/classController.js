import Class from "../models/class.js";

/* ── CREATE CLASS ── */
export const createClass = async (req, res) => {
  try {
    let { name, details, status, schoolId } = req.body;

    if (!schoolId)
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });

    if (!name)
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });

    if (!details || details.length === 0)
      return res.status(400).json({
        success: false,
        message: "At least one detail entry is required",
      });

    name = name.trim();

    const exists = await Class.findOne({
      schoolId,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists)
      return res.status(400).json({
        success: false,
        message: `"${name}" already exists`,
      });

    for (const d of details) {
      if (!d.roomNumber)
        return res.status(400).json({
          success: false,
          message: "Room number required",
        });
    }

    const sanitized = details.map((d) => ({
      ...d,
      sectionId: d.sectionId || null,
      teacherId: d.teacherId || null,
      subjects: d.subjects || [],
      capacity: d.capacity || 40,
    }));

    const newClass = await Class.create({
      name,
      schoolId,
      details: sanitized,
      status,
    });

    const populated = await Class.findById(newClass._id)
      .populate("details.sectionId", "name status")
      .populate("details.teacherId", "fullName")
      .populate("details.subjects", "name");

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET ALL CLASSES ── */
export const getClasses = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId)
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });

    const classes = await Class.find({ schoolId })
      .populate("details.sectionId", "name status")
      .populate("details.teacherId", "fullName")
      .populate("details.subjects", "name")
      .sort({ name: 1 });

    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET SINGLE CLASS ── */
export const getClassById = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId)
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });

    const cls = await Class.findOne({
      _id: req.params.id,
      schoolId,
    })
      .populate("details.sectionId", "name status")
      .populate("details.teacherId", "fullName")
      .populate("details.subjects", "name");

    if (!cls)
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });

    res.json({ success: true, class: cls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET FLAT — for dropdowns ──
   returns one entry per detail:
   "Class 1"       (sectionId: null)
   "Class 1 - A"   (sectionId: populated)
   "Class 1 - B"
*/
export const getClassesFlat = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId)
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });

    const classes = await Class.find({
      schoolId,
      status: "Active",
    })
      .populate("details.sectionId", "name status")
      .sort({ name: 1 });

    const result = [];

    classes.forEach((cls) => {
      cls.details.forEach((d) => {
        result.push({
          _id: `${cls._id}_${d._id}`,
          displayName: d.sectionId
            ? `${cls.name} - ${d.sectionId.name}`
            : cls.name,
          classId: cls._id,
          className: cls.name,
          detailId: d._id,
          sectionId: d.sectionId?._id || null,
          sectionName: d.sectionId?.name || null,
        });
      });
    });

    res.json({ success: true, classes: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── UPDATE CLASS ── */
export const updateClass = async (req, res) => {
  try {
    const { schoolId, name, details, status } = req.body;

    if (!schoolId)
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });

    const cls = await Class.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!cls)
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });

    if (name && name !== cls.name) {
      const exists = await Class.findOne({
        schoolId,
        name: { $regex: `^${name}$`, $options: "i" },
        _id: { $ne: cls._id },
      });

      if (exists)
        return res.status(400).json({
          success: false,
          message: "Class name already exists",
        });
    }

    const sanitized = details?.map((d) => ({
      ...d,
      sectionId: d.sectionId || null,
      teacherId: d.teacherId || null,
      subjects: d.subjects || [],
      capacity: d.capacity || 40,
    }));

    cls.name = name || cls.name;
    cls.details = sanitized || cls.details;
    cls.status = status || cls.status;

    await cls.save();

    const populated = await Class.findById(cls._id)
      .populate("details.sectionId", "name status")
      .populate("details.teacherId", "fullName")
      .populate("details.subjects", "name");

    res.json({
      success: true,
      message: "Class updated successfully",
      class: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE CLASS ── */
export const deleteClass = async (req, res) => {
  try {
    const { schoolId } = req.query;

    const cls = await Class.findOne({
      _id: req.params.id,
      schoolId,
    });

    if (!cls)
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });

    await cls.deleteOne();

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
