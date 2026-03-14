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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-600">
          <FaBars size={18} />
        </button>

        <div>
          <p className="text-sm font-semibold">{time.t}</p>
          <p className="text-xs text-gray-500">{time.d}</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer">
          <FaBell className="text-gray-600 text-lg" />

          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            147
          </span>
        </div>

        <select className="border rounded-lg px-3 py-1 text-sm bg-gray-50">
          <option>Principal</option>
          <option>Teacher</option>
        </select>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">Dr. Rajesh Kumar</p>
            <p className="text-xs text-gray-500">School Principal</p>
          </div>

          <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
            DRK
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
