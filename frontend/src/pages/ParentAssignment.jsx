import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_COLOR = {
  submitted: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

export default function ParentAssignment() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | attempt | report
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (user?.student_id) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // classId must come from the student record
      const studentRes = await axios.get(`${API}/students/${user.student_id}`, {
        withCredentials: true,
      });
      const classId =
        studentRes.data.data?.classId?._id || studentRes.data.data?.classId;

      const res = await axios.get(`${API}/assignment/student/list`, {
        params: { classId },
        withCredentials: true,
      });
      setAssignments(res.data.data || []);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const openAttempt = async (a) => {
    try {
      const res = await axios.get(`${API}/assignment/student/${a._id}`, {
        withCredentials: true,
      });
      setSelected(res.data.data);
      setView("attempt");
    } catch {
      toast.error("Failed to load assignment");
    }
  };

  const openReport = async (a) => {
    try {
      const res = await axios.get(`${API}/assignment/student/${a._id}/report`, {
        withCredentials: true,
      });
      setReport(res.data.data);
      setView("report");
    } catch {
      toast.error("Failed to load report");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading...
      </div>
    );

  if (view === "attempt" && selected)
    return (
      <AttemptView
        assignment={selected}
        onBack={() => {
          setView("list");
          setSelected(null);
        }}
        onSubmitted={() => {
          fetchAssignments();
          setView("list");
          setSelected(null);
        }}
      />
    );

  if (view === "report" && report)
    return (
      <ReportView
        report={report}
        onBack={() => {
          setView("list");
          setReport(null);
        }}
      />
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}{" "}
          available
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-medium">No assignments yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => {
            const submitted = !!a.mySubmission;
            const overdue = !submitted && new Date(a.dueDate) < new Date();
            const tag = submitted
              ? "submitted"
              : overdue
                ? "overdue"
                : "pending";

            return (
              <div
                key={a._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.subjectId?.name}
                      {a.chapterId?.name ? ` · ${a.chapterId.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR[tag]}`}
                  >
                    {tag}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>🏆 {a.totalMarks} marks</span>
                  <span>❓ {a.questions?.length} questions</span>
                  <span>
                    📅 {new Date(a.dueDate).toLocaleDateString("en-IN")}
                  </span>
                </div>

                {submitted ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-green-700 font-medium">
                        Score: {a.mySubmission.totalMarksAwarded}/
                        {a.mySubmission.totalMarks}
                      </span>
                      <span className="text-sm font-bold text-green-700">
                        {a.mySubmission.percentage}%
                      </span>
                    </div>
                    <button
                      onClick={() => openReport(a)}
                      className="w-full py-2 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition"
                    >
                      View Report
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openAttempt(a)}
                    disabled={overdue}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition
                      ${
                        overdue
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                  >
                    {overdue ? "Overdue" : "Start Assignment"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── ATTEMPT VIEW ─── */
function AttemptView({ assignment, onBack, onSubmitted }) {
  const [answers, setAnswers] = useState(
    assignment.questions.map((_, i) => ({ questionIndex: i })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const setAnswer = (idx, patch) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    );
  };

  const handleSubmit = async () => {
    const unanswered = answers.filter((a, i) =>
      assignment.questions[i].type === "mcq"
        ? a.selectedOptionIndex == null
        : !a.textAnswer?.trim(),
    );
    if (unanswered.length) {
      return toast.warn(`${unanswered.length} question(s) unanswered`);
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/assignment/student/${assignment._id}/submit`,
        {
          answers,
          timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        },
        { withCredentials: true },
      );
      toast.success("Submitted successfully!");
      onSubmitted();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {assignment.title}
          </h1>
          {assignment.description && (
            <p className="text-sm text-gray-500 mt-1">
              {assignment.description}
            </p>
          )}
          <div className="flex gap-4 text-xs text-gray-400 mt-3">
            <span>🏆 {assignment.totalMarks} marks</span>
            <span>❓ {assignment.questions.length} questions</span>
            {assignment.duration && <span>⏱ {assignment.duration} min</span>}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {assignment.questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{q.text}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-medium">
                      {q.type}
                    </span>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {q.marks} mark{q.marks !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {q.type === "mcq" ? (
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition
                        ${
                          answers[idx].selectedOptionIndex === oi
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        className="accent-indigo-600"
                        checked={answers[idx].selectedOptionIndex === oi}
                        onChange={() =>
                          setAnswer(idx, { selectedOptionIndex: oi })
                        }
                      />
                      <span className="text-sm text-gray-700">{opt.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full ml-10 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  style={{ width: "calc(100% - 2.5rem)" }}
                  rows={q.type === "long" ? 5 : 2}
                  placeholder={`Write your ${q.type === "long" ? "detailed " : ""}answer here...`}
                  value={answers[idx].textAnswer || ""}
                  onChange={(e) =>
                    setAnswer(idx, { textAnswer: e.target.value })
                  }
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </button>
      </div>
    </div>
  );
}

/* ─── REPORT VIEW ─── */
function ReportView({ report, onBack }) {
  const a = report;
  const pct = a.percentage || 0;
  const grade =
    pct >= 90
      ? "A+"
      : pct >= 80
        ? "A"
        : pct >= 70
          ? "B"
          : pct >= 60
            ? "C"
            : pct >= 40
              ? "D"
              : "F";
  const gradeColor =
    pct >= 70
      ? "text-green-600"
      : pct >= 40
        ? "text-amber-600"
        : "text-red-500";

  const mcqAnswers = a.answers.filter((ans) => ans.questionType === "mcq");
  const mcqCorrect = mcqAnswers.filter((ans) => ans.isCorrect).length;
  const subjAnswers = a.answers.filter((ans) => ans.questionType !== "mcq");

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
        >
          ← Back to assignments
        </button>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 text-center">
          <p className="text-sm text-gray-400 mb-2">Your score</p>
          <div className={`text-6xl font-bold mb-1 ${gradeColor}`}>{grade}</div>
          <div className="text-2xl font-semibold text-gray-800">
            {a.totalMarksAwarded} / {a.totalMarks} marks
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {pct}% · Attempt {a.attemptNumber}
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              {
                label: "MCQ Correct",
                value: `${mcqCorrect}/${mcqAnswers.length}`,
              },
              { label: "Subjective", value: subjAnswers.length },
              {
                label: "Time Taken",
                value: a.timeTakenSeconds
                  ? `${Math.round(a.timeTakenSeconds / 60)} min`
                  : "—",
              },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl py-3">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Question breakdown */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 text-base">
            Question Breakdown
          </h2>
          {a.answers.map((ans, idx) => {
            const isMCQ = ans.questionType === "mcq";
            const correct = ans.isCorrect;
            const pending = !isMCQ;

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${
                  pending
                    ? "border-gray-100"
                    : correct
                      ? "border-green-100"
                      : "border-red-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5
                      ${pending ? "bg-gray-100 text-gray-500" : correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {ans.questionText}
                    </p>

                    {isMCQ ? (
                      <div className="space-y-1.5">
                        {ans.options?.map((opt, oi) => {
                          const isSelected = oi === ans.selectedOptionIndex;
                          const isCorrectOpt = opt.isCorrect;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                                ${
                                  isCorrectOpt
                                    ? "bg-green-50 text-green-800 font-medium"
                                    : isSelected && !isCorrectOpt
                                      ? "bg-red-50 text-red-700"
                                      : "bg-gray-50 text-gray-500"
                                }`}
                            >
                              <span className="text-base">
                                {isCorrectOpt ? "✓" : isSelected ? "✗" : "○"}
                              </span>
                              {opt.text}
                              {isSelected && !isCorrectOpt && (
                                <span className="ml-auto text-xs text-red-500">
                                  Your answer
                                </span>
                              )}
                              {isCorrectOpt && (
                                <span className="ml-auto text-xs text-green-600">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
                        {ans.textAnswer || (
                          <span className="text-gray-300">No answer</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {isMCQ ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                        >
                          {correct ? `+${ans.marksAwarded}` : "0"} /{" "}
                          {ans.maxMarks} marks
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Pending teacher review · {ans.maxMarks} marks
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
