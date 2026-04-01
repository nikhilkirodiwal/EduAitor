import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaClock,
  FaWallet,
  FaTimes,
  FaUserShield,
  FaSchool,
  FaCalendarAlt,
  FaBell,
  FaBusAlt,
  FaBookDead,
  FaCalendar,
} from "react-icons/fa";

import { FaBookJournalWhills, FaSchoolFlag } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";

import { GiOpenBook, GiSchoolBag, GiTeacher } from "react-icons/gi";
import { HiAcademicCap } from "react-icons/hi2";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ closeSidebar }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  // const role = localStorage.getItem("userRole"); // super_admin / school_admin / teacher_admin
  
  const role = user?.role;
  const logout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  /* ---------------- SUPER ADMIN MENU ---------------- */

  const superAdminMenu = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/admin/dashboard" },

    {
      name: "Access Control",
      icon: <FaUserShield />,
      children: [
        { name: "Access", path: "/admin/access-control" },
        { name: "Role Management", path: "/admin/roles" },
      ],
    },

    {
      name: "School",
      icon: <FaSchool />,
      children: [
        { name: "All Schools", path: "/admin/schools" },
        { name: "School Management", path: "/admin/school-manage" },
        { name: "School Subscription Plan", path: "/admin/subscription-plan" },
      ],
    },
    {
      name: "School Detail",
      icon: <FaSchoolFlag />,
      path: "/admin/school-detail",
    },
  ];

  /* ---------------- SCHOOL ADMIN MENU ---------------- */

  const schoolAdminMenu = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/school/dashboard" },

    {
      name: "Students",
      icon: <FaUserGraduate />,
      children: [
        { name: "All Students", path: "/school/students" },
        { name: "Add Student", path: "/school/student-manage" },
      ],
    },

    {
      name: "Teachers",
      icon: <GiTeacher />,
      children: [
        { name: "All Teachers", path: "/school/teachers" },
        { name: "Add Teacher", path: "/school/teacher-manage" },
      ],
    },

    {
      name: "Classes",
      icon: <HiAcademicCap />,
      children: [
        { name: "Class", path: "/school/class" },
        { name: "Section", path: "/school/section" },
        { name: "Subjects", path: "/school/subject" },
      ],
    },

    { name: "Attendance", icon: <FiUsers />, path: "/school/attendance" },
    {
      name: "Exam Management",
      icon: <GiOpenBook />,
      children: [{ name: "Exam Structure", path: "/school/exam-structure" }],
    },
    { name: "Syllabus", icon: <FaBookDead />, path: "/school/syllabus" },
    { name: "Timetable", icon: <FaClock />, path: "/school/timetable" },
    {
      name: "Fee Management",
      icon: <FaWallet />,
      children: [
        { name: "Fee Structure", path: "/school/fee-structure" },
        { name: "Fee Collection", path: "/school/fee-collection" },
        { name: "Fee History", path: "/school/fee-history" },
        { name: "Defaulters", path: "/school/defaulters" },
      ],
    },

    { name: "Events", icon: <FaCalendar />, path: "/school/event" },
    { name: "Notices", icon: <FaBell />, path: "/school/notice" },
    { name: "Calendar", icon: <FaCalendarAlt />, path: "/school/calendar" },
    // { name: "Reports", icon: <FiBarChart2 />, path: "/school/reports" },
    {
      name: "Transport Management",
      icon: <FaBusAlt />,
      children: [
        { name: "Transport", path: "/school/transport" },
        { name: "Route Manage", path: "/school/transport-route" },
        { name: "Bus Manage", path: "/school/transport-bus" },
        { name: "Driver Manage", path: "/school/transport-driver" },
      ],
    },
    { name: "Library", icon: <FaBookJournalWhills />, path: "/school/library" },
  ];

  /* ---------------- TEACHER ADMIN MENU ---------------- */

  const teacherAdminMenu = [
    {
      name: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/teacher/dashboard",
    },

    {
      name: "Students",
      icon: <FaUserGraduate />,
      path: "/teacher/students",
    },

    {
      name: "Attendance",
      icon: <FiUsers />,
      path: "/teacher/attendance",
    },

    {
      name: "My Classes",
      icon: <HiAcademicCap />,
      path: "/teacher/classes",
    },
    { name: "Syllabus", icon: <FaBookDead />, path: "/school/syllabus" },
    {
      name: "Assignment",
      icon: <GiSchoolBag />,
      path: "/teacher/assignment",
    },

    {
      name: "Exams",
      icon: <GiOpenBook />,
      children: [{ name: "Marks Entry", path: "/teacher/marks-entry" }],
    },

    { name: "Timetable", icon: <FaClock />, path: "/teacher/timetable" },

    { name: "Notices", icon: <FaBell />, path: "/teacher/notice" },

    { name: "Events", icon: <FaCalendarAlt />, path: "/teacher/event" },
  ];

  let menu = [];

  if (role === "super_admin") {
    menu = superAdminMenu;
  } else if (role === "school_admin") {
    menu = schoolAdminMenu;
  } else if (role === "teacher_admin") {
    menu = teacherAdminMenu;
  }

  const toggleMenu = (name) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  return (
    <aside className="h-full w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* MOBILE HEADER */}

      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-700">Menu</h2>

        <button
          onClick={closeSidebar}
          className="text-gray-500 hover:text-red-500"
        >
          <FaTimes />
        </button>
      </div>

      {/* MENU */}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
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
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition text-sm
                  ${
                    isParentActive
                      ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>

                  {isOpen ? (
                    <FaChevronDown size={10} />
                  ) : (
                    <FaChevronRight size={10} />
                  )}
                </div>

                {isOpen && (
                  <div className="bg-gray-50/70">
                    {item.children.map((child, i) => {
                      const isActive = location.pathname === child.path;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            navigate(child.path);
                            closeSidebar && closeSidebar();
                          }}
                          className={`pl-11 pr-4 py-2 text-sm cursor-pointer transition
                          ${
                            isActive
                              ? "text-indigo-600 font-semibold"
                              : "text-gray-500 hover:text-indigo-500"
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
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm border-l-4
              ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 border-indigo-500"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-transparent"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </div>
          );
        })}
      </div>

      {/* LOGOUT */}

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition text-sm"
        >
          <FaSignOutAlt />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
