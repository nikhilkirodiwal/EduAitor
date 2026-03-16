import { FaBell, FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";

const Topbar = ({ toggleSidebar }) => {
  const [time, setTime] = useState({});

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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 sticky top-0 z-30 shadow-sm">
      {/* LEFT — Logo + mobile hamburger */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700 p-1 ml-1"
        >
          <FaBars size={18} />
        </button>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-lg">
            🎓
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-indigo-600 leading-tight tracking-wide">
              EduAltor
            </h1>
            <p className="text-[10px] text-gray-400 leading-tight">
              Track. Assess. Improve.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Clock */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-gray-700">{time.t}</p>
          <p className="text-[11px] text-gray-400">{time.d}</p>
        </div>

        {/* Bell */}
        <div className="relative cursor-pointer">
          <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:text-indigo-500 transition">
            <FaBell size={15} />
          </div>
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] px-1.5 py-px rounded-full font-bold">
            147
          </span>
        </div>

        {/* Role selector */}
        <select className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:border-indigo-400 hidden sm:block">
          <option>Principal</option>
        </select>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-700">Dr. Rajesh Kumar</p>
            <p className="text-[11px] text-gray-400">School Principal</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            DRK
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;