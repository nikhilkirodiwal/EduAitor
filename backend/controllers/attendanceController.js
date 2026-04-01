import mongoose from 'mongoose';
import Attendance from "../models/attendance.js";
import Student from '../models/student.js';
import Class from '../models/class.js';
import Section from '../models/section.js';
import Subject from '../models/subject.js';
import Teacher from '../models/teacher.js';



export const getMetaData = async (req, res) => {
  try {
    const teacherId = req.user.teacher_id;

    // Fetch teacher and populate assigned classes AND the sections within those classes
    const teacher = await Teacher.findById(teacherId)
      .populate({
        path: 'assignedClasses',
        select: 'name details',
        populate: {
          path: 'details.sectionId',
          model: 'Section',
          select: 'name' // Assuming your Section model has a 'name' field (e.g., "A", "B")
        }
      })
      .populate('subjects');

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.status(200).json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


export const getStudentsByClassAndSection = async (req,res)=>{
let {classId,sectionId} =req.query;
console.log("Received classId:", classId, "sectionId:", sectionId);
try{
    if(!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sectionId)){
        return res.status(400).json({ success: false, message: "Invalid classId or sectionId" });
    }
    const students  = await Student.find({classId,sectionId})
    res.status(200).json({ success: true, students });
}
catch(error){
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
}

}
