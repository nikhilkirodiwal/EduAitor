import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const STEPS = ["Class", "Subject", "Chapter", "Topic", "Details", "Questions"];

const STEP_CLASS = 0;
const STEP_SUBJECT = 1;
const STEP_CHAPTER = 2;
const STEP_TOPIC = 3;
const STEP_DETAILS = 4;
const STEP_QUESTIONS = 5;

const emptyQuestion = { text: "", type: "short", options: [], marks: 1 };

export default function Assignment() {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const teacherId = user?._id;
  const schoolId = user?.schoolId || user?.school_id;

  const [step, setStep] = useState(STEP_CLASS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [details, setDetails] = useState({
    title: "",
    description: "",
    type: "homework",
    dueDate: "",
    duration: "",
    maxAttempts: 1,
  });

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(emptyQuestion);
  const [editingQIndex, setEditingQIndex] = useState(null);

  /* ——— LOAD ——— */
  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/classes`, {
        params: { teacherId },
      });
      setClasses(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API}/assignment/teacher`, {
        params: { teacherId },
      });
      setAssignments(res.data.data || []);
    } catch {
      /* silent */
    }
  };

  /* ——— STEP HANDLERS ——— */
  const pickClass = async (cls) => {
    setSelectedClass(cls);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/subjects`, {
        params: { classId: cls._id },
      });
      setSubjects(res.data.data || []);
    } finally {
      setLoading(false);
    }
    setStep(STEP_SUBJECT);
  };

  const pickSubject = async (sub) => {
    setSelectedSubject(sub);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setChapters([]);
    setTopics([]);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/chapters`, {
        params: { classId: selectedClass._id, subjectId: sub._id, schoolId },
      });
      setChapters(res.data.data || []);
    } finally {
      setLoading(false);
    }
    setStep(STEP_CHAPTER);
  };

  const pickChapter = async (ch) => {
    setSelectedChapter(ch);
    setSelectedTopic(null);
    setTopics([]);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/topics`, {
        params: { chapterId: ch._id, schoolId },
      });
      setTopics(res.data.data || []);
    } finally {
      setLoading(false);
    }
    setStep(STEP_TOPIC);
  };

  const pickTopic = (topic) => {
    setSelectedTopic(topic);
    setStep(STEP_DETAILS);
  };

  const skipTopic = () => {
    setSelectedTopic(null);
    setStep(STEP_DETAILS);
  };

  /* ——— QUESTION BUILDER ——— */
  const addOption = () => {
    setCurrentQ({
      ...currentQ,
      options: [...currentQ.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (i) => {
    setCurrentQ({
      ...currentQ,
      options: currentQ.options.filter((_, idx) => idx !== i),
    });
  };

  const updateOption = (i, field, value) => {
    const opts = [...currentQ.options];
    opts[i] = { ...opts[i], [field]: value };
    setCurrentQ({ ...currentQ, options: opts });
  };

  const saveQuestion = () => {
    if (!currentQ.text.trim()) return alert("Question text is required");
    if (currentQ.type === "mcq") {
      if (currentQ.options.length < 2)
        return alert("MCQ needs at least 2 options");
      if (!currentQ.options.some((o) => o.isCorrect))
        return alert("Mark at least 1 correct option");
    }
    if (editingQIndex !== null) {
      const updated = [...questions];
      updated[editingQIndex] = currentQ;
      setQuestions(updated);
      setEditingQIndex(null);
    } else {
      setQuestions([...questions, currentQ]);
    }
    setCurrentQ(emptyQuestion);
  };

  const editQuestion = (i) => {
    setCurrentQ(questions[i]);
    setEditingQIndex(i);
  };

  const deleteQuestion = (i) => {
    setQuestions(questions.filter((_, idx) => idx !== i));
    if (editingQIndex === i) {
      setCurrentQ(emptyQuestion);
      setEditingQIndex(null);
    }
  };

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  /* ——— SUBMIT ——— */
  const handleSubmit = async () => {
    if (!details.title.trim()) return alert("Title is required");
    if (!details.dueDate) return alert("Due date is required");
    if (questions.length === 0) return alert("Add at least 1 question");

    setSubmitting(true);
    try {
      await axios.post(`${API}/assignment/create`, {
        teacherId,
        schoolId,
        classId: selectedClass._id,
        subjectId: selectedSubject._id,
        chapterId: selectedChapter._id,
        topicId: selectedTopic?._id,
        questions,
        ...details,
      });

      await fetchAssignments();
      resetAll();
      alert("Assignment created successfully!");
    } catch (err) {
      alert(err?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(STEP_CLASS);
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setDetails({
      title: "",
      description: "",
      type: "homework",
      dueDate: "",
      duration: "",
      maxAttempts: 1,
    });
    setQuestions([]);
    setCurrentQ(emptyQuestion);
    setEditingQIndex(null);
  };

  /* ——— ASSIGNMENT ACTIONS ——— */
  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    await axios.delete(`${API}/assignment/${id}`);
    fetchAssignments();
  };

  const togglePublish = async (id) => {
    await axios.patch(`${API}/assignment/publish/${id}`);
    fetchAssignments();
  };

  /* ——— BREADCRUMB ——— */
  const crumbs = [
    selectedClass?.name,
    selectedSubject?.name,
    selectedChapter?.name,
    selectedTopic?.name,
  ].filter(Boolean);

  /* ——— RENDER STEP CONTENT ——— */
  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    /* STEP 0 — CLASS */
    if (step === STEP_CLASS) {
      return (
        <CardGrid
          label="Select a Class"
          items={classes}
          onPick={pickClass}
          icon="🏫"
          emptyText="No classes assigned to you yet."
        />
      );
    }

    /* STEP 1 — SUBJECT */
    if (step === STEP_SUBJECT) {
      return (
        <CardGrid
          label="Select a Subject"
          items={subjects}
          onPick={pickSubject}
          icon="📚"
          emptyText="No subjects found for this class."
          onBack={() => setStep(STEP_CLASS)}
        />
      );
    }

    /* STEP 2 — CHAPTER */
    if (step === STEP_CHAPTER) {
      return (
        <CardGrid
          label="Select a Chapter"
          items={chapters}
          onPick={pickChapter}
          icon="📖"
          emptyText="No chapters found."
          onBack={() => setStep(STEP_SUBJECT)}
        />
      );
    }

    /* STEP 3 — TOPIC */
    if (step === STEP_TOPIC) {
      return (
        <div>
          <CardGrid
            label="Select a Topic (optional)"
            items={topics}
            onPick={pickTopic}
            icon="📌"
            emptyText="No topics found."
            onBack={() => setStep(STEP_CHAPTER)}
          />
          <button
            onClick={skipTopic}
            className="mt-3 text-sm text-indigo-500 hover:underline"
          >
            Skip — no specific topic →
          </button>
        </div>
      );
    }

    /* STEP 4 — DETAILS */
    if (step === STEP_DETAILS) {
      return (
        <div className="space-y-4">
          <StepHeader
            label="Assignment Details"
            onBack={() => setStep(STEP_TOPIC)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="field-label">Title *</label>
              <input
                className="field-input"
                placeholder="e.g. Chapter 3 Homework"
                value={details.title}
                onChange={(e) =>
                  setDetails({ ...details, title: e.target.value })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Description</label>
              <textarea
                className="field-input resize-none"
                rows={3}
                placeholder="Optional instructions for students..."
                value={details.description}
                onChange={(e) =>
                  setDetails({ ...details, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="field-label">Type</label>
              <select
                className="field-input"
                value={details.type}
                onChange={(e) =>
                  setDetails({ ...details, type: e.target.value })
                }
              >
                <option value="homework">Homework</option>
                <option value="quiz">Quiz</option>
                <option value="exam">Exam</option>
              </select>
            </div>

            <div>
              <label className="field-label">Due Date *</label>
              <input
                type="date"
                className="field-input"
                value={details.dueDate}
                onChange={(e) =>
                  setDetails({ ...details, dueDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="field-label">Duration (minutes)</label>
              <input
                type="number"
                className="field-input"
                placeholder="e.g. 60"
                value={details.duration}
                min={1}
                onChange={(e) =>
                  setDetails({ ...details, duration: e.target.value })
                }
              />
            </div>

            <div>
              <label className="field-label">Max Attempts</label>
              <input
                type="number"
                className="field-input"
                min={1}
                value={details.maxAttempts}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    maxAttempts: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (!details.title.trim()) return alert("Title is required");
              if (!details.dueDate) return alert("Due date is required");
              setStep(STEP_QUESTIONS);
            }}
            className="btn-primary w-full mt-2"
          >
            Continue to Questions →
          </button>
        </div>
      );
    }

    /* STEP 5 — QUESTIONS */
    if (step === STEP_QUESTIONS) {
      return (
        <div className="space-y-5">
          <StepHeader
            label={`Questions  •  Total: ${totalMarks} marks`}
            onBack={() => setStep(STEP_DETAILS)}
          />

          {/* Question builder */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-700">
              {editingQIndex !== null
                ? `Editing Q${editingQIndex + 1}`
                : "New Question"}
            </h4>

            <textarea
              className="field-input resize-none"
              rows={2}
              placeholder="Question text..."
              value={currentQ.text}
              onChange={(e) =>
                setCurrentQ({ ...currentQ, text: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Type</label>
                <select
                  className="field-input"
                  value={currentQ.type}
                  onChange={(e) =>
                    setCurrentQ({
                      ...currentQ,
                      type: e.target.value,
                      options: [],
                    })
                  }
                >
                  <option value="short">Short Answer</option>
                  <option value="long">Long Answer</option>
                  <option value="mcq">MCQ</option>
                </select>
              </div>

              <div>
                <label className="field-label">Marks</label>
                <input
                  type="number"
                  className="field-input"
                  min={0}
                  value={currentQ.marks}
                  onChange={(e) =>
                    setCurrentQ({ ...currentQ, marks: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {currentQ.type === "mcq" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="field-label mb-0">Options</span>
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    + Add option
                  </button>
                </div>

                {currentQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={(e) =>
                        updateOption(i, "isCorrect", e.target.checked)
                      }
                      title="Mark as correct"
                      className="w-4 h-4 accent-green-500 cursor-pointer"
                    />
                    <input
                      className="field-input flex-1"
                      placeholder={`Option ${i + 1}`}
                      value={opt.text}
                      onChange={(e) => updateOption(i, "text", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {currentQ.options.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No options yet. Add at least 2.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={saveQuestion}
                className="btn-primary flex-1"
              >
                {editingQIndex !== null ? "Update Question" : "Add Question"}
              </button>
              {editingQIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQ(emptyQuestion);
                    setEditingQIndex(null);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Question list */}
          {questions.length > 0 && (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border rounded-lg px-4 py-3 bg-white"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {q.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {q.type.toUpperCase()} • {q.marks} mark
                      {q.marks !== 1 ? "s" : ""}
                      {q.type === "mcq" && ` • ${q.options.length} options`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => editQuestion(i)}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestion(i)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {questions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No questions yet. Add at least one above.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || questions.length === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Creating..."
              : `Create Assignment (${questions.length} Q • ${totalMarks} marks)`}
          </button>
        </div>
      );
    }
  };

  /* ——— MAIN RENDER ——— */
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <style>{styles}</style>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Wizard */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-3">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                      i < step
                        ? "bg-indigo-600 text-white"
                        : i === step
                          ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded transition-colors ${
                        i < step ? "bg-indigo-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              STEP {step + 1} OF {STEPS.length} — {STEPS[step].toUpperCase()}
            </p>
          </div>

          {/* Breadcrumb trail */}
          {crumbs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mb-4 text-xs text-gray-500">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300">›</span>}
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                    {c}
                  </span>
                </span>
              ))}
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* RIGHT: Assignment list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">My Assignments</h2>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              {assignments.length}
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {assignments.map((a) => (
                <div
                  key={a._id}
                  className="border rounded-xl p-3 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-800 leading-snug">
                      {a.title}
                    </h3>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {a.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-1">
                    {a.classId?.name} • {a.subjectId?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.totalMarks} marks • {a.questions?.length || 0} questions
                  </p>
                  {a.dueDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Due: {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => togglePublish(a._id)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      {a.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => deleteAssignment(a._id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— SUB-COMPONENTS ——— */

function CardGrid({ label, items, onPick, icon, emptyText, onBack }) {
  return (
    <div>
      <StepHeader label={label} onBack={onBack} />
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onPick(item)}
              className="text-left border rounded-xl p-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
            >
              <span className="block text-xl mb-1">{icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 leading-snug">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepHeader({ label, onBack }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {onBack && (
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none"
          title="Back"
        >
          ←
        </button>
      )}
      <h3 className="font-semibold text-gray-800">{label}</h3>
    </div>
  );
}

/* ——— STYLES ——— */
const styles = `
  .field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 4px;
  }
  .field-input {
    display: block;
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.875rem;
    color: #1f2937;
    background: white;
    outline: none;
    transition: border-color 0.15s;
  }
  .field-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .btn-primary {
    background: #4f46e5;
    color: white;
    border-radius: 10px;
    padding: 9px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background 0.15s, transform 0.1s;
  }
  .btn-primary:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }
  .btn-outline {
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 10px;
    padding: 9px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: border-color 0.15s;
  }
  .btn-outline:hover {
    border-color: #6366f1;
    color: #4f46e5;
  }
`;
