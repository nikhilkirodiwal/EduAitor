import Teacher from "../models/teacher.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";


/* ================= GENERATE TEACHER ID ================= */

const generateTeacherId = async (schoolId) => {
  const count = await Teacher.countDocuments({ schoolId });

  const next = count + 1;

  return `TCH${String(next).padStart(4, "0")}`;
};


/* ================= CREATE TEACHER ================= */

export const createTeacher = async (req,res)=>{

  try{

    const files = req.files || {};

    let photo = {};

    if(files.photo){

      const uploaded = await uploadToCloudinary(
        files.photo[0],
        "teachers"
      );

      photo = {
        url: uploaded.url,
        public_id: uploaded.public_id
      };

    }

    const teacherId = await generateTeacherId();

    const teacher = await Teacher.create({
      ...req.body,
      teacherId,
      photo
    });

    res.status(201).json({
      success:true,
      message:"Teacher created",
      data:teacher
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};


/* ================= GET ALL TEACHERS ================= */

export const getTeachers = async(req,res)=>{

  try{

    const teachers = await Teacher.find().sort({createdAt:-1});

    res.json({
      success:true,
      data:teachers
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};


/* ================= GET SINGLE TEACHER ================= */

export const getTeacher = async(req,res)=>{

  try{

    const teacher = await Teacher.findById(req.params.id);

    if(!teacher){

      return res.status(404).json({
        success:false,
        message:"Teacher not found"
      });

    }

    res.json({
      success:true,
      data:teacher
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};


/* ================= UPDATE TEACHER ================= */

export const updateTeacher = async(req,res)=>{

  try{

    const teacher = await Teacher.findById(req.params.id);

    if(!teacher){

      return res.status(404).json({
        success:false,
        message:"Teacher not found"
      });

    }

    const files = req.files || {};
    let photo = teacher.photo;

    if(files.photo){

      if(photo?.public_id){

        await deleteFromCloudinary(photo.public_id);

      }

      const uploaded = await uploadToCloudinary(
        files.photo[0],
        "teachers"
      );

      photo = {
        url: uploaded.url,
        public_id: uploaded.public_id
      };

    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        photo
      },
      { new:true }
    );

    res.json({
      success:true,
      message:"Teacher updated",
      data:updatedTeacher
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};


/* ================= DELETE TEACHER ================= */

export const deleteTeacher = async(req,res)=>{

  try{

    const teacher = await Teacher.findById(req.params.id);

    if(!teacher){

      return res.status(404).json({
        success:false,
        message:"Teacher not found"
      });

    }

    if(teacher.photo?.public_id){

      await deleteFromCloudinary(teacher.photo.public_id);

    }

    await teacher.deleteOne();

    res.json({
      success:true,
      message:"Teacher deleted"
    });

  }catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};