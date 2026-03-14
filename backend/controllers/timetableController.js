import Timetable from "../models/timetable.js";

export const saveTimetable = async (req, res) => {
  try {
    const { classId, periodConfigs, assignments } = req.body;

    if (!classId)
      return res
        .status(400)
        .json({ success: false, message: "Class required" });

    // Convert assignments -> schedule
    const schedule = Object.keys(assignments).map((day) => ({
      day,
      periods: Object.keys(assignments[day]).map((periodId) => {
        const p = assignments[day][periodId];

        return {
          periodId,
          subjectId: p?.subjectId || null,
          teacherId: p?.teacherId || null,
          substituteTeacherId: p?.substituteTeacherId || null,
          customName: p?.customName || "",
          type: p?.type || "lecture",

          status: !p?.teacherId ? "no-teacher" : "normal",
        };
      }),
    }));

    let timetable = await Timetable.findOne({ classId });

    if (timetable) {
      timetable.periodConfigs = periodConfigs;
      timetable.schedule = schedule;
      await timetable.save();

      return res.json({
        success: true,
        message: "Timetable updated",
        data: timetable,
      });
    }

    timetable = await Timetable.create({
      classId,
      periodConfigs,
      schedule,
    });

    res.json({
      success: true,
      message: "Timetable created",
      data: timetable,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const timetable = await Timetable.findOne({ classId })
      .populate("schedule.periods.subjectId")
      .populate("schedule.periods.teacherId");

    if (!timetable) return res.json({ success: true, data: null });

    const assignments = {};

    timetable.schedule.forEach((dayData) => {
      assignments[dayData.day] = {};

      dayData.periods.forEach((p) => {
        assignments[dayData.day][p.periodId] = {
          subjectId: p.subjectId?._id || "",
          teacherId: p.teacherId?._id || "",
          type: p.type,
          customName: p.customName || "",
        };
      });
    });

    res.json({
      success: true,
      data: {
        classId: timetable.classId,
        periodConfigs: timetable.periodConfigs,
        assignments,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const markTeacherAbsent = async (req, res) => {
  try {
    const { classId, day, periodId } = req.body;

    const timetable = await Timetable.findOne({ classId });

    const dayData = timetable.schedule.find((d) => d.day === day);

    const period = dayData.periods.find((p) => p.periodId === periodId);

    period.status = "teacher-absent";

    await timetable.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
