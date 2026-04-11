import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {FaArrowLeft} from "react-icons/fa";

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTag,
  FiMapPin,
  FiUser,
  FiUsers,
  FiEye,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext"; // ← adjust path if needed

const API = import.meta.env.VITE_API_URL;

const TYPE_COLORS = {
  Competition:    "bg-orange-100 text-orange-600",
  Cultural:       "bg-pink-100 text-pink-600",
  Sports:         "bg-green-100 text-green-700",
  Administrative: "bg-gray-100 text-gray-600",
};

const getStatus = (ev) => {
  const now   = new Date();
  const start = new Date(ev.startDate);
  const end   = ev.endDate ? new Date(ev.endDate) : start;
  if (now < start) return "Upcoming";
  if (now > end)   return "Completed";
  return "Ongoing";
};

/* ════════════════════════════════════════════════════ */
export default function TeacherEvent() {
  const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;


  /* ── auth guard ── */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "teacher_admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <TeacherEventContent />;
}

/* ── Inner component (rendered only when role is confirmed) ── */
function TeacherEventContent() {
  const navigate = useNavigate();
    const isMobile = window.innerWidth <= 768;

  const [events,  setEvents]  = useState([]);
  const [stats,   setStats]   = useState({ total: 0, completed: 0, upcoming: 0, categories: 0 });
  const [loading, setLoading] = useState(true);


  /* ── fetch events ── */
  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/events/`, { withCredentials: true });
      setEvents(data.events);
      setStats(data.stats);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  /* ── stat cards ── */
  const statCards = [
    { label: "TOTAL EVENTS", value: stats.total,     icon: <FiCalendar />,    iconBg: "bg-blue-50 text-blue-500"     },
    { label: "COMPLETED",    value: stats.completed, icon: <FiCheckCircle />, iconBg: "bg-green-50 text-green-500"   },
    { label: "UPCOMING",     value: stats.upcoming,  icon: <FiClock />,       iconBg: "bg-purple-50 text-purple-500" },
    { label: "CATEGORIES",   value: stats.categories,icon: <FiTag />,         iconBg: "bg-orange-50 text-orange-500" },
  ];

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
        <h1 className="text-2xl font-bold text-gray-800">Events</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View all upcoming and past school events.
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

      {/* ── List header (no Create button) ── */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-800">All Events</h2>
      </div>

      {/* ── Event Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No events found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((ev) => {
            const status      = getStatus(ev);
            const isCompleted = status === "Completed";

            return (
              <div
                key={ev._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex flex-col"
              >
                {/* title + status */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-800 leading-snug">
                    {ev.title}
                  </h3>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ml-2 ${
                      isCompleted
                        ? "text-gray-400"
                        : status === "Ongoing"
                          ? "text-green-600"
                          : "text-indigo-500"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {/* type badge */}
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3 w-fit ${TYPE_COLORS[ev.type] || "bg-gray-100 text-gray-600"}`}
                >
                  {ev.type?.toUpperCase()}
                </span>

                {/* meta */}
                <div className="space-y-1.5 text-sm text-gray-500 flex-1">
                  <div className="flex items-center gap-2">
                    <FiCalendar size={13} className="shrink-0" />
                    <span>{ev.startDate?.slice(0, 10)} at {ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin size={13} className="shrink-0" />
                    <span>{ev.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiUser size={13} className="shrink-0" />
                    <span>{ev.organizer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiUsers size={13} className="shrink-0" />
                    <span>{ev.attendees} attendees</span>
                  </div>
                </div>

                {/* ── View-only action row ── */}
                <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/school/event/${ev._id}`)}
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
    </div>
  );
}