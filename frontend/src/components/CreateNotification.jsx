import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TARGET_TYPES = [
  { value: "all",    label: "🌐 Everyone" },
  { value: "role",   label: "👥 By Role" },
  { value: "class",  label: "🏫 By Class" },
];

const ROLES = [
  { value: "teacher_admin",  label: "Teachers" },
  { value: "student_admin",  label: "Students / Parents" },
  { value: "school_admin",   label: "School Admins" },
];

const NOTIF_TYPES = [
  { value: "general",    label: "📢 General" },
  { value: "exam",       label: "📝 Exam" },
  { value: "result",     label: "🏆 Result" },
  { value: "attendance", label: "📋 Attendance" },
  { value: "fee",        label: "💰 Fee" },
];

const CreateNotification = () => {
  const API = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    title: "",
    message: "",
    notificationType: "general",
    targetType: "all",
    selectedRoles: [],
    classId: "",

  });

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch classes & exams for dropdowns
  useEffect(() => {
    axios.get(`${API}/classes/all`, { withCredentials: true })
      .then(r => setClasses(r.data.classes)).catch(() => {});
  }, []);

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build the target object based on targetType
    let target = { type: form.targetType };
    if (form.targetType === "role")  target.roles   = form.selectedRoles;
    if (form.targetType === "class") target.classId = form.classId;

    try {
      await axios.post(`${API}/notifications`, {
        title: form.title,
        message: form.message,
        notificationType: form.notificationType,
        target,
      }, { withCredentials: true });

      toast.success("Notification sent!");
      setForm({
        title: "", message: "", notificationType: "general",
        targetType: "all", selectedRoles: [], classId: "",
      });
    } catch (err) {
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-indigo-700 mb-1">📣 Send Notification</h2>
      <p className="text-xs text-gray-400 mb-5">Target specific roles, classes, or send to everyone</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* TITLE */}
        <input
          className="border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          placeholder="Title  (e.g. Holiday Announcement)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
        />

        {/* MESSAGE */}
        <textarea
          rows={3}
          className="border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none"
          placeholder="Write your message here..."
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
          required
        />

        {/* NOTIFICATION TYPE */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notification Type</label>
          <div className="flex flex-wrap gap-2">
            {NOTIF_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, notificationType: t.value })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                  ${form.notificationType === t.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TARGET TYPE */}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Send To</label>
          <div className="flex flex-wrap gap-2">
            {TARGET_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, targetType: t.value, selectedRoles: [], classId: "", examId: "" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                  ${form.targetType === t.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONDITIONAL: Role selector */}
        {form.targetType === "role" && (
          <div className="bg-indigo-50 p-3 rounded-xl">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Select Roles</label>
            <div className="flex gap-2 flex-wrap">
              {ROLES.map(r => (
                <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selectedRoles.includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-xs text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* CONDITIONAL: Class selector */}
        {form.targetType === "class" && (
          <select
            className="border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            value={form.classId}
            onChange={e => setForm({ ...form, classId: e.target.value })}
            required
          >
            <option value="">— Select Class —</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} {c.section}</option>
            ))}
          </select>
        )}


        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );
};

export default CreateNotification;