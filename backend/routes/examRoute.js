import express from "express";
import {createExam,getExams,getSubjects,updateExam,deleteExam} from "../controllers/examController.js"

const router = express.Router();

router.post('/create', createExam);
router.get('/list', getExams);
router.get('/subjects/get-multiple',getSubjects)

router.put('/edit/:id', updateExam);
router.delete('/delete/:id', deleteExam);

export default router;