import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 w-full p-8 bg-gray-50 min-h-screen">
        <Outlet />
      </div>

    </div>
  );
};

export default AdminLayout;