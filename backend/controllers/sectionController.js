import Section from "../models/section.js";

/* -------------------------------- CREATE SECTION ------------------------------- */

export const createSection = async (req, res) => {
  try {
    const { name, status } = req.body;

    const section = await Section.create({
      name,
      status,
      subsections: [],
    });

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- GET SECTIONS ------------------------------- */

export const getSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sections,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- UPDATE SECTION ------------------------------- */

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const section = await Section.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    section.name = name;
    section.status = status;

    // RULE: If section becomes inactive -> all subsections inactive
    if (status === "Inactive") {
      section.subsections = section.subsections.map((sub) => ({
        ...sub.toObject(),
        status: "Inactive",
      }));
    }

    await section.save();

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- DELETE SECTION ------------------------------- */

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    await Section.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- ADD SUBSECTION ------------------------------- */

export const addSubSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, status } = req.body;

    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // If section inactive → subsection must also be inactive
    const subStatus = section.status === "Inactive" ? "Inactive" : status;

    section.subsections.push({
      name,
      status: subStatus,
    });

    await section.save();

    res.status(201).json({
      success: true,
      message: "Subsection added successfully",
      section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- UPDATE SUBSECTION ------------------------------- */

export const updateSubSection = async (req, res) => {
  try {
    const { sectionId, subId } = req.params;
    const { name, status } = req.body;

    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const subsection = section.subsections.id(subId);

    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    // RULE: cannot activate subsection if section inactive
    if (status === "Active" && section.status === "Inactive") {
      return res.status(400).json({
        success: false,
        message: "Activate section first to activate subsection",
      });
    }

    subsection.name = name;
    subsection.status = status;

    await section.save();

    res.status(200).json({
      success: true,
      message: "Subsection updated successfully",
      section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------- DELETE SUBSECTION ------------------------------- */

export const deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subId } = req.params;

    const section = await Section.findById(sectionId);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    section.subsections.pull(subId);

    await section.save();

    res.status(200).json({
      success: true,
      message: "Subsection deleted successfully",
      section,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};