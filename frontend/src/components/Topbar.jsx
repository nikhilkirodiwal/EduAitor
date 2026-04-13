import { FaBell, FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Topbar = ({ toggleSidebar }) => {
  const [time, setTime] = useState({});
  const [openDropdown, setOpenDropdown] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const name = user?.name || user?.school_name || "User";
  const role = user?.role || "User";

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
    const updateTime = () => {
      const now = new Date();

      const t = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const d = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });

      setTime({ t, d });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setOpenDropdown(false);
    if (openDropdown) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openDropdown]);

  return (
    <header className="h-16 bg-white/80 backdrop-blur border-b flex items-center justify-between px-5 sticky top-0 z-30 shadow-md">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <FaBars size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg shadow">
            🎓
          </div>

          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-indigo-600">EduAltor</h1>
            <p className="text-[11px] text-gray-400">Track. Assess. Improve.</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Time */}
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-gray-700">{time.t}</p>
          <p className="text-xs text-gray-400">{time.d}</p>
        </div>

        {/* Notification */}
        <div className="relative cursor-pointer">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition">
            <FaBell className="text-gray-600" />
          </div>

          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded-full shadow">
            147
          </span>
        </div>

        {/* Role */}
        <select className="hidden md:block bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 focus:outline-none">
          <option>{role.replace("_", " ")}</option>
        </select>

        {/* USER */}
        <div className="relative">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(!openDropdown);
            }}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-2 py-1.5 rounded-xl transition"
          >
            <div className="hidden md:block text-right leading-tight">
              <p className="text-sm font-semibold text-gray-800">{name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {role.replace("_", " ")}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shadow">
              {initials}
            </div>
          </div>

          {/* DROPDOWN */}
          {openDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
              style={{
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {role.replace("_", " ")}
                </p>
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition"
              >
                ➡️ Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INLINE ANIMATION */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </header>
  );
};

export default Topbar;
