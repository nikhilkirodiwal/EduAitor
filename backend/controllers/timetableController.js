import Timetable from "../models/timetable.js";


// CREATE OR UPDATE
export const saveTimetable = async (req, res) => {
  try {

    const { classId, sectionId, schedule } = req.body;

    let timetable = await Timetable.findOne({ classId, sectionId });

    if (timetable) {

      timetable.schedule = schedule;
      await timetable.save();

      return res.json({
        success: true,
        message: "Timetable updated",
        data: timetable
      });

    }

    timetable = await Timetable.create({
      classId,
      sectionId,
      schedule
    });

    res.json({
      success: true,
      message: "Timetable created",
      data: timetable
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};



// GET CLASS TIMETABLE
export const getTimetable = async (req, res) => {

  try {

    const { classId, sectionId } = req.params;

    const timetable = await Timetable.findOne({
      classId,
      sectionId
    })
      .populate("schedule.periods.subjectId")
      .populate("schedule.periods.teacherId");

    res.json({
      success: true,
      data: timetable
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};