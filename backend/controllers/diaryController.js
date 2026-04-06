import Diary from "../models/diary.js";

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
    const data = await Diary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

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