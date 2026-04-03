import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSchool,
  FaBook,
  FaEdit,
  FaTrash,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { FiX, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

/* one blank detail row */
const EMPTY_DETAIL = {
  sectionId: "",
  roomNumber: "",
  teacherId: "",
  capacity: 40,
  subjectTeachers: [],
};

const EMPTY_FORM = {
  name: "",
  details: [{ ...EMPTY_DETAIL }],
  status: "Active",
};

export default function ClassPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* ── fetch ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cls, sec, sub, tch] = await Promise.all([
        axios.get(`${API}/classes/all`, { withCredentials: true }),
        axios.get(`${API}/sections/all`, { withCredentials: true }),
        axios.get(`${API}/subjects/all`, { withCredentials: true }),
        axios.get(`${API}/teachers`, { withCredentials: true }),
      ]);
      setClasses(cls.data.classes || []);
      setSections(sec.data.sections || []);
      setSubjects(sub.data.subjects || []);
      setTeachers(tch.data.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ── detail row helpers ── */
  const updateDetail = (index, field, value) => {
    setForm((p) => {
      const details = [...p.details];
      details[index] = { ...details[index], [field]: value };
      return { ...p, details };
    });
  };

  const toggleSubject = (index, subjectId) => {
    setForm((p) => {
      const details = [...p.details];
      const subjectTeachers = [...(details[index].subjectTeachers || [])];

      const exists = subjectTeachers.find((s) => s.subjectId === subjectId);

      let updated;

      if (exists) {
        updated = subjectTeachers.filter((s) => s.subjectId !== subjectId);
      } else {
        updated = [...subjectTeachers, { subjectId, teacherId: "" }];
      }

      details[index] = {
        ...details[index],
        subjectTeachers: updated,
      };

      return { ...p, details };
    });
  };

  const addDetail = () =>
    setForm((p) => ({ ...p, details: [...p.details, { ...EMPTY_DETAIL }] }));

  const removeDetail = (index) => {
    if (form.details.length === 1) {
      toast.error("At least one entry is required");
      return;
    }
    setForm((p) => ({
      ...p,
      details: p.details.filter((_, i) => i !== index),
    }));
  };

  /* ── dirty ── */
  const isFormDirty = () =>
    JSON.stringify(form) !== JSON.stringify(initialForm);

  /* ── modal ── */
  const openCreate = () => {
    setEditingClass(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cls) => {
    const f = {
      name: cls.name,
      status: cls.status,
      details: cls.details.map((d) => ({
        _id: d._id,
        sectionId: d.sectionId?._id || "",
        roomNumber: d.roomNumber,
        teacherId: d.teacherId?._id || "",
        capacity: d.capacity || 40,
        subjectTeachers:
          d.subjectTeachers?.map((st) => ({
            subjectId: st.subjectId?._id || "",
            teacherId: st.teacherId?._id || "",
          })) || [],
      })),
    };
    setEditingClass(cls);
    setForm(f);
    setInitialForm(JSON.parse(JSON.stringify(f)));
    setShowModal(true);
  };

  const tryClose = () => {
    if (isFormDirty()) setConfirmDiscard(true);
    else closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setForm(EMPTY_FORM);
    setConfirmDiscard(false);
    setConfirmSave(false);
  };

  /* ── submit ── */
  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Class name is required");
      return;
    }
    for (const d of form.details) {
      if (!d.roomNumber.trim()) {
        toast.error("Room number is required for every entry");
        return;
      }
    }
    setConfirmSave(true);
  };

  const confirmAndSave = async () => {
    setConfirmSave(false);
    try {
      setSubmitting(true);
      if (editingClass) {
        await axios.put(
          `${API}/classes/update/${editingClass._id}`,
          {
            ...form,
          },
          { withCredentials: true },
        );
        toast.success("Class updated successfully!");
      } else {
        await axios.post(
          `${API}/classes/create`,
          {
            ...form,
          },
          { withCredentials: true },
        );
        toast.success("Class created successfully!");
      }
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/classes/delete/${deleteId}`, {
        withCredentials: true,
      });
      toast.success("Class deleted successfully!");
      setDeleteId(null);
      fetchAll();
    } catch {
      toast.error("Failed to delete.");
      setDeleteId(null);
    }
  };

  /* ── stats ── */
  const totalStudents = classes.reduce(
    (sum, c) => sum + c.details.reduce((s, d) => s + (d.studentCount || 0), 0),
    0,
  );
  const totalSections = classes.reduce(
    (sum, c) => sum + c.details.filter((d) => d.sectionId).length,
    0,
  );
  const withTeachers = classes.reduce(
    (sum, c) => sum + c.details.filter((d) => d.teacherId).length,
    0,
  );

  const getSubjectName = (id) => {
    const sub = subjects.find((s) => s._id === id);
    return sub?.name || "Unknown";
  };

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage school classes and sections
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <FaSchool />,
            label: "TOTAL CLASSES",
            value: classes.length,
            bg: "bg-blue-50 text-blue-500",
          },
          {
            icon: <FaBook />,
            label: "TOTAL SECTIONS",
            value: totalSections,
            bg: "bg-purple-50 text-purple-500",
          },
          {
            icon: <FaChalkboardTeacher />,
            label: "WITH TEACHERS",
            value: withTeachers,
            bg: "bg-green-50 text-green-500",
          },
          {
            icon: <FaUserGraduate />,
            label: "TOTAL STUDENTS",
            value: totalStudents,
            bg: "bg-orange-50 text-orange-500",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${s.bg}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-gray-800 leading-tight">
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Class Directory</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
        >
          <FaPlus size={12} /> Add Class
        </button>
      </div>

      {/* ── Class Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No classes found. Add your first class!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {classes.map((cls) =>
            cls.details.map((detail, dIndex) => {
              const pct = detail.capacity
                ? Math.min((detail.studentCount / detail.capacity) * 100, 100)
                : 0;
              const hasSection = !!detail.sectionId;
              const sectionName = detail.sectionId?.name || "";
              const label = hasSection
                ? `${cls.name}-${sectionName}`
                : cls.name;
              const shortLabel = hasSection
                ? `${cls.name.replace(/\D/g, "")}-${sectionName}`
                : cls.name.replace(/\D/g, "") ||
                  cls.name.slice(0, 2).toUpperCase();

              const visibleSubjects = detail.subjectTeachers?.slice(0, 3) || [];

              const extraSubjects = (detail.subjectTeachers?.length || 0) - 3;

              return (
                <div
                  key={`${cls._id}_${dIndex}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 hover:shadow-md transition"
                >
                  {/* ── Header ── */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {shortLabel}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">
                        {label}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Room {detail.roomNumber || "—"}
                      </p>
                    </div>
                  </div>

                  {/* ── Meta ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaChalkboardTeacher
                        size={13}
                        className="shrink-0 text-gray-400"
                      />
                      <span>{detail.teacherId?.fullName || "No Teacher"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaUserGraduate
                        size={13}
                        className="shrink-0 text-gray-400"
                      />
                      <span>{detail.studentCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaBook size={13} className="shrink-0 text-gray-400" />
                      <span>
                        {detail.subjectTeachers?.length || 0} subjects
                      </span>
                    </div>
                  </div>

                  {/* ── Capacity Bar ── */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span className="font-medium">Capacity</span>
                      <span>
                        {detail.studentCount || 0}/{detail.capacity || "—"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct >= 90
                            ? "bg-red-400"
                            : pct >= 70
                              ? "bg-amber-400"
                              : "bg-linear-to-r from-pink-400 to-indigo-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* ── Subject Pills ── */}
                  {visibleSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSubjects.map((sub, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100"
                        >
                          {getSubjectName(sub.subjectId?._id || sub.subjectId)}
                        </span>
                      ))}
                      {extraSubjects > 0 && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{extraSubjects}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/school/class-view/${cls._id}`)}
                      className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                    >
                      <FaEye size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(cls)}
                      className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(cls._id)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      )}

      {/* ════════ Add / Edit Modal ════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {editingClass ? "Edit Class" : "Add New Class"}
              </h2>
              <button
                onClick={tryClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Class Name + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Class 1, Class 10"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              {/* ── Detail rows ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    {form.details.length > 1 ? "Sections" : "Class Details"}
                  </label>
                  <button
                    onClick={addDetail}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                  >
                    <FaPlus size={10} /> Add Section
                  </button>
                </div>

                {form.details.map((detail, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 space-y-4 relative"
                  >
                    {/* remove button */}
                    {form.details.length > 1 && (
                      <button
                        onClick={() => removeDetail(index)}
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition"
                      >
                        <FaTimes size={13} />
                      </button>
                    )}

                    {/* section label */}
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                      {form.details.length > 1
                        ? `Section ${index + 1}`
                        : "Details"}
                    </p>

                    {/* Section + Room */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Section
                          <span className="text-gray-400 font-normal ml-1">
                            (optional)
                          </span>
                        </label>
                        <select
                          value={detail.sectionId}
                          onChange={(e) =>
                            updateDetail(index, "sectionId", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">No Section</option>
                          {sections
                            .filter((s) => s.status === "Active")
                            .map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Room Number <span className="text-pink-500">*</span>
                        </label>
                        <input
                          value={detail.roomNumber}
                          onChange={(e) =>
                            updateDetail(index, "roomNumber", e.target.value)
                          }
                          placeholder="e.g. 204"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Teacher + Capacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Class Teacher
                          <span className="text-gray-400 font-normal ml-1">
                            (optional)
                          </span>
                        </label>
                        <select
                          value={detail.teacherId}
                          onChange={(e) =>
                            updateDetail(index, "teacherId", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">Select Teacher</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Capacity
                        </label>
                        <input
                          type="number"
                          value={detail.capacity}
                          onChange={(e) =>
                            updateDetail(index, "capacity", e.target.value)
                          }
                          placeholder="e.g. 40"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Subjects */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Assign Subjects
                      </label>
                      <div className="border border-gray-100 bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                        {subjects.map((sub) => (
                          <label
                            key={sub._id}
                            className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={detail.subjectTeachers?.some(
                                (s) => s.subjectId === sub._id,
                              )}
                              onChange={() => toggleSubject(index, sub._id)}
                              className="accent-indigo-500"
                            />
                            {sub.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Subject Teacher Mapping */}
                    {detail.subjectTeachers?.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <label className="text-xs font-medium text-gray-600">
                          Assign Teacher per Subject
                        </label>

                        {detail.subjectTeachers.map((st, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs w-28">
                              {getSubjectName(st.subjectId)}
                            </span>

                            <select
                              value={st.teacherId}
                              onChange={(e) => {
                                const value = e.target.value;

                                setForm((p) => {
                                  const details = [...p.details];
                                  const subjectTeachers = [
                                    ...details[index].subjectTeachers,
                                  ];

                                  subjectTeachers[i] = {
                                    ...subjectTeachers[i],
                                    teacherId: value,
                                  };

                                  details[index] = {
                                    ...details[index],
                                    subjectTeachers,
                                  };

                                  return { ...p, details };
                                });
                              }}
                              className="text-xs border rounded px-2 py-1 flex-1"
                            >
                              <option value="">Assign Teacher</option>
                              {teachers.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={tryClose}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-60"
              >
                {editingClass ? "Update Class" : "Save Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Save Confirm ════════ */}
      {confirmSave && (
        <ConfirmPopup
          icon={<FiCheckCircle size={22} className="text-indigo-500" />}
          iconBg="bg-indigo-100"
          strip="bg-indigo-500"
          title={editingClass ? "Update this class?" : "Create this class?"}
          message={`"${form.name}" with ${form.details.length} ${form.details.length > 1 ? "sections" : "entry"}`}
          confirmLabel={submitting ? "Saving…" : "Yes, Save"}
          confirmCls="bg-indigo-500 hover:bg-indigo-600"
          onConfirm={confirmAndSave}
          onCancel={() => setConfirmSave(false)}
          disabled={submitting}
        />
      )}

      {/* ════════ Discard Confirm ════════ */}
      {confirmDiscard && (
        <ConfirmPopup
          icon={<FiAlertTriangle size={22} className="text-amber-500" />}
          iconBg="bg-amber-100"
          strip="bg-amber-400"
          title="Discard changes?"
          message="You have unsaved changes. If you close now all changes will be lost."
          confirmLabel="Yes, Discard"
          confirmCls="bg-amber-500 hover:bg-amber-600"
          cancelLabel="Keep Editing"
          onConfirm={closeModal}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}

      {/* ════════ Delete Confirm ════════ */}
      {deleteId && (
        <ConfirmPopup
          icon={<FaTrash size={18} className="text-red-500" />}
          iconBg="bg-red-100"
          strip="bg-red-500"
          title="Delete this class?"
          message="This action cannot be undone. The class and all its sections will be permanently removed."
          confirmLabel="Delete"
          confirmCls="bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ── Reusable Confirm Popup ── */
function ConfirmPopup({
  icon,
  iconBg,
  strip,
  title,
  message,
  confirmLabel = "Confirm",
  confirmCls = "bg-indigo-500 hover:bg-indigo-600",
  cancelLabel = "Go Back",
  onConfirm,
  onCancel,
  disabled = false,
}) {
  return (
    <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className={`h-1.5 w-full ${strip}`} />
        <div className="p-6 text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBg}`}
          >
            {icon}
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={disabled}
              className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60 ${confirmCls}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
