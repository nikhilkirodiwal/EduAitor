import Exam from "../models/exam.js";
import subject from "../models/subject.js";


// Create Exam
export const createExam = async (req, res) => {
  try {
    const { 
      schoolId, 
      className, 
      examDate, 
      startTime, 
      endTime 
    } = req.body;

    const dateObj = new Date(examDate);
    
    // 1. Sunday Validation
    if (dateObj.getDay() === 0) {
      return res.status(400).json({ message: "Exams cannot be scheduled on Sundays!" });
    }

    // 2. Conflict Validation (SaaS Level)
    // Check if an exam already exists for this CLASS on this DATE that OVERLAPS the time
    const overlappingExam = await Exam.findOne({
      schoolId,
      className,
      examDate: new Date(examDate),
      $or: [
        {
          // New exam starts during an existing exam
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          // New exam ends during an existing exam
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          // New exam completely wraps around an existing exam
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ]
    });

    if (overlappingExam) {
      return res.status(409).json({ 
        message: `Time Conflict! ${overlappingExam.subject} is already scheduled from ${overlappingExam.startTime} to ${overlappingExam.endTime}.` 
      });
    }

    // 3. Prepare Day Name
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[dateObj.getDay()];

    // 4. Create Exam
    const newExam = new Exam({
      ...req.body,
      dayOfWeek
    });

    await newExam.save();
    
    // Return populated data so the frontend can show the Class Name immediately
    const populatedExam = await Exam.findById(newExam._id).populate("className", "name");
    
    res.status(201).json(populatedExam);
  } catch (err) {
    console.error("Create Exam Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

// Get Exams (Filtered by School and optionally Class)
export const getExams = async (req, res) => {
  const { schoolId, classId } = req.query;
  let query = { schoolId };
  if (classId) query.className = classId;

  try {
    const exams = await Exam.find(query).populate('className');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// update exams -
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      schoolId, 
      className, 
      examDate, 
      startTime, 
      endTime 
    } = req.body;

    const dateObj = new Date(examDate);

    // 1. Sunday Validation
    if (dateObj.getDay() === 0) {
      return res.status(400).json({ message: "Exams cannot be updated to a Sunday!" });
    }

    // 2. Conflict Validation (SaaS Level)
    // We check for overlaps but EXCLUDE the current exam ID ($ne: id)
    const overlappingExam = await Exam.findOne({
      _id: { $ne: id }, // Very important: Don't conflict with yourself
      schoolId,
      className,
      examDate: new Date(examDate),
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ]
    });

    if (overlappingExam) {
      return res.status(409).json({ 
        message: `Conflict! ${overlappingExam.subject} is already scheduled for this time.` 
      });
    }

    // 3. Prepare Day Name
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[dateObj.getDay()];

    // 4. Find and Update
    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { ...req.body, dayOfWeek },
      { new: true, runValidators: true }
    ).populate("className", "name");

    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json(updatedExam);
  } catch (err) {
    console.error("Update Exam Error:", err);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

// delete exams -
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query;
    
  const deletedExam = await Exam.findOneAndDelete({ _id: id, schoolId });

    if (!deletedExam) {
      return res.status(404).json({ message: "Exam already deleted or not found" });
    }

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
};

//  subjects 
export const getSubjects = async (req,res)=>{
  try {
    const { ids, schoolId } = req.query;

    // 1. Validation: If no IDs are sent, return empty array immediately
    if (!ids) {
      return res.status(200).json({ subjects: [] });
    }

    // 2. Normalize: Ensure 'ids' is an array (Express sometimes parses single items as strings)
    const idArray = Array.isArray(ids) ? ids : [ids];

    // 3. Query: Find Active subjects belonging to the specific school
    const subjects = await Subject.find({
      _id: { $in: idArray },
      schoolId: schoolId,
      status: "Active" // Only show active subjects for exams
    })
    .select("name _id") // Keep the payload small for mobile performance
    .sort({ name: 1 }); // Alphabetical order looks better in dropdowns

    res.status(200).json({ subjects });
  } catch (error) {
    console.error("Backend Subject Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch subject details" });
  }

}

// Delete and Edit would follow standard findByIdAndDelete / findByIdAndUpdate