import { FaBell, FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";

const Topbar = ({ toggleSidebar }) => {
  const [time, setTime] = useState({});

  const userData = JSON.parse(localStorage.getItem("userData")) || {};

  const name = userData?.name || userData?.school_name || "User";
  const role = userData?.role || "User";

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  const initials = getInitials(name);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const t = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const d = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      setTime({ t, d });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-5 sticky top-0 z-30 shadow-sm">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <FaBars size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-lg">
            🎓
          </div>

          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-indigo-600">EduAltor</h1>
            <p className="text-[12px] text-gray-400">Track. Assess. Improve.</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Time */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold">{time.t}</p>
          <p className="text-xs text-gray-400">{time.d}</p>
        </div>

        {/* Bell */}
        <div className="relative">
          <div className="w-9 h-9 flex items-center justify-center border rounded-lg">
            <FaBell size={15} />
          </div>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full">
            147
          </span>
        </div>

        {/* Role */}
        <select className="hidden sm:block border px-2 py-1 rounded capitalize">
          <option>{role.replace("_", " ")}</option>
        </select>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-gray-400 capitalize">
              {role.replace("_", " ")}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
