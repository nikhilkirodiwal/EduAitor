import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className=" bg-slate-100 flex">

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="relative z-50">
            <Sidebar closeSidebar={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Section */}
      <div className="flex flex-col flex-1 lg:ml-64">

        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Container */}
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm p-6 min-h-[80vh]">
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;