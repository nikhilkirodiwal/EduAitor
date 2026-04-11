import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  FiBell,
  FiEye,
  FiX,
  FiUsers,
  FiCalendar,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext"; // ← adjust path if needed
import {FaArrowLeft} from "react-icons/fa";
import { useNavigate } from "react-router-dom";


const API = import.meta.env.VITE_API_URL;

/* ── style maps (identical to admin Notice) ── */
const CATEGORY_STYLES = {
  Examination: { bg: "bg-red-100",    text: "text-red-600"    },
  Meeting:     { bg: "bg-blue-100",   text: "text-blue-600"   },
  Holiday:     { bg: "bg-green-100",  text: "text-green-700"  },
  Fee:         { bg: "bg-orange-100", text: "text-orange-600" },
  Event:       { bg: "bg-purple-100", text: "text-purple-600" },
  General:     { bg: "bg-gray-100",   text: "text-gray-600"   },
};

const PRIORITY_STYLES = {
  High:   { bg: "bg-red-50",   text: "text-red-500",   icon: <FiAlertCircle size={11} /> },
  Normal: { bg: "bg-blue-50",  text: "text-blue-500",  icon: <FiInfo        size={11} /> },
  Low:    { bg: "bg-slate-50", text: "text-slate-500", icon: <FiCheckCircle size={11} /> },
};

const AUDIENCE_STYLES = {
  All:     { bg: "bg-indigo-50", text: "text-indigo-600" },
  Parents: { bg: "bg-pink-50",   text: "text-pink-600"   },
  Staff:   { bg: "bg-amber-50",  text: "text-amber-600"  },
  Class:   { bg: "bg-green-50",  text: "text-green-600"  },
};

/* ════════════════════════════════════════════════════ */
export default function TeacherNotice() {
  const { user, loading: authLoading } = useAuth();
  

  /* ── auth guard ── */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only teachers / teacher_admin may view this page
  if (!user || (user.role !== "teacher" && user.role !== "teacher_admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <TeacherNoticeContent />;
}

/* ── Inner component (rendered only when role is confirmed) ── */
function TeacherNoticeContent() {
    const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  const [notices, setNotices]       = useState([]);
  const [stats, setStats]           = useState({ total: 0, active: 0, highPriority: 0, audiences: 0 });
  const [loading, setLoading]       = useState(true);
  const [viewNotice, setViewNotice] = useState(null);
  const [filter, setFilter]         = useState("All");

  /* ── fetch notices ── */
  const loadNotices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/notices/`, { withCredentials: true });
      setNotices(data.notices);
      setStats(data.stats);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotices(); }, []);

  /* ── stat cards ── */
  const statCards = [
    { label: "TOTAL NOTICES", value: stats.total,       icon: <FiBell />,          iconBg: "bg-blue-50 text-blue-500"   },
    { label: "ACTIVE",        value: stats.active,      icon: <FiCheckCircle />,   iconBg: "bg-green-50 text-green-500" },
    { label: "HIGH PRIORITY", value: stats.highPriority,icon: <FiAlertTriangle />, iconBg: "bg-red-50 text-red-500"     },
    { label: "AUDIENCES",     value: stats.audiences,   icon: <FiUsers />,         iconBg: "bg-purple-50 text-purple-500"},
  ];

  /* ── filtered list ── */
  const filtered =
    filter === "All"
      ? notices
      : notices.filter(
          (n) => n.audience === filter || n.priority === filter || n.category === filter,
        );

  /* ════════════════════════════════════════════════════ */
  return (
    <div>
      {/* 🔙 BACK BUTTON */}
      {isMobile && (
          <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                 bg-white shadow-sm border border-slate-100
                 text-sm font-bold text-slate-600 active:scale-95 transition-transform mb-2.5"
          >
            <FaArrowLeft size={16} />
            Back
          </button>
        </div>
      )}
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View notices published for students, parents, and staff.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${s.iconBg}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar (filter only — no Create button) ── */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {["All", "Parents", "Staff", "High"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              filter === f
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Notice Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No notices found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((n) => {
            const catCls  = CATEGORY_STYLES[n.category]  || CATEGORY_STYLES.General;
            const prioCls = PRIORITY_STYLES[n.priority]  || PRIORITY_STYLES.Normal;
            const audCls  = AUDIENCE_STYLES[n.audience]  || AUDIENCE_STYLES.All;
            const isExpired = n.expiryDate && new Date(n.expiryDate) < new Date();

            return (
              <div
                key={n._id}
                className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col hover:shadow-md transition ${
                  !n.isActive || isExpired ? "opacity-60 border-gray-100" : "border-gray-100"
                }`}
              >
                {/* top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-gray-800 leading-snug flex-1">
                    {n.title}
                  </h3>
                  {(!n.isActive || isExpired) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 shrink-0">
                      Inactive
                    </span>
                  )}
                </div>

                {/* badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${catCls.bg} ${catCls.text}`}>
                    {n.category?.toUpperCase()}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${prioCls.bg} ${prioCls.text}`}>
                    {prioCls.icon} {n.priority}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${audCls.bg} ${audCls.text}`}>
                    {n.audience === "Class" && n.assignedClass ? `Class: ${n.assignedClass}` : n.audience}
                  </span>
                </div>

                {/* preview */}
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-3">
                  {n.content}
                </p>

                {/* dates */}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={11} /> {n.publishDate?.slice(0, 10)}
                  </span>
                  {n.expiryDate && (
                    <>
                      <span>→</span>
                      <span className={isExpired ? "text-red-400" : ""}>
                        {n.expiryDate?.slice(0, 10)}
                      </span>
                    </>
                  )}
                </div>

                {/* author */}
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {n.createdBy?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400">{n.createdBy}</span>
                </div>

                {/* ── View-only action row ── */}
                <div className="flex items-center">
                  <button
                    onClick={() => setViewNotice(n)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                  >
                    <FiEye size={13} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ View Modal ════════ */}
      {viewNotice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className={`h-1.5 w-full ${CATEGORY_STYLES[viewNotice.category]?.bg || "bg-gray-100"}`} />
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-800 leading-snug">
                  {viewNotice.title}
                </h2>
                <button
                  onClick={() => setViewNotice(null)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${CATEGORY_STYLES[viewNotice.category]?.bg} ${CATEGORY_STYLES[viewNotice.category]?.text}`}>
                  {viewNotice.category?.toUpperCase()}
                </span>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${PRIORITY_STYLES[viewNotice.priority]?.bg} ${PRIORITY_STYLES[viewNotice.priority]?.text}`}>
                  {viewNotice.priority} Priority
                </span>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${AUDIENCE_STYLES[viewNotice.audience]?.bg} ${AUDIENCE_STYLES[viewNotice.audience]?.text}`}>
                  {viewNotice.audience === "Class" && viewNotice.assignedClass
                    ? `Class: ${viewNotice.assignedClass}`
                    : viewNotice.audience}
                </span>
                {!viewNotice.isActive && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    Inactive
                  </span>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {viewNotice.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Publish Date</p>
                  <p className="font-semibold text-gray-700">
                    {viewNotice.publishDate?.slice(0, 10) || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 font-medium mb-0.5">Expiry Date</p>
                  <p className="font-semibold text-gray-700">
                    {viewNotice.expiryDate?.slice(0, 10) || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-gray-400 font-medium mb-0.5">Created By</p>
                  <p className="font-semibold text-gray-700">{viewNotice.createdBy}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewNotice(null)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}