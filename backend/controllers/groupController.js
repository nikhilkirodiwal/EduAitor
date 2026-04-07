import Group from "../models/group.js";
import Post from "../models/post.js";

// ─── Auth normalizer ──────────────────────────────────────────────────────────
// JWT payload shape: { role, school_id, teacher_id?, email, name? }
// role values: "super_admin" | "school_admin" | "teacher_admin"

const normalizeUser = (jwtUser) => {
  const userType =
    jwtUser.role === "teacher_admin"
      ? "teacher"
      : jwtUser.role === "school_admin"
        ? "admin"
        : null; // super_admin has no schoolId — block at route level

  const userId = jwtUser.teacher_id || jwtUser.school_id;
  const schoolId = jwtUser.school_id;

  return { userId, userType, schoolId };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isMember = (group, userId) =>
  group.members.some((m) => m.userId.toString() === userId.toString());

// ─── Group CRUD ───────────────────────────────────────────────────────────────

/**
 * POST /groups/create
 * Body: { name, type, description?, classId?, sectionId?, subjectId? }
 * Auth: school_admin or teacher_admin
 */
export const createGroup = async (req, res) => {
  try {
    const { userId, userType, schoolId } = normalizeUser(req.user);

    if (!schoolId || !["admin", "teacher"].includes(userType)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const { name, type, description, classId, sectionId, subjectId } = req.body;

    const group = await Group.create({
      name,
      type,
      description,
      schoolId,
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
 */
export const getMyGroups = async (req, res) => {
  try {
    const { userId, schoolId } = normalizeUser(req.user);
    const { type, status = "Active" } = req.query;

    if (!schoolId) {
      return res
        .status(403)
        .json({ success: false, message: "School context required" });
    }

    const filter = { schoolId, "members.userId": userId, status };
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
 * GET /groups/school-groups  (admin only)
 */
export const getAllSchoolGroups = async (req, res) => {
  try {
    const { userType, schoolId } = normalizeUser(req.user);

    if (userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const {
      type,
      classId,
      status = "Active",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { schoolId, status };
    if (type) filter.type = type;
    if (classId) filter.classId = classId;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const skip = (pageNum - 1) * limitNum;
    
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
    const { userId, userType, schoolId } = normalizeUser(req.user);

    const group = await Group.findOne({ _id: req.params.id, schoolId })
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    if (!isMember(group, userId) && userType !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this group" });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /groups/:id
 * Body: { name?, description?, permissions?, status? }
 */
export const updateGroup = async (req, res) => {
  try {
    const { userId, userType, schoolId } = normalizeUser(req.user);

    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const memberRecord = group.members.find(
      (m) => m.userId.toString() === userId.toString(),
    );

    if (userType !== "admin" && memberRecord?.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
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
 * DELETE /groups/:id  — archives the group
 * Auth: school_admin only
 */
export const deleteGroup = async (req, res) => {
  try {
    const { userType, schoolId } = normalizeUser(req.user);

    if (userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: "Archived" },
      { new: true },
    );

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

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
    const { userId, userType, schoolId } = normalizeUser(req.user);
    const { members } = req.body;

    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const memberRecord = group.members.find(
      (m) => m.userId.toString() === userId.toString(),
    );

    if (
      userType !== "admin" &&
      !["admin", "moderator"].includes(memberRecord?.role)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    const existingIds = new Set(group.members.map((m) => m.userId.toString()));
    const newMembers = members.filter(
      (m) => !existingIds.has(m.userId.toString()),
    );

    group.members.push(
      ...newMembers.map((m) => ({ ...m, joinedAt: new Date() })),
    );
    await group.save();

    res.json({
      success: true,
      message: `${newMembers.length} members added`,
      data: group,
    });
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
    const { userId, userType, schoolId } = normalizeUser(req.user);
    const { memberIds } = req.body;

    const group = await Group.findOne({ _id: req.params.id, schoolId });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const memberRecord = group.members.find(
      (m) => m.userId.toString() === userId.toString(),
    );

    if (
      userType !== "admin" &&
      !["admin", "moderator"].includes(memberRecord?.role)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }

    group.members = group.members.filter(
      (m) => !memberIds.map(String).includes(m.userId.toString()),
    );
    await group.save();

    res.json({ success: true, message: "Members removed", data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Auto-Create Groups ───────────────────────────────────────────────────────

// export const autoCreateClassGroups = async ({
//   schoolId,
//   classId,
//   className,
//   sectionId,
//   sectionName,
//   subjectIds = [],
//   teacherMembers = [],
//   studentMembers = [],
//   createdBy,
// }) => {
//   const toCreate = [];

//   toCreate.push({
//     name: `${className} - Class Group`,
//     type: "class",
//     schoolId,
//     classId,
//     createdBy,
//     isAutoCreated: true,
//     members: [...teacherMembers, ...studentMembers],
//   });

//   if (sectionId) {
//     toCreate.push({
//       name: `${className} ${sectionName} - Section`,
//       type: "section",
//       schoolId,
//       classId,
//       sectionId,
//       createdBy,
//       isAutoCreated: true,
//       members: [...teacherMembers, ...studentMembers],
//     });
//   }

//   for (const subjectId of subjectIds) {
//     toCreate.push({
//       name: `${className} - Subject Group`,
//       type: "subject",
//       schoolId,
//       classId,
//       sectionId: sectionId || null,
//       subjectId,
//       createdBy,
//       isAutoCreated: true,
//       members: teacherMembers,
//     });
//   }

//   const groups = await Group.insertMany(toCreate, { ordered: false });
//   return groups;
// };
