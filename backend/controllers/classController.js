import Class from "../models/class.js";

/* CREATE CLASS */

export const createClass = async (req, res) => {
  try {
    let { name, sectionId, roomNumber, teacherId, capacity, subjects } =
      req.body;

    if (!name || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: "Class name and room number are required",
      });
    }

    // convert empty string to null
    sectionId = sectionId || null;
    teacherId = teacherId || null;

    const newClass = await Class.create({
      name,
      sectionId,
      roomNumber,
      teacherId,
      capacity,
      subjects,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* GET CLASSES */

export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("sectionId", "name")
      .populate("teacherId", "fullName")
      .populate("subjects", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE CLASS */

export const updateClass = async (req, res) => {
  try {
    let { sectionId, teacherId } = req.body;

    if (sectionId === "") req.body.sectionId = null;
    if (teacherId === "") req.body.teacherId = null;

    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate("sectionId", "name")
      .populate("teacherId", "fullName")
      .populate("subjects", "name");

    res.json({
      success: true,
      class: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DELETE CLASS */

export const deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Class deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
