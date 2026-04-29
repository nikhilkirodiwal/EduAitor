import { FaBell, FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Topbar = ({ toggleSidebar }) => {
  const [time, setTime] = useState({});
  const [openDropdown, setOpenDropdown] = useState(false);

  // --- NEW NOTIFICATION STATES ---
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const name = user?.name || user?.school_name || "User";
  const role = user?.role || "User";
  const userId = user?._id || null;

  // --- FETCH NOTIFICATIONS ---
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, {
        withCredentials: true,
      });

      res.data.length > 0 ? setNotifications(res.data) : "";
    } catch (err) {
      console.error("Notification fetch error");
    }
  };

  // --- MARK AS READ ---
  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(
        `${API}/notifications/${id}/read`,
        {},
        { withCredentials: true },
      );
      // Update local state so the badge disappears immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, readBy: [...n.readBy, user._id] } : n,
        ),
      );
    } catch (err) {
      console.error("Error marking read");
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.readBy?.includes(user?._id),
  ).length;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(name);

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.info("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed");
    }
    localStorage.clear();
    sessionStorage.clear();
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    fetchNotifications();
    const updateTime = () => {
      const now = new Date();
      setTime({
        t: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        d: now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  setInterval(() => {
    fetchNotifications();
  }, 300000); // Refresh notifications every 60 seconds

  // clear notification on clear button-
  // ─── ADD this function alongside handleMarkAsRead ──────────────────────────
  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(
        `${API}/notifications/clear-all`,
        {},
        { withCredentials: true },
      );
      if (res.status === 200) {
        toast.success("All notifications cleared");
        setNotifications([]); // instantly empty the UI list
        setOpenNotifications(false); // close the dropdown
      }
    } catch (err) {
      toast.error("Failed to clear notifications");
      console.error("Error clearing notifications");
    }
  };

  // Close both dropdowns on outside click
  useEffect(() => {
    const close = () => {
      setOpenDropdown(false);
      setOpenNotifications(false);
    };
    if (openDropdown || openNotifications)
      window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openDropdown, openNotifications]);

  //  fetch color them function
  const [theme, setTheme] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.className = savedTheme;
    }
  }, []);

  return (
    <header className="h-16 bg-[rgb(var(--bg))] backdrop-blur border-b flex items-center justify-between px-5 sticky top-0 z-30 shadow-md">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-[rgb(var(--text))] hover:text-[rgb(var(--text))]"
        >
          <FaBars size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))] flex items-center justify-center text-[rgb(var(--text))] text-lg shadow">
            🎓
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-[rgb(var(--text))]">
              EduAltor
            </h1>
            <p className="text-[11px] bg-[rgba(0,0,0,0.05)] ">
              Track. Assess. Improve.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">
            {time.t}
          </p>
          <p className="text-xs text-[rgb(var(--text))]">{time.d}</p>
        </div>

        {/* --- NOTIFICATION ICON & DROPDOWN --- */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpenNotifications(!openNotifications);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[rgb(var(--bg))] hover:bg-[rgb(var(--bg-hover))] transition cursor-pointer"
          >
            <FaBell className="text-[rgb(var(--text))]" />
          </div>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-px rounded-full shadow">
              {unreadCount}
            </span>
          )}

          {openNotifications && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-72 md:w-80 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
            >
              {/* ── HEADER ── */}
              <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                <span className="font-bold text-gray-700">Notifications</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} New
                  </span>
                  {/* ── CLEAR ALL BUTTON ── */}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] text-red-400 hover:text-red-600 font-medium transition"
                      title="Clear all notifications"
                    >
                      ✕ Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* ── LIST ── */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-3xl mb-2">🔔</p>
                    <p className="text-gray-400 text-sm">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id)}
                      className={`p-4 border-b cursor-pointer transition hover:bg-gray-50 
              ${!n.readBy?.includes(user?._id) ? "bg-indigo-50/40 border-l-4 border-l-indigo-500" : ""}`}
                    >
                      <h4 className="text-sm font-bold text-gray-800">
                        {n.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-2 block italic">
                        {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <span>
                        {!n.readBy?.includes(user?._id) && (
                          <span
                            className="w-2 h-2 bg-blue-500 text-xs p-1 rounded-xl"
                            title="Read"
                          >
                            {" "}
                            mark as read
                          </span>
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* ── FOOTER ── */}
              <button className="w-full py-2.5 text-xs text-indigo-600 font-semibold bg-gray-50 hover:bg-gray-100 border-t">
                View All Notifications
              </button>
            </div>
          )}
        </div>

        {/* ROLE DROPDOWN */}
        <select className="hidden md:block bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 focus:outline-none capitalize">
          <option>{role.replace("_", " ")}</option>
        </select>

        {/* theme changer */}
        <select
          value={theme}
          onChange={(e) => {
            const selectedTheme = e.target.value;
            setTheme(selectedTheme);
            document.documentElement.className = selectedTheme;
            localStorage.setItem("theme", selectedTheme);
          }}
          className="hidden md:block bg-[rgb(var(--bg))] px-3 py-2 rounded-lg text-sm text-[rgb(var(--text))] focus:outline-none"
        >
          <option value="">Select Theme</option>
          <option value="theme-light">Light</option>
          <option value="theme-dark">Dark</option>
          <option value="theme-blue">Blue</option>
          <option value="theme-green">Green</option>
        </select>

        {/* USER DROPDOWN */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(!openDropdown);
            }}
            className="flex items-center gap-3 cursor-pointer  px-2 py-1.5 rounded-xl transition"
          >
            <div className="hidden md:block text-right leading-tight">
              <p className="text-sm font-semibold text-[rgb(var(--text))]">
                {name}
              </p>
              <p className="text-xs text-[rgb(var(--text))] capitalize">
                {role.replace("_", " ")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary))] text-[rgb(var(--text))] flex items-center justify-center text-sm font-bold shadow">
              {initials}
            </div>
          </div>

          {openDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-48 bg-[rgb(var(--bg))] border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-fadeIn"
            >
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-[rgb(var(--text))]">
                  {name}
                </p>
                <p className="text-xs text-[rgb(var(--text))] capitalize">
                  {role.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--text))]  hover:text-red-500 transition"
              >
                ➡️ Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ANIMATION STYLES */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Topbar;
