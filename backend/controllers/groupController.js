import Group from "../models/group.js";
import Post from "../models/post.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isMember = (group, userId) =>
  group.members.some((m) => m.userId.toString() === userId.toString());

const canPost = (group, userType) =>
  group.permissions.canPost.includes(userType);

// ─── Group CRUD ───────────────────────────────────────────────────────────────

/**
 * POST /groups/create
 * Body: { name, type, description?, classId?, sectionId?, subjectId?, permissions? }
 * Auth: admin or teacher
 */
export const createGroup = async (req, res) => {
  try {
    const { school_id, teacher_id, role } = req.user;

    const userId = teacher_id || school_id;
    const userType =
      role === "teacher_admin"
        ? "teacher"
        : role === "school_admin"
          ? "admin"
          : role;

    if (!["admin", "teacher"].includes(userType)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const { name, type, description, classId, sectionId, subjectId } =
      req.body;

    const group = await Group.create({
      name,
      type,
      description,
      schoolId: school_id,
      classId: classId || null,
      sectionId: sectionId || null,
      subjectId: subjectId || null,
      createdBy: { userId, userType },
      members: [{ userId, userType, role: "admin" }],
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /groups/my-groups
 * Returns all groups the current user is a member of (scoped to school)
 */
export const getMyGroups = async (req, res) => {
  try {
    const { schoolId, userId } = req.user;
    const { type, status = "Active" } = req.query;

    const filter = {
      schoolId,
      "members.userId": userId,
      status,
    };
    if (type) filter.type = type;

    const groups = await Group.find(filter)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /groups/school-groups  (admin)
 * All groups for the school
 */
export const getAllSchoolGroups = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { type, classId, status = "Active", page = 1, limit = 20 } = req.query;

    const filter = { schoolId, status };
    if (type) filter.type = type;
    if (classId) filter.classId = classId;

    const skip = (page - 1) * limit;
    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate("classId", "name")
        .populate("sectionId", "name")
        .populate("subjectId", "name")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Group.countDocuments(filter),
    ]);

    res.json({ success: true, data: groups, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /groups/:id
 */
export const getGroupById = async (req, res) => {
  try {
    const { schoolId, userId } = req.user;
    const group = await Group.findOne({ _id: req.params.id, schoolId })
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name");

    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Only members (or admins) can view
    if (!isMember(group, userId) && req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Not a member of this group" });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /groups/:id
 * Body: { name?, description?, permissions?, status? }
 * Auth: group admin or school admin
 */
export const updateGroup = async (req, res) => {
  try {
    const { schoolId, userId, userType } = req.user;
    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Permission: school admin or group admin member
    const memberRecord = group.members.find((m) => m.userId.toString() === userId.toString());
    if (userType !== "admin" && memberRecord?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    const allowedFields = ["name", "description", "permissions", "status"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) group[field] = req.body[field];
    });

    await group.save();
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /groups/:id  — actually archives the group
 * Auth: school admin only
 */
export const deleteGroup = async (req, res) => {
  try {
    const { schoolId, userType } = req.user;
    if (userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: "Archived" },
      { new: true }
    );
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    res.json({ success: true, message: "Group archived", data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Member Management ────────────────────────────────────────────────────────

/**
 * POST /groups/:id/add-members
 * Body: { members: [{ userId, userType }] }
 */
export const addMembers = async (req, res) => {
  try {
    const { schoolId, userId, userType } = req.user;
    const { members } = req.body; // [{ userId, userType }]

    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // Only school admin or group admin/moderator can add members
    const memberRecord = group.members.find((m) => m.userId.toString() === userId.toString());
    if (userType !== "admin" && !["admin", "moderator"].includes(memberRecord?.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    // Avoid duplicates
    const existingIds = new Set(group.members.map((m) => m.userId.toString()));
    const newMembers = members.filter((m) => !existingIds.has(m.userId.toString()));

    group.members.push(...newMembers.map((m) => ({ ...m, joinedAt: new Date() })));
    await group.save();

    res.json({ success: true, message: `${newMembers.length} members added`, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /groups/:id/remove-members
 * Body: { memberIds: [userId] }
 */
export const removeMembers = async (req, res) => {
  try {
    const { schoolId, userId, userType } = req.user;
    const { memberIds } = req.body;

    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const memberRecord = group.members.find((m) => m.userId.toString() === userId.toString());
    if (userType !== "admin" && !["admin", "moderator"].includes(memberRecord?.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    group.members = group.members.filter(
      (m) => !memberIds.map(String).includes(m.userId.toString())
    );
    await group.save();

    res.json({ success: true, message: "Members removed", data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Auto-Create Groups ───────────────────────────────────────────────────────
/**
 * Utility: called after a class/section is created to auto-provision groups
 * e.g. from a class creation hook or admin endpoint
 */
export const autoCreateClassGroups = async ({
  schoolId,
  classId,
  className,
  sectionId,
  sectionName,
  subjectIds = [],
  teacherMembers = [],
  studentMembers = [],
  createdBy,
}) => {
  const toCreate = [];

  // Class-wide group
  toCreate.push({
    name: `${className} - Class Group`,
    type: "class",
    schoolId,
    classId,
    createdBy,
    isAutoCreated: true,
    members: [...teacherMembers, ...studentMembers],
  });

  // Section group (if section provided)
  if (sectionId) {
    toCreate.push({
      name: `${className} ${sectionName} - Section`,
      type: "section",
      schoolId,
      classId,
      sectionId,
      createdBy,
      isAutoCreated: true,
      members: [...teacherMembers, ...studentMembers],
    });
  }

  // Subject groups
  for (const subjectId of subjectIds) {
    toCreate.push({
      name: `${className} - Subject Group`,
      type: "subject",
      schoolId,
      classId,
      sectionId: sectionId || null,
      subjectId,
      createdBy,
      isAutoCreated: true,
      members: teacherMembers,
    });
  }

  const groups = await Group.insertMany(toCreate, { ordered: false });
  return groups;
};