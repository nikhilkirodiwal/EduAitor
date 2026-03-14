import {
  FaTachometerAlt,
  FaUserShield,
  FaSchool,
  FaUserGraduate,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaClock,
  FaWallet,
} from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { HiAcademicCap } from "react-icons/hi2";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const role = localStorage.getItem("userRole");

  const logout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const schoolAdminMenu = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/school/dashboard",
    },
    {
      name: "Student Management",
      icon: <FaUserGraduate />,
      children: [
        { name: "All Students", path: "/school/students" },
        { name: "Add Student", path: "/school/student-manage" },
      ],
    },
    {
      name: "Teacher Management",
      icon: <GiTeacher />,
      children: [
        { name: "All Teachers", path: "/school/teachers" },
        { name: "Add Teacher", path: "/school/teacher-manage" },
      ],
    },
    {
      name: "Academics",
      icon: <HiAcademicCap />,
      children: [
        { name: "Class", path: "/school/class" },
        { name: "Section", path: "/school/section" },
        { name: "Subjects", path: "/school/subject" },
      ],
    },
    {
      name: "Timetable",
      icon: <FaClock />,
      path: "/school/timetable",
    },
    {
      name: "Fee Management",
      icon: <FaWallet />,
      children: [
        {
          name: "Fee Structure",
          path: "/school/fee-structure",
        },
      ],
    },
  ];

  const menu = schoolAdminMenu;

  const toggleMenu = (name) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  return (
    <aside className="h-screen w-64 bg-white border-r flex flex-col">
      {/* LOGO */}
      <div className="h-16 flex items-center px-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
          🎓
        </div>

        <div className="ml-3">
          <h1 className="text-lg font-semibold text-indigo-600">EduAltor</h1>
          <p className="text-xs text-gray-500">School Admin</p>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto py-3">
        {menu.map((item, index) => {
          const isParentActive =
            item.children &&
            item.children.some((c) => location.pathname === c.path);

          if (item.children) {
            const isOpen = openMenu === item.name;

            return (
              <div key={index}>
                <div
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-all
                  ${
                    isParentActive
                      ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>

                  {isOpen ? (
                    <FaChevronDown size={12} />
                  ) : (
                    <FaChevronRight size={12} />
                  )}
                </div>

                {isOpen && (
                  <div className="ml-10 border-l pl-4 space-y-1">
                    {item.children.map((child, i) => {
                      const isActive = location.pathname === child.path;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            navigate(child.path);
                            closeSidebar && closeSidebar();
                          }}
                          className={`py-2 text-sm cursor-pointer transition
                          ${
                            isActive
                              ? "text-indigo-600 font-semibold"
                              : "text-gray-600 hover:text-indigo-600"
                          }`}
                        >
                          {child.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname === item.path;

          return (
            <div
              key={index}
              onClick={() => {
                navigate(item.path);
                closeSidebar && closeSidebar();
              }}
              className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all
              ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>

              <span className="text-sm font-medium">{item.name}</span>
            </div>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
