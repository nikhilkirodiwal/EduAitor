import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiBookOpen,
  FiClock,
  FiAward,
  FiChevronRight,
  FiArrowLeft,
  FiPlus,
  FiX,
  FiSave,
} from "react-icons/fi";
import { HiOutlineClipboardList } from "react-icons/hi";

const API = import.meta.env.VITE_API_URL;

const STEPS = ["Class", "Subject", "Chapter", "Topic", "Details", "Questions"];
const STEP_CLASS = 0,
  STEP_SUBJECT = 1,
  STEP_CHAPTER = 2;
const STEP_TOPIC = 3,
  STEP_DETAILS = 4,
  STEP_QUESTIONS = 5;
const emptyQuestion = { text: "", type: "short", options: [], marks: 1 };

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Assignment() {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const teacherId =
    user?.teacher_id || user?._id || user?.id || user?.teacherId;
  const schoolId = user?.school_id || user?.schoolId || user?.schoolID;

  // ── wizard / edit mode ──
  const [editingAssignmentId, setEditingAssignmentId] = useState(null); // null = create mode
  const [isEditMode, setIsEditMode] = useState(false);

  const [step, setStep] = useState(STEP_CLASS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  // confirm modals
  const [confirmDelete, setConfirmDelete] = useState(null); // assignment id
  const [confirmSave, setConfirmSave] = useState(false); // create or update
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // view modal
  const [viewingAssignment, setViewingAssignment] = useState(null);

  // dirty tracking for edit mode
  const [isDirty, setIsDirty] = useState(false);

  /* ── LOAD ── */
  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const fetchClasses = async () => {
    if (!teacherId) {
      setError("teacher_id not found in localStorage userData.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/teacher-academic/classes`, {
        params: { teacherId },
      });
      const data = res.data.data || [];
      setClasses(data);
      if (data.length === 0)
        setError(
          "No classes found. Ensure teacher has assignedClasses with status 'Active'.",
        );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load classes");
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

  /* ── LOAD ASSIGNMENT INTO FORM FOR EDITING ── */
  const loadAssignmentForEdit = async (a) => {
    // Subjects for that class
    setLoading(true);
    try {
      const [subRes, chRes, topRes] = await Promise.all([
        axios.get(`${API}/teacher-academic/subjects`, {
          params: { classId: a.classId._id },
        }),
        axios.get(`${API}/teacher-academic/chapters`, {
          params: {
            classId: a.classId._id,
            subjectId: a.subjectId._id,
            schoolId,
          },
        }),
        axios.get(`${API}/teacher-academic/topics`, {
          params: { chapterId: a.chapterId._id, schoolId },
        }),
      ]);
      setSubjects(subRes.data.data || []);
      setChapters(chRes.data.data || []);
      setTopics(topRes.data.data || []);
    } catch {
      /* non-critical, dropdowns just won't switch */
    } finally {
      setLoading(false);
    }

    setSelectedClass(a.classId);
    setSelectedSubject(a.subjectId);
    setSelectedChapter(a.chapterId);
    setSelectedTopic(a.topicId || null);

    setDetails({
      title: a.title || "",
      description: a.description || "",
      type: a.type || "homework",
      dueDate: a.dueDate ? a.dueDate.slice(0, 10) : "",
      duration: a.duration || "",
      maxAttempts: a.maxAttempts || 1,
    });

    // Deep copy questions so edits don't mutate original
    setQuestions(JSON.parse(JSON.stringify(a.questions || [])));
    setCurrentQ(emptyQuestion);
    setEditingQIndex(null);
    setIsDirty(false);
    setEditingAssignmentId(a._id);
    setIsEditMode(true);
    setStep(STEP_DETAILS); // jump straight to details
  };

  const handleEditClick = (a) => {
    if (a.isPublished) {
      toast.info("This assignment is live. Unpublish it first to make edits.", {
        icon: "🔒",
      });
      return;
    }
    loadAssignmentForEdit(a);
  };

  /* ── STEP HANDLERS ── */
  const pickClass = async (cls) => {
    setSelectedClass(cls);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/subjects`, {
        params: { classId: cls._id },
      });
      const data = res.data.data || [];
      setSubjects(data);
      if (data.length === 0) setError("No subjects found for this class.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subjects");
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
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/chapters`, {
        params: { classId: selectedClass._id, subjectId: sub._id, schoolId },
      });
      const data = res.data.data || [];
      setChapters(data);
      if (data.length === 0)
        setError("No chapters found. Create chapters first.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
    setStep(STEP_CHAPTER);
  };

  const pickChapter = async (ch) => {
    setSelectedChapter(ch);
    setSelectedTopic(null);
    setTopics([]);
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teacher-academic/topics`, {
        params: { chapterId: ch._id, schoolId },
      });
      setTopics(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
    setStep(STEP_TOPIC);
  };

  const pickTopic = (t) => {
    setSelectedTopic(t);
    setStep(STEP_DETAILS);
  };
  const skipTopic = () => {
    setSelectedTopic(null);
    setStep(STEP_DETAILS);
  };

  /* ── QUESTION BUILDER ── */
  const addOption = () =>
    setCurrentQ((q) => ({
      ...q,
      options: [...q.options, { text: "", isCorrect: false }],
    }));
  const removeOption = (i) =>
    setCurrentQ((q) => ({
      ...q,
      options: q.options.filter((_, idx) => idx !== i),
    }));
  const updateOption = (i, field, value) => {
    const opts = [...currentQ.options];
    opts[i] = { ...opts[i], [field]: value };
    setCurrentQ((q) => ({ ...q, options: opts }));
  };

  const saveQuestion = () => {
    if (!currentQ.text.trim()) return toast.warn("Question text is required");
    if (currentQ.type === "mcq") {
      if (currentQ.options.length < 2)
        return toast.warn("MCQ needs at least 2 options");
      if (!currentQ.options.some((o) => o.isCorrect))
        return toast.warn("Mark at least 1 correct option");
    }
    if (editingQIndex !== null) {
      const u = [...questions];
      u[editingQIndex] = currentQ;
      setQuestions(u);
      setEditingQIndex(null);
    } else {
      setQuestions((qs) => [...qs, currentQ]);
    }
    setCurrentQ(emptyQuestion);
    if (isEditMode) setIsDirty(true);
  };

  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  /* ── SUBMIT (create or update) ── */
  const handleSaveClick = () => {
    if (!details.title.trim()) return toast.warn("Title is required");
    if (!details.dueDate) return toast.warn("Due date is required");
    if (questions.length === 0) return toast.warn("Add at least 1 question");
    setConfirmSave(true);
  };

  const doSave = async () => {
    setSubmitting(true);
    setConfirmSave(false);
    try {
      if (isEditMode) {
        await axios.put(`${API}/assignment/${editingAssignmentId}`, {
          ...details,
          questions,
          totalMarks,
        });
        toast.success("Assignment updated successfully!");
      } else {
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
        toast.success("Assignment created successfully! 🎉");
      }
      await fetchAssignments();
      resetAll();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} assignment`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(STEP_CLASS);
    setIsEditMode(false);
    setEditingAssignmentId(null);
    setIsDirty(false);
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
    fetchClasses();
  };

  /* ── DISCARD ── */
  const handleDiscardClick = () => setConfirmDiscard(true);
  const doDiscard = () => {
    resetAll();
    setConfirmDiscard(false);
  };

  /* ── ASSIGNMENT ACTIONS ── */
  const doDelete = async (id) => {
    try {
      await axios.delete(`${API}/assignment/${id}`);
      toast.success("Assignment deleted");
      setConfirmDelete(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    }
  };

  const togglePublish = async (a) => {
    try {
      await axios.patch(`${API}/assignment/publish/${a._id}`);
      toast.success(
        a.isPublished
          ? "Assignment unpublished"
          : "Assignment published! Students can now see it ✓",
      );
      fetchAssignments();
    } catch {
      toast.error("Failed to update publish status");
    }
  };

  const crumbs = [
    selectedClass?.name,
    selectedSubject?.name,
    selectedChapter?.name,
    selectedTopic?.name,
  ].filter(Boolean);

  /* ── STEP CONTENT ── */
  const renderStep = () => {
    if (loading)
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      );

    if (step === STEP_CLASS)
      return (
        <CardGrid
          label="Select a Class"
          items={classes}
          onPick={pickClass}
          icon="🏫"
          emptyText="No classes assigned to you."
        />
      );
    if (step === STEP_SUBJECT)
      return (
        <CardGrid
          label="Select a Subject"
          items={subjects}
          onPick={pickSubject}
          icon="📚"
          emptyText="No subjects for this class."
          onBack={() => setStep(STEP_CLASS)}
        />
      );
    if (step === STEP_CHAPTER)
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

    if (step === STEP_TOPIC)
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
            className="mt-4 text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-semibold"
          >
            Skip this step <FiChevronRight />
          </button>
        </div>
      );

    if (step === STEP_DETAILS)
      return (
        <div className="space-y-4">
          <StepHeader
            label="Assignment Details"
            onBack={isEditMode ? null : () => setStep(STEP_TOPIC)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="field-label">Title *</label>
              <input
                className="field-input"
                placeholder="e.g. Chapter 3 Homework"
                value={details.title}
                onChange={(e) => {
                  setDetails({ ...details, title: e.target.value });
                  if (isEditMode) setIsDirty(true);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Description</label>
              <textarea
                className="field-input resize-none"
                rows={3}
                placeholder="Optional instructions..."
                value={details.description}
                onChange={(e) => {
                  setDetails({ ...details, description: e.target.value });
                  if (isEditMode) setIsDirty(true);
                }}
              />
            </div>
            <div>
              <label className="field-label">Type</label>
              <select
                className="field-input"
                value={details.type}
                onChange={(e) => {
                  setDetails({ ...details, type: e.target.value });
                  if (isEditMode) setIsDirty(true);
                }}
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
                onChange={(e) => {
                  setDetails({ ...details, dueDate: e.target.value });
                  if (isEditMode) setIsDirty(true);
                }}
              />
            </div>
            <div>
              <label className="field-label">Duration (minutes)</label>
              <input
                type="number"
                className="field-input"
                placeholder="e.g. 60"
                min={1}
                value={details.duration}
                onChange={(e) => {
                  setDetails({ ...details, duration: e.target.value });
                  if (isEditMode) setIsDirty(true);
                }}
              />
            </div>
            <div>
              <label className="field-label">Max Attempts</label>
              <input
                type="number"
                className="field-input"
                min={1}
                value={details.maxAttempts}
                onChange={(e) => {
                  setDetails({
                    ...details,
                    maxAttempts: Number(e.target.value),
                  });
                  if (isEditMode) setIsDirty(true);
                }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (!details.title.trim()) return toast.warn("Title is required");
              if (!details.dueDate) return toast.warn("Due date is required");
              setStep(STEP_QUESTIONS);
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            Continue to Questions <FiChevronRight />
          </button>
        </div>
      );

    if (step === STEP_QUESTIONS)
      return (
        <div className="space-y-5">
          <StepHeader
            label={`Questions • ${totalMarks} total marks`}
            onBack={() => setStep(STEP_DETAILS)}
          />

          {/* Builder */}
          <div className="border border-indigo-100 bg-linear-to-br from-indigo-50/50 to-white rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
              <FiBookOpen />
              {editingQIndex !== null
                ? `Editing Question ${editingQIndex + 1}`
                : "New Question"}
            </h4>
            <textarea
              className="field-input resize-none"
              rows={2}
              placeholder="Question text..."
              value={currentQ.text}
              onChange={(e) =>
                setCurrentQ((q) => ({ ...q, text: e.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Type</label>
                <select
                  className="field-input"
                  value={currentQ.type}
                  onChange={(e) =>
                    setCurrentQ((q) => ({
                      ...q,
                      type: e.target.value,
                      options: [],
                    }))
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
                    setCurrentQ((q) => ({
                      ...q,
                      marks: Number(e.target.value),
                    }))
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
                    className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <FiPlus /> Add option
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
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      title="Mark as correct"
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
                      className="text-red-400 hover:text-red-600"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                {currentQ.options.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Add at least 2 options.
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={saveQuestion}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <FiPlus />{" "}
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
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border border-gray-100 rounded-xl px-4 py-3 bg-white hover:border-indigo-200 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
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
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setCurrentQ(q);
                        setEditingQIndex(i);
                        if (isEditMode) setIsDirty(true);
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setQuestions((qs) => qs.filter((_, idx) => idx !== i));
                        if (isEditMode) setIsDirty(true);
                      }}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <HiOutlineClipboardList className="text-3xl text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No questions yet. Add at least one above.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleDiscardClick}
              className="btn-outline flex items-center gap-2"
            >
              <FiX /> {isEditMode ? "Cancel Edit" : "Discard"}
            </button>
            <button
              onClick={handleSaveClick}
              disabled={submitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <FiSave />{" "}
                  {isEditMode
                    ? `Update Assignment`
                    : `Create Assignment (${questions.length} Q • ${totalMarks} marks)`}
                </>
              )}
            </button>
          </div>
        </div>
      );
  };

  /* ── MAIN RENDER ── */
  return (
    <>
      <style>{styles}</style>

      <div className="bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto">
          {/* Page header */}
          <div className="mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <HiOutlineClipboardList className="text-white text-xl" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Assignment" : "Assignments"}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditMode
                  ? "Editing draft — changes won't save until you confirm"
                  : "Create and manage assignments for your classes"}
              </p>
            </div>
            {isEditMode && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
                <FiEdit2 /> Edit Mode {isDirty && "• Unsaved changes"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT: Wizard */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Dev warning */}
              {(!teacherId || !schoolId) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-700">
                  <strong>⚠ Config:</strong> teacherId={String(teacherId)}{" "}
                  schoolId={String(schoolId)}
                  <br />
                  keys: [{Object.keys(user).join(", ")}]
                </div>
              )}
              {/* Error banner */}
              {error && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
                  <FiAlertTriangle className="text-amber-500 mt-0.5 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError("")}
                    className="text-amber-400 hover:text-amber-600 shrink-0"
                  >
                    <FiX />
                  </button>
                </div>
              )}
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center gap-0.5 mb-2">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
                        ${i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400" : "bg-gray-100 text-gray-400"}`}
                      >
                        {i < step ? "✓" : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-0.5 rounded transition-all duration-500 ${i < step ? "bg-indigo-400" : "bg-gray-200"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">
                  {isEditMode
                    ? "Edit Mode"
                    : `Step ${step + 1}/${STEPS.length}`}{" "}
                  — {STEPS[step]}
                </p>
              </div>
              {/* Breadcrumb */}
              {crumbs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mb-5 text-xs">
                  {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <FiChevronRight className="text-gray-300" />}
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                        {c}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {renderStep()}
            </div>

            {/* RIGHT: List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">My Assignments</h2>
                <span className="text-xs bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                  {assignments.length}
                </span>
              </div>
              {assignments.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <HiOutlineClipboardList className="text-5xl mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-semibold">No assignments yet</p>
                  <p className="text-xs mt-1 text-gray-300">
                    Create one using the wizard
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-0.5">
                  {assignments.map((a) => (
                    <div
                      key={a._id}
                      className={`border rounded-xl p-3.5 hover:shadow-sm transition-all duration-200
                        ${editingAssignmentId === a._id ? "border-amber-300 bg-amber-50/40" : "border-gray-100 hover:border-indigo-200"}`}
                    >
                      {/* Title + status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-gray-800 leading-snug line-clamp-2">
                          {a.title}
                        </h3>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-bold
                          ${a.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {a.isPublished ? "● Live" : "○ Draft"}
                        </span>
                      </div>
                      {/* Meta */}
                      <p className="text-xs text-gray-400 mb-2">
                        {a.classId?.name} • {a.subjectId?.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FiAward className="text-indigo-400" />
                          {a.totalMarks} marks
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineClipboardList className="text-indigo-400" />
                          {a.questions?.length || 0} Q
                        </span>
                        {a.dueDate && (
                          <span className="flex items-center gap-1">
                            <FiClock className="text-indigo-400" />
                            {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingAssignment(a)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg
                            border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-semibold"
                        >
                          <FiEye className="text-xs" /> View
                        </button>
                        <button
                          onClick={() => handleEditClick(a)}
                          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border font-semibold transition-colors
                            ${
                              a.isPublished
                                ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                                : editingAssignmentId === a._id
                                  ? "border-amber-400 text-amber-700 bg-amber-50"
                                  : "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                        >
                          <FiEdit2 className="text-xs" />
                          {editingAssignmentId === a._id
                            ? "Editing..."
                            : "Edit"}
                        </button>
                        <button
                          onClick={() => togglePublish(a)}
                          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border font-semibold transition-colors
                            ${
                              a.isPublished
                                ? "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                                : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                        >
                          {a.isPublished ? (
                            <>
                              <FiXCircle className="text-xs" /> Unpublish
                            </>
                          ) : (
                            <>
                              <FiCheckCircle className="text-xs" /> Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(a._id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewModal
        assignment={viewingAssignment}
        onClose={() => setViewingAssignment(null)}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Assignment?"
        message="This action cannot be undone. The assignment and all its questions will be permanently removed."
        confirmLabel="Yes, Delete"
        confirmColor="red"
        onConfirm={() => doDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmModal
        open={confirmSave}
        title={isEditMode ? "Save Changes?" : "Create Assignment?"}
        message={
          isEditMode
            ? "Are you sure you want to update this assignment?"
            : `Create this assignment with ${questions.length} question${questions.length !== 1 ? "s" : ""} worth ${totalMarks} marks?`
        }
        confirmLabel={isEditMode ? "Yes, Update" : "Yes, Create"}
        confirmColor="indigo"
        onConfirm={doSave}
        onCancel={() => setConfirmSave(false)}
      />

      <ConfirmModal
        open={confirmDiscard}
        title={isEditMode ? "Cancel Edit?" : "Discard Assignment?"}
        message={
          isEditMode
            ? "Your changes will be lost and the assignment will remain unchanged."
            : "All your progress on this assignment will be lost. Are you sure?"
        }
        confirmLabel="Yes, Discard"
        confirmColor="red"
        onConfirm={doDiscard}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function CardGrid({ label, items, onPick, icon, emptyText, onBack }) {
  return (
    <div>
      <StepHeader label={label} onBack={onBack} />
      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl mt-4">
          <p className="text-3xl mb-2">{icon}</p>
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onPick(item)}
              className="text-left border border-gray-100 rounded-xl p-3.5
                hover:border-indigo-400 hover:bg-indigo-50/60 hover:shadow-sm transition-all group"
            >
              <span className="block text-xl mb-2">{icon}</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-700 leading-snug block">
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
    <div className="flex items-center gap-2 mb-3">
      {onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200
            text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <FiArrowLeft />
        </button>
      )}
      <h3 className="font-bold text-gray-800">{label}</h3>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = "indigo",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  const colors = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    red: "bg-red-500 hover:bg-red-600",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-modal">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto
          ${confirmColor === "red" ? "bg-red-100" : "bg-indigo-100"}`}
        >
          <FiAlertTriangle
            className={`text-xl ${confirmColor === "red" ? "text-red-500" : "text-indigo-500"}`}
          />
        </div>
        <h3 className="text-center font-bold text-gray-800 text-lg mb-2">
          {title}
        </h3>
        <p className="text-center text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${colors[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VIEW MODAL
───────────────────────────────────────────── */
function ViewModal({ assignment, onClose }) {
  if (!assignment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-modal">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold
                ${assignment.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
              >
                {assignment.isPublished ? "● Live" : "○ Draft"}
              </span>
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium capitalize">
                {assignment.type}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {assignment.title}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {assignment.classId?.name} › {assignment.subjectId?.name} ›{" "}
              {assignment.chapterId?.name}
              {assignment.topicId?.name && ` › ${assignment.topicId.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            {
              icon: <FiAward />,
              label: "Total Marks",
              value: assignment.totalMarks ?? 0,
            },
            {
              icon: <HiOutlineClipboardList />,
              label: "Questions",
              value: assignment.questions?.length ?? 0,
            },
            {
              icon: <FiClock />,
              label: "Due Date",
              value: assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString()
                : "—",
            },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 gap-1">
              <span className="text-indigo-400 text-lg">{s.icon}</span>
              <span className="text-lg font-bold text-gray-800">{s.value}</span>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {assignment.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700">{assignment.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Questions
            </p>
            <div className="space-y-3">
              {(assignment.questions || []).map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {q.text}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium uppercase">
                          {q.type}
                        </span>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                          {q.marks} mark{q.marks !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {q.type === "mcq" && q.options?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((o, j) => (
                            <div
                              key={j}
                              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg
                              ${o.isCorrect ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-gray-50 text-gray-600"}`}
                            >
                              {o.isCorrect ? (
                                <FiCheckCircle className="shrink-0" />
                              ) : (
                                <FiXCircle className="shrink-0 text-gray-300" />
                              )}
                              {o.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  .field-label {
    display: block; font-size: 0.7rem; font-weight: 700;
    color: #9ca3af; margin-bottom: 5px; letter-spacing: 0.05em; text-transform: uppercase;
  }
  .field-input {
    display: block; width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 9px 12px; font-size: 0.875rem; color: #1f2937; background: white;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .btn-primary {
    background: #4f46e5; color: white; border-radius: 10px; padding: 10px 20px;
    font-size: 0.875rem; font-weight: 700; border: none; cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .btn-primary:hover:not(:disabled) { background: #4338ca; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.25); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-outline {
    border: 1.5px solid #e5e7eb; color: #6b7280; border-radius: 10px; padding: 10px 16px;
    font-size: 0.875rem; font-weight: 600; background: white; cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .btn-outline:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-modal { animation: modalIn 0.2s ease-out; }
  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;
