
import Notification from "../models/notification.js";
import Student from "../models/student.js"; // adjust import paths to your project

// ─── HELPER: reusable function to create a notification programmatically ───────
// Call this from exam/result controllers to auto-create notifications
export const createNotificationHelper = async ({
  title, message, notificationType = 'general',
  targetType = 'all', roles = [], classId = null, schoolId = null, createdBy = null,
  studentId = null,
}) => {
  const notification = new Notification({
    title, message, notificationType,
    createdBy,
    target: { type: targetType, roles, classId, schoolId ,studentId},
  });
  await notification.save();
  return notification;
};

// ─── CREATE: Admin manually sends a notification ───────────────────────────────
export const createNotification = async (req, res) => {
  try {
    const { title, message, notificationType, target } = req.body;
    // target looks like: { type: 'class', classId: '...', schoolId: '...' }
    // or:                { type: 'role', roles: ['teacher_admin'] }
    // or:                { type: 'all' }
    console.log("Creating notification with target:", target , notificationType);

    const notification = new Notification({
      title,
      message,
      notificationType: notificationType || 'general',
      createdBy: req.user._id,
      target: target || { type: 'all' },
    });

    await notification.save();
    res.status(201).json({ message: "Notification sent!", notification });
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// ─── GET: Fetch notifications visible to the logged-in user ───────────────────
export const getAllNotifications = async (req, res) => {
  try {
    const user = req.user;
    let targetQuery = {};

    // ── SUPER ADMIN: sees everything ───────────────────────────────────────────
    if (user.role === 'super_admin') {
      targetQuery = {}; // no filter, all notifications
    }

    // ── SCHOOL ADMIN: sees all notifications belonging to their school ─────────
    else if (user.role === 'school_admin') {
      targetQuery = {
        $or: [
          { 'target.type': 'all' },
          { 'target.roles': 'school_admin' },
          { 'target.schoolId': user.school_id }, // everything scoped to this school
        ]
      };
    }

    // ── TEACHER ADMIN: only 'all' + teacher-role notifications ────────────────
    else if (user.role === 'teacher_admin') {
      targetQuery = {
        $and: [
          {
            $or: [
              { 'target.type': 'all' },
              { 'target.roles': 'teacher_admin' },
            ]
          },
          {
            $or: [
              { 'target.schoolId': user.school_id },
              { 'target.type': 'all' },
            ]
          }
        ]
      };
    }

    // ── STUDENT / PARENT: only their own + class + 'all' ─────────────────────
    else if (user.role === 'student_admin') {
      const orConditions = [
        { 'target.type': 'all' },
        { 'target.roles': 'student_admin' },
        { 'target.studentId': user.student_id }, // personal (book issue, fee, etc.)
      ];

      if (user.student_id) {
        const student = await Student.findById(user.student_id).select('class_id');
        if (student?.class_id) {
          orConditions.push({ 'target.classId': student.class_id }); // class exam etc.
        }
      }

      targetQuery = {
        $and: [
          { $or: orConditions },
          {
            $or: [
              { 'target.schoolId': user.school_id },
              { 'target.type': 'all' },
              { 'target.studentId': user.student_id }, // personal always passes scope check
            ]
          }
        ]
      };
    }

    const notifications = await Notification.find({
      ...targetQuery,
      clearedBy: { $ne: user._id },
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.status(200).json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { clearedBy: { $ne: userId } },          // only ones not already cleared
      { $addToSet: { clearedBy: userId } }      // add user to clearedBy
    );

    res.status(200).json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};