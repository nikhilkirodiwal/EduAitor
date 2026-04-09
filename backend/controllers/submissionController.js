import AssignmentSubmission from "../models/assignmentSubmission.js";
import Assignment from "../models/assignment.js";

/* ── GET ASSIGNMENTS FOR STUDENT ── */
export const getStudentAssignments = async (req, res) => {
  try {
    const { student_id, school_id } = req.user;
    const { classId } = req.query;

    if (!classId) {
      return res
        .status(400)
        .json({ success: false, message: "classId is required" });
    }

    const assignments = await Assignment.find({
      classId,
      schoolId: school_id,
      isPublished: true,
    })
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .populate("topicId", "name")
      .sort({ dueDate: 1 });

    // Attach submission status for this student
    const ids = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: ids },
      studentId: student_id,
    });

    const subMap = {};
    submissions.forEach((s) => {
      subMap[s.assignmentId.toString()] = s;
    });

    const data = assignments.map((a) => ({
      ...a.toObject(),
      mySubmission: subMap[a._id.toString()] || null,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET SINGLE ASSIGNMENT (no answers revealed) ── */
export const getAssignmentForStudent = async (req, res) => {
  try {
    const { school_id } = req.user;

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      schoolId: school_id,
      isPublished: true,
    })
      .populate("subjectId", "name")
      .populate("chapterId", "name")
      .populate("topicId", "name");

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    // Strip correct answers from MCQ before sending
    const safe = assignment.toObject();
    safe.questions = safe.questions.map((q) => ({
      ...q,
      options: q.options?.map((o) => ({ text: o.text, _id: o._id })),
    }));

    res.json({ success: true, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── SUBMIT ASSIGNMENT ── */
export const submitAssignment = async (req, res) => {
  try {
    const { student_id, school_id } = req.user;
    const { answers, timeTakenSeconds } = req.body;

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      schoolId: school_id,
      isPublished: true,
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    // Check attempt limit
    const existingCount = await AssignmentSubmission.countDocuments({
      assignmentId: assignment._id,
      studentId: student_id,
    });

    if (existingCount >= assignment.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Max attempts (${assignment.maxAttempts}) reached`,
      });
    }

    // Auto-grade MCQ, build answer records
    let totalMarksAwarded = 0;
    const gradedAnswers = answers.map((ans) => {
      const question = assignment.questions[ans.questionIndex];
      if (!question) return ans;

      const maxMarks = question.marks || 1;
      let isCorrect = null;
      let marksAwarded = 0;

      if (question.type === "mcq") {
        const correctIdx = question.options.findIndex((o) => o.isCorrect);
        isCorrect = ans.selectedOptionIndex === correctIdx;
        marksAwarded = isCorrect ? maxMarks : 0;
      }
      // short/long: marksAwarded stays 0 until teacher grades (future)

      totalMarksAwarded += marksAwarded;

      return {
        questionIndex: ans.questionIndex,
        questionText: question.text,
        questionType: question.type,
        selectedOptionIndex: ans.selectedOptionIndex ?? null,
        textAnswer: ans.textAnswer ?? null,
        isCorrect,
        marksAwarded,
        maxMarks,
      };
    });

    const percentage = assignment.totalMarks
      ? Math.round((totalMarksAwarded / assignment.totalMarks) * 100)
      : 0;

    const submission = await AssignmentSubmission.create({
      assignmentId: assignment._id,
      studentId: student_id,
      schoolId: school_id,
      answers: gradedAnswers,
      totalMarksAwarded,
      totalMarks: assignment.totalMarks,
      percentage,
      attemptNumber: existingCount + 1,
      timeTakenSeconds: timeTakenSeconds || null,
      status: "submitted",
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET MY SUBMISSION REPORT ── */
export const getMySubmission = async (req, res) => {
  try {
    const { student_id } = req.user;

    const submission = await AssignmentSubmission.findOne({
      assignmentId: req.params.id,
      studentId: student_id,
    }).populate("assignmentId");

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "No submission found" });
    }

    // Re-attach correct answers for report
    const assignment = submission.assignmentId;
    const report = submission.toObject();
    report.answers = report.answers.map((ans) => {
      const q = assignment.questions[ans.questionIndex];
      return {
        ...ans,
        options: q?.options || [], // full options with isCorrect for report
      };
    });

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
