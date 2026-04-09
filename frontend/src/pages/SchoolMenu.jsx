import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import {
  FaTachometerAlt, FaUserGraduate, FaSignOutAlt, FaClock,
  FaWallet, FaUserShield, FaCalendarAlt, FaBell, FaBusAlt,
  FaBookDead, FaCalendar, FaBookOpen, FaChevronRight,
} from "react-icons/fa";
import { FaBookJournalWhills } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { GiOpenBook, GiTeacher } from "react-icons/gi";
import { HiAcademicCap } from "react-icons/hi2";

const COLOR_MAP = {
  Dashboard:            { bg: "#FFF7ED", icon: "#F97316", dot: "#FED7AA" },
  Students:             { bg: "#EFF6FF", icon: "#3B82F6", dot: "#BFDBFE" },
  Teachers:             { bg: "#F0FDF4", icon: "#22C55E", dot: "#BBF7D0" },
  Classes:              { bg: "#FAF5FF", icon: "#A855F7", dot: "#E9D5FF" },
  Attendance:           { bg: "#FFF1F2", icon: "#F43F5E", dot: "#FFD5DB" },
  "Exam Management":    { bg: "#FFF7ED", icon: "#EF4444", dot: "#FEE2E2" },
  Syllabus:             { bg: "#F0FDF4", icon: "#10B981", dot: "#A7F3D0" },
  Timetable:            { bg: "#EFF6FF", icon: "#6366F1", dot: "#C7D2FE" },
  "Fee Management":     { bg: "#FFFBEB", icon: "#D97706", dot: "#FDE68A" },
  Diary:                { bg: "#FDF4FF", icon: "#C026D3", dot: "#F5D0FE" },
  Events:               { bg: "#FFF1F2", icon: "#E11D48", dot: "#FECDD3" },
  Notices:              { bg: "#FFF7ED", icon: "#EA580C", dot: "#FED7AA" },
  Calendar:             { bg: "#EFF6FF", icon: "#0EA5E9", dot: "#BAE6FD" },
  "Transport Management": { bg: "#F8FAFC", icon: "#64748B", dot: "#CBD5E1" },
  Library:              { bg: "#F0FDFA", icon: "#0D9488", dot: "#99F6E4" },
};

const DEFAULT_COLOR = { bg: "#F3F4F6", icon: "#6B7280", dot: "#E5E7EB" };

function SchoolMenu() {
  const navigate = useNavigate();

  const schoolAdminMenu = [
    { name: "Dashboard",  icon: <FaTachometerAlt />, path: "/school/dashboard" },
    { name: "Students",   icon: <FaUserGraduate />, children: [
        { name: "All Students", path: "/school/students" },
        { name: "Add Student",  path: "/school/student-manage" },
      ],
    },
    { name: "Teachers",   icon: <GiTeacher />, children: [
        { name: "All Teachers", path: "/school/teachers" },
        { name: "Add Teacher",  path: "/school/teacher-manage" },
      ],
    },
    { name: "Classes",    icon: <HiAcademicCap />, children: [
        { name: "Class",    path: "/school/class" },
        { name: "Section",  path: "/school/section" },
        { name: "Subjects", path: "/school/subject" },
      ],
    },
    { name: "Attendance", icon: <FiUsers />, path: "/school/attendance" },
    { name: "Exam Management", icon: <GiOpenBook />, children: [
        { name: "Exam Structure", path: "/school/exam-structure" },
      ],
    },
    { name: "Syllabus",   icon: <FaBookDead />,   path: "/school/syllabus" },
    { name: "Timetable",  icon: <FaClock />,        path: "/school/timetable" },
    { name: "Fee Management", icon: <FaWallet />, children: [
        { name: "Fee Structure",  path: "/school/fee-structure" },
        { name: "Fee Collection", path: "/school/fee-collection" },
        { name: "Fee History",    path: "/school/fee-history" },
        { name: "Defaulters",     path: "/school/defaulters" },
      ],
    },
    { name: "Diary",    icon: <FaBookOpen />,          path: "/school/diary" },
    { name: "Events",   icon: <FaCalendar />,           path: "/school/event" },
    { name: "Notices",  icon: <FaBell />,               path: "/school/notice" },
    { name: "Calendar", icon: <FaCalendarAlt />,        path: "/school/calendar" },
    { name: "Transport Management", icon: <FaBusAlt />, children: [
        { name: "Transport",       path: "/school/transport" },
        { name: "Route Manage",    path: "/school/transport-route" },
        { name: "Bus Manage",      path: "/school/transport-bus" },
        { name: "Driver Manage",   path: "/school/transport-driver" },
      ],
    },
    { name: "Library", icon: <FaBookJournalWhills />, path: "/school/library" },
  ];

  const [currentMenu, setCurrentMenu] = useState(schoolAdminMenu);
  const [history, setHistory]         = useState([]);
  const [sectionTitle, setSectionTitle] = useState("Menu");
  const [titleHistory, setTitleHistory] = useState([]);
  const [animKey, setAnimKey]           = useState(0);

  const handleClick = (item) => {
    if (item.children) {
      setHistory([...history, currentMenu]);
      setTitleHistory([...titleHistory, sectionTitle]);
      setCurrentMenu(item.children);
      setSectionTitle(item.name);
      setAnimKey(k => k + 1);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      setCurrentMenu(history[history.length - 1]);
      setHistory(history.slice(0, -1));
      setSectionTitle(titleHistory[titleHistory.length - 1]);
      setTitleHistory(titleHistory.slice(0, -1));
      setAnimKey(k => k + 1);
    } else {
      navigate(-1);
    }
  };

  const isSubMenu = history.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
        padding: "0 16px",
        paddingTop: "env(safe-area-inset-top, 16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 0 14px" }}>
          {isSubMenu && (
            <button
              onClick={handleBack}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: 10,
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", cursor: "pointer", flexShrink: 0,
              }}
            >
              <FaArrowLeft size={14} />
            </button>
          )}
          <div>
            {isSubMenu && (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, letterSpacing: 0.5 }}>
                MENU
              </p>
            )}
            <h1 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
              {sectionTitle}
            </h1>
          </div>
        </div>

        {/* Breadcrumb dots */}
        {history.length > 0 && (
          <div style={{ display: "flex", gap: 4, paddingBottom: 14 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "inline-block" }} />
            {history.map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "inline-block" }} />
            ))}
            <span style={{ width: 20, height: 6, borderRadius: 3, background: "#fff", display: "inline-block" }} />
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div
        key={animKey}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          padding: 16,
        }}
      >
        {currentMenu.map((item, i) => {
          const color = COLOR_MAP[item.name] || COLOR_MAP[sectionTitle] || DEFAULT_COLOR;
          return (
            <MenuCard
              key={item.name}
              item={item}
              color={color}
              index={i}
              onClick={() => handleClick(item)}
            />
          );
        })}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
}

function MenuCard({ item, color, index, onClick }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "20px 14px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: pressed
          ? "0 1px 4px rgba(0,0,0,0.08)"
          : "0 2px 12px rgba(0,0,0,0.06)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        animation: `fadeSlideUp 0.35s ease both`,
        animationDelay: `${index * 45}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft dot decoration */}
      <div style={{
        position: "absolute", top: -10, right: -10,
        width: 50, height: 50, borderRadius: "50%",
        background: color.dot, opacity: 0.5,
      }} />

      {/* Icon bubble */}
      <div style={{
        width: 52, height: 52,
        borderRadius: 15,
        background: color.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 12,
        fontSize: 22,
        color: color.icon,
      }}>
        {item.icon}
      </div>

      {/* Label */}
      <p style={{
        margin: 0,
        fontSize: 12.5,
        fontWeight: 700,
        color: "#1E293B",
        textAlign: "center",
        lineHeight: 1.3,
      }}>
        {item.name}
      </p>

      {/* Sub-menu badge */}
      {item.children && (
        <div style={{
          marginTop: 8,
          background: color.bg,
          borderRadius: 20,
          padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: color.icon }}>
            {item.children.length} items
          </span>
          <FaChevronRight size={8} color={color.icon} />
        </div>
      )}
    </div>
  );
}

export default SchoolMenu;