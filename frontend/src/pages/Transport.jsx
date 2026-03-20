import { useEffect, useState } from "react";
import axios from "axios";
import { FaBus, FaRoute, FaUserTie, FaUserGraduate } from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;
const userData = JSON.parse(localStorage.getItem("userData"));
const schoolId = userData?.school_id;

const Transport = () => {
  const [summary, setSummary] = useState({
    buses: 0,
    routes: 0,
    drivers: 0,
    students: 0,
    maintenance: 0,
    suspended: 0,
    on_leave: 0,
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* ── FETCH ────────────────────────────────────────────────────────────── */

  const fetchDashboard = async () => {
    if (!schoolId) return toast.error("School ID not found");
    try {
      setLoading(true);
      const [sumRes, actRes] = await Promise.all([
        axios.get(`${API}/transport/summary`, {
          params: { school_id: schoolId },
        }),
        axios.get(`${API}/transport/activity`, {
          params: { school_id: schoolId },
        }),
      ]);
      setSummary({
        buses: sumRes.data.buses,
        routes: sumRes.data.routes,
        drivers: sumRes.data.drivers,
        students: sumRes.data.students,
        maintenance: sumRes.data.maintenance,
        suspended: sumRes.data.suspended,
        on_leave: sumRes.data.on_leave,
      });
      setActivity(actRes.data.data || []);
    } catch {
      toast.error("Failed to load transport dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* ── FILTER ───────────────────────────────────────────────────────────── */

  const filtered = search
    ? activity.filter((r) => {
        const s = search.toLowerCase();
        return (
          (r.bus || "").toLowerCase().includes(s) ||
          (r.route || "").toLowerCase().includes(s) ||
          (r.driver || "").toLowerCase().includes(s)
        );
      })
    : activity;

  /* ── LOADING ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transport dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Transport Management (WORKING)
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Real-time overview of school fleet operations
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-gray-50 transition text-sm font-medium w-fit"
        >
          ↻ Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="TOTAL BUSES"
          value={summary.buses}
          sub={`${summary.maintenance} under maintenance`}
          icon={<FaBus />}
          color="yellow"
        />
        <StatCard
          title="ACTIVE ROUTES"
          value={summary.routes}
          sub={`${summary.suspended} suspended`}
          icon={<FaRoute />}
          color="blue"
        />
        <StatCard
          title="DRIVERS"
          value={summary.drivers}
          sub={`${summary.on_leave} on leave`}
          icon={<FaUserTie />}
          color="green"
        />
        <StatCard
          title="STUDENTS COVERED"
          value={summary.students?.toLocaleString() ?? 0}
          sub="across all routes"
          icon={<FaUserGraduate />}
          color="purple"
        />
      </div>

      {/* TODAY'S ACTIVITY */}
      <div className="bg-white rounded-xl shadow">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-5 border-b">
          <div className="flex items-center gap-2">
            {/* live dot */}
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)] inline-block" />
            <h2 className="text-base font-semibold text-gray-800">
              Today's Fleet Activity
            </h2>
          </div>
          <input
            type="text"
            placeholder="Search bus, route, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full sm:w-56 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Bus
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Route
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Driver
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Created At
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row, i) => (
                <tr key={row._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-bold text-blue-700">{row.bus || "-"}</td>
                  <td className="p-4 text-gray-700">{row.route || "-"}</td>
                  <td className="p-4 text-gray-700">{row.driver}</td>
                  <td className="p-4 text-gray-600">{row.time}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        row.status === "On Time"
                          ? "bg-green-100 text-green-600"
                          : row.status === "Delayed"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400">
                    No activity records found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transport;

/* ── STAT CARD ────────────────────────────────────────────────────────────── */

const StatCard = ({ title, value, sub, icon, color = "blue" }) => {
  const colors = {
    blue: {
      border: "border-l-blue-500",
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    green: {
      border: "border-l-green-500",
      bg: "bg-green-100",
      text: "text-green-600",
    },
    yellow: {
      border: "border-l-yellow-500",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
    },
    purple: {
      border: "border-l-purple-500",
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
  };

  const c = colors[color];

  return (
    <div
      className={`bg-white rounded-xl shadow p-5 border-l-4 ${c.border} flex items-center gap-4`}
    >
      <div
        className={`w-12 h-12 rounded-full ${c.bg} ${c.text} flex items-center justify-center text-lg shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
};
