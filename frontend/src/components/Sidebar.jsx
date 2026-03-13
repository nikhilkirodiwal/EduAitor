import {
  FaTachometerAlt,
  FaUserShield,
  FaSchool,
  FaUserGraduate,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaClock,
} from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { HiAcademicCap } from "react-icons/hi2";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);

  const role = localStorage.getItem("userRole"); // super_admin / school_admin

  const logout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  /* ---------------- SUPER ADMIN MENU ---------------- */

  const superAdminMenu = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/admin/dashboard",
    },

    {
      name: "Access Control",
      icon: <FaUserShield />,
      children: [
        {
          name: "Access",
          path: "/admin/access-control",
        },
        {
          name: "Role Management",
          path: "/admin/roles",
        },
      ],
    },

    {
      name: "School",
      icon: <FaSchool />,
      children: [
        {
          name: "All Schools",
          path: "/admin/schools",
        },
        {
          name: "School Management",
          path: "/admin/school-manage",
        },
        {
          name: "School Subscription Plan",
          path: "/admin/subscription-plan",
        },
      ],
    },
  ];

  /* ---------------- SCHOOL ADMIN MENU ---------------- */

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
        {
          name: "All Students",
          path: "/school/students",
        },
        {
          name: "Add Student",
          path: "/school/student-manage",
        },
      ],
    },
    {
      name: "Teacher Management",
      icon: <GiTeacher />,
      children: [
        {
          name: "All Teachers",
          path: "/school/teachers",
        },
        {
          name: "Add Teacher",
          path: "/school/teacher-manage",
        },
      ],
    },
    {
      name: "Academics",
      icon: <HiAcademicCap />,
      children: [
        {
          name: "Class",
          path: "/school/class",
        },
        {
          name: "Section",
          path: "/school/section",
        },
        {
          name: "Subjects",
          path: "/school/subject",
        },
      ],
    },
    {
      name: "Timetable",
      icon: <FaClock />,
      path: "/school/timetable",
    },
  ];

  const menu = role === "super_admin" ? superAdminMenu : schoolAdminMenu;

  const toggleMenu = (name) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white shadow-lg border-r flex flex-col">
      {/* LOGO */}

      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold bg-linear-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
          EduAitor
        </h1>

        <p className="text-xs text-gray-500">
          {role === "super_admin" ? "Super Admin" : "School Admin"}
        </p>
      </div>

      {/* MENU */}

      <div className="flex-1 overflow-y-auto p-4">
        {menu.map((item, index) => {
          const isParentActive =
            item.children &&
            item.children.some((c) => location.pathname === c.path);

          /* ---------- PARENT WITH CHILDREN ---------- */

          if (item.children) {
            const isOpen = openMenu === item.name;

            return (
              <div key={index} className="mb-2">
                <div
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                  
                  ${
                    isParentActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-600 hover:bg-indigo-50"
                  }
                  
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>

                    <span className="text-sm font-medium">{item.name}</span>
                  </div>

                  {isOpen ? (
                    <FaChevronDown size={12} />
                  ) : (
                    <FaChevronRight size={12} />
                  )}
                </div>

                {isOpen && (
                  <div className="ml-8 mt-1 border-l pl-3">
                    {item.children.map((child, i) => {
                      const isActive = location.pathname === child.path;

                      return (
                        <div
                          key={i}
                          onClick={() => navigate(child.path)}
                          className={`p-2 text-sm cursor-pointer rounded
                          
                          ${
                            isActive
                              ? "text-indigo-600 font-semibold"
                              : "text-gray-600 hover:text-indigo-600"
                          }
                          
                          `}
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

          /* ---------- SINGLE MENU ---------- */

          const isActive = location.pathname === item.path;

          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 p-3 mb-2 rounded-lg cursor-pointer transition
              
              ${
                isActive
                  ? "bg-indigo-100 text-indigo-600 font-semibold"
                  : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
              }
              
              `}
            >
              <span className="text-lg">{item.icon}</span>

              <span className="text-sm font-semibold">{item.name}</span>
            </div>
          );
        })}
      </div>

      {/* LOGOUT */}

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-red-500 hover:bg-red-50 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
