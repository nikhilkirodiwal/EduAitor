// import { useState, useEffect, useCallback, useRef } from "react";
// import {
//   FiChevronLeft,
//   FiChevronRight,
//   FiPlus,
//   FiFilter,
//   FiRefreshCw,
//   FiCalendar,
//   FiClock,
//   FiMapPin,
//   FiUsers,
// } from "react-icons/fi";
// import { toast } from "react-toastify";
// import axios from "axios";
// import Event from "./Event";

// // ─── Config ───────────────────────────────────────────────────────────────────
// const API = import.meta.env.VITE_API_URL;

// const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// const MONTH_NAMES = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// // Maps to your Event schema `type` enum
// const EVENT_TYPES = ["Competition", "Cultural", "Sports", "Administrative"];

// const TYPE_CFG = {
//   Competition: {
//     color: "#F97316",
//     light: "rgba(249,115,22,0.12)",
//     dot: "#F97316",
//   },
//   Cultural: {
//     color: "#A855F7",
//     light: "rgba(168,85,247,0.12)",
//     dot: "#A855F7",
//   },
//   Sports: { color: "#22C55E", light: "rgba(34,197,94,0.12)", dot: "#22C55E" },
//   Administrative: {
//     color: "#3B82F6",
//     light: "rgba(59,130,246,0.12)",
//     dot: "#3B82F6",
//   },
// };

// const PRIORITY_CFG = {
//   High: { label: "HIGH", bg: "rgba(239,68,68,0.18)", text: "#FCA5A5" },
//   Normal: { label: "NORM", bg: "rgba(100,116,139,0.2)", text: "#94A3B8" },
//   Low: { label: "LOW", bg: "rgba(34,197,94,0.15)", text: "#86EFAC" },
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const getMondayOf = (date) => {
//   const d = new Date(date);
//   const day = d.getDay();
//   const diff = day === 0 ? -6 : 1 - day;
//   d.setDate(d.getDate() + diff);
//   d.setHours(0, 0, 0, 0);
//   return d;
// };

// const addDays = (date, n) => {
//   const d = new Date(date);
//   d.setDate(d.getDate() + n);
//   return d;
// };

// const isSameDay = (a, b) =>
//   a.getFullYear() === b.getFullYear() &&
//   a.getMonth() === b.getMonth() &&
//   a.getDate() === b.getDate();

// const isInRange = (target, start, end) => {
//   const t = new Date(target).setHours(0, 0, 0, 0);
//   const s = new Date(start).setHours(0, 0, 0, 0);
//   const e = end ? new Date(end).setHours(0, 0, 0, 0) : s;
//   return t >= s && t <= e;
// };

// const fmt = (date, opts) => new Date(date).toLocaleDateString("en-US", opts);

// const toYMD = (date) => new Date(date).toISOString().split("T")[0];

// // ─── Event Card ───────────────────────────────────────────────────────────────

// const EventCard = ({ event, onClick }) => {
//   const cfg = TYPE_CFG[event.type] || TYPE_CFG.Administrative;
//   const pcfg = PRIORITY_CFG[event.priority] || PRIORITY_CFG.Normal;
//   const isMultiDay =
//     event.endDate && !isSameDay(event.startDate, event.endDate);

//   return (
//     <button
//       onClick={(e) => {
//         e.stopPropagation();
//         onClick(event);
//       }}
//       className="w-full text-left group"
//       style={{ marginBottom: 4 }}
//     >
//       <div
//         className="rounded-lg px-2.5 py-2 transition-all duration-200 group-hover:brightness-125 group-hover:translate-x-0.5"
//         style={{ background: cfg.light, borderLeft: `3px solid ${cfg.color}` }}
//       >
//         {/* Title row */}
//         <div className="flex items-start justify-between gap-1">
//           <span
//             className="text-xs font-bold leading-tight truncate"
//             style={{ color: cfg.color }}
//           >
//             {event.title}
//           </span>
//           <span
//             className="text-[9px] font-black px-1 py-0.5 rounded shrink-0"
//             style={{ background: pcfg.bg, color: pcfg.text }}
//           >
//             {pcfg.label}
//           </span>
//         </div>

//         {/* Meta row */}
//         <div className="flex items-center gap-2 mt-1 flex-wrap">
//           <span
//             className="flex items-center gap-0.5 text-[10px]"
//             style={{ color: "#94A3B8" }}
//           >
//             <FiClock size={9} /> {event.time}
//           </span>
//           {event.location && (
//             <span
//               className="flex items-center gap-0.5 text-[10px] truncate max-w-20"
//               style={{ color: "#94A3B8" }}
//             >
//               <FiMapPin size={9} /> {event.location}
//             </span>
//           )}
//           {isMultiDay && (
//             <span
//               className="text-[9px] px-1 py-0.5 rounded"
//               style={{ background: "rgba(255,255,255,0.06)", color: "#64748B" }}
//             >
//               multi-day
//             </span>
//           )}
//         </div>
//       </div>
//     </button>
//   );
// };

// // ─── Day Column ───────────────────────────────────────────────────────────────

// const DayColumn = ({ date, events, isToday, onClick, onEventClick }) => (
//   <div
//     className="flex flex-col flex-1 border-r border-white/5 cursor-pointer transition-colors hover:bg-white/2"
//     style={{ minHeight: 0 }}
//     onClick={() => onClick(date)}
//   >
//     {/* Day header */}
//     <div
//       className="flex flex-col items-center py-3 border-b"
//       style={{
//         borderColor: "rgba(255,255,255,0.06)",
//         background: isToday ? "rgba(59,130,246,0.08)" : "transparent",
//       }}
//     >
//       <span
//         className="text-[10px] font-bold tracking-widest uppercase"
//         style={{ color: "#475569" }}
//       >
//         {DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1]}
//       </span>
//       <div
//         className="w-8 h-8 flex items-center justify-center rounded-full mt-1 text-sm font-black"
//         style={{
//           background: isToday ? "#3B82F6" : "transparent",
//           color: isToday ? "#fff" : "#CBD5E1",
//         }}
//       >
//         {date.getDate()}
//       </div>
//       {isToday && (
//         <span
//           className="text-[9px] font-bold mt-0.5"
//           style={{ color: "#3B82F6" }}
//         >
//           TODAY
//         </span>
//       )}
//     </div>

//     {/* Events */}
//     <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
//       {events.length === 0 ? (
//         <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
//           <FiPlus size={14} style={{ color: "#334155" }} />
//         </div>
//       ) : (
//         events.map((ev) => (
//           <EventCard key={ev._id} event={ev} onClick={onEventClick} />
//         ))
//       )}
//     </div>

//     {/* Event count badge */}
//     {events.length > 0 && (
//       <div className="px-2 pb-2 text-center">
//         <span className="text-[9px]" style={{ color: "#334155" }}>
//           {events.length} event{events.length > 1 ? "s" : ""}
//         </span>
//       </div>
//     )}
//   </div>
// );

// // ─── Filter Pill ──────────────────────────────────────────────────────────────

// const FilterPill = ({ label, active, color, onClick }) => (
//   <button
//     onClick={onClick}
//     className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
//     style={{
//       background: active
//         ? color
//           ? `${color}22`
//           : "rgba(59,130,246,0.2)"
//         : "rgba(255,255,255,0.04)",
//       border: `1px solid ${active ? color || "#3B82F6" : "rgba(255,255,255,0.08)"}`,
//       color: active ? color || "#93C5FD" : "#64748B",
//     }}
//   >
//     {color && (
//       <span
//         className="w-1.5 h-1.5 rounded-full"
//         style={{ background: color }}
//       />
//     )}
//     {label}
//   </button>
// );

// // ─── Main Calendar ────────────────────────────────────────────────────────────

// const Calendar = () => {
//   const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTypes, setActiveTypes] = useState(new Set(EVENT_TYPES));
//   const [showFilters, setShowFilters] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null); // null = create
//   const [defaultDate, setDefaultDate] = useState(null);
//   const abortRef = useRef(null);

//   // ── Build the 7 day columns ─────────────────────────────────────────────────
//   const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
//   const today = new Date();

//   // ── Fetch ───────────────────────────────────────────────────────────────────
//   const fetchEvents = useCallback(async () => {
//     if (abortRef.current) abortRef.current.abort();
//     abortRef.current = new AbortController();

//     setLoading(true);
//     try {
//       const typeParam = [...activeTypes].join(",");
//       const { data } = await axios.get(`${API}/calendar/week`, {
//         params: { weekStart: toYMD(weekStart), type: typeParam },
//         withCredentials: true,
//         signal: abortRef.current.signal,
//       });
//       setEvents(data.events || []);
//     } catch (err) {
//       if (axios.isCancel(err)) return;
//       toast.error("Failed to load calendar events");
//     } finally {
//       setLoading(false);
//     }
//   }, [weekStart, activeTypes]);

//   useEffect(() => {
//     fetchEvents();
//   }, [fetchEvents]);

//   // ── Navigation ──────────────────────────────────────────────────────────────
//   const navigate = (dir) => setWeekStart((w) => addDays(w, dir * 7));
//   const goToday = () => setWeekStart(getMondayOf(new Date()));

//   // ── Type filter toggle ──────────────────────────────────────────────────────
//   const toggleType = (type) => {
//     setActiveTypes((prev) => {
//       const next = new Set(prev);
//       next.has(type) ? next.delete(type) : next.add(type);
//       return next.size === 0 ? prev : next; // always keep at least 1
//     });
//   };

//   // ── Modal handlers ──────────────────────────────────────────────────────────
//   const openCreate = (date) => {
//     setSelectedEvent(null);
//     setDefaultDate(date || new Date());
//     setModalOpen(true);
//   };

//   const openEdit = (event) => {
//     setSelectedEvent(event);
//     setDefaultDate(null);
//     setModalOpen(true);
//   };

//   const handleSaved = () => {
//     setModalOpen(false);
//     fetchEvents();
//   };
//   const handleDeleted = () => {
//     setModalOpen(false);
//     fetchEvents();
//   };

//   // ── Events for a given day (considering multi-day spans) ────────────────────
//   const eventsForDay = (date) =>
//     events.filter(
//       (ev) =>
//         activeTypes.has(ev.type) && isInRange(date, ev.startDate, ev.endDate),
//     );

//   // ── Header label ────────────────────────────────────────────────────────────
//   const weekEnd = addDays(weekStart, 6);
//   const headerLabel =
//     weekStart.getMonth() === weekEnd.getMonth()
//       ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
//       : `${MONTH_NAMES[weekStart.getMonth()]} – ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

//   const weekRange = `${fmt(weekStart, { day: "numeric", month: "short" })} – ${fmt(weekEnd, { day: "numeric", month: "short", year: "numeric" })}`;

//   // ── Summary stats ───────────────────────────────────────────────────────────
//   const weekEvents = events.filter((ev) => activeTypes.has(ev.type));
//   const highPriority = weekEvents.filter((ev) => ev.priority === "High").length;

//   // ────────────────────────────────────────────────────────────────────────────
//   return (
//     <div
//       className="flex flex-col h-full rounded-2xl overflow-hidden"
//       style={{
//         fontFamily: "'Sora', 'DM Sans', sans-serif",
//         background: "linear-gradient(145deg, #0D1117 0%, #0F172A 100%)",
//         border: "1px solid rgba(255,255,255,0.06)",
//         boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
//         minHeight: 640,
//       }}
//     >
//       {/* ── Stats bar ─────────────────────────────────────────────────────── */}
//       <div
//         className="flex items-center gap-6 px-6 py-2.5"
//         style={{
//           borderBottom: "1px solid rgba(255,255,255,0.04)",
//           background: "rgba(0,0,0,0.2)",
//         }}
//       >
//         <div className="flex items-center gap-2">
//           <FiCalendar size={11} style={{ color: "#475569" }} />
//           <span className="text-xs font-semibold" style={{ color: "#475569" }}>
//             {weekRange}
//           </span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
//           <span className="text-xs" style={{ color: "#475569" }}>
//             <span style={{ color: "#CBD5E1", fontWeight: 700 }}>
//               {weekEvents.length}
//             </span>{" "}
//             events this week
//           </span>
//         </div>
//         {highPriority > 0 && (
//           <div className="flex items-center gap-1.5">
//             <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
//             <span className="text-xs" style={{ color: "#475569" }}>
//               <span style={{ color: "#FCA5A5", fontWeight: 700 }}>
//                 {highPriority}
//               </span>{" "}
//               high priority
//             </span>
//           </div>
//         )}
//         {loading && (
//           <div className="ml-auto">
//             <FiRefreshCw
//               size={12}
//               style={{ color: "#334155", animation: "spin 1s linear infinite" }}
//             />
//           </div>
//         )}
//       </div>

//       {/* ── Toolbar ───────────────────────────────────────────────────────── */}
//       <div
//         className="flex items-center justify-between gap-4 px-6 py-4 flex-wrap"
//         style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
//       >
//         {/* Left: nav */}
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => navigate(-1)}
//             className="p-2 rounded-xl transition-all hover:bg-white/5"
//             style={{
//               border: "1px solid rgba(255,255,255,0.07)",
//               color: "#64748B",
//             }}
//           >
//             <FiChevronLeft size={16} />
//           </button>

//           <div className="min-w-40 text-center">
//             <div
//               className="text-base font-black"
//               style={{ color: "#F1F5F9", letterSpacing: "-0.02em" }}
//             >
//               {headerLabel}
//             </div>
//           </div>

//           <button
//             onClick={() => navigate(1)}
//             className="p-2 rounded-xl transition-all hover:bg-white/5"
//             style={{
//               border: "1px solid rgba(255,255,255,0.07)",
//               color: "#64748B",
//             }}
//           >
//             <FiChevronRight size={16} />
//           </button>

//           <button
//             onClick={goToday}
//             className="ml-1 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
//             style={{
//               background: "rgba(59,130,246,0.15)",
//               border: "1px solid rgba(59,130,246,0.3)",
//               color: "#93C5FD",
//             }}
//           >
//             Today
//           </button>
//         </div>

//         {/* Right: filters + add */}
//         <div className="flex items-center gap-2">
//           {/* Filter toggle */}
//           <button
//             onClick={() => setShowFilters((v) => !v)}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
//             style={{
//               background: showFilters
//                 ? "rgba(255,255,255,0.08)"
//                 : "transparent",
//               border: "1px solid rgba(255,255,255,0.07)",
//               color: showFilters ? "#CBD5E1" : "#64748B",
//             }}
//           >
//             <FiFilter size={12} /> Filter
//             {activeTypes.size < EVENT_TYPES.length && (
//               <span
//                 className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
//                 style={{ background: "#3B82F6", color: "#fff" }}
//               >
//                 {activeTypes.size}
//               </span>
//             )}
//           </button>

//           {/* Add event */}
//           <button
//             onClick={() => openCreate(new Date())}
//             className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
//             style={{
//               background: "linear-gradient(135deg, #3B82F6, #2563EB)",
//               color: "#fff",
//               boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
//             }}
//           >
//             <FiPlus size={15} /> Add Event
//           </button>
//         </div>
//       </div>

//       {/* ── Filter bar ────────────────────────────────────────────────────── */}
//       {showFilters && (
//         <div
//           className="flex items-center gap-2 px-6 py-3 flex-wrap"
//           style={{
//             borderBottom: "1px solid rgba(255,255,255,0.04)",
//             background: "rgba(0,0,0,0.15)",
//           }}
//         >
//           <span
//             className="text-[10px] font-bold uppercase tracking-widest mr-1"
//             style={{ color: "#334155" }}
//           >
//             Type
//           </span>
//           {EVENT_TYPES.map((type) => (
//             <FilterPill
//               key={type}
//               label={type}
//               active={activeTypes.has(type)}
//               color={TYPE_CFG[type]?.color}
//               onClick={() => toggleType(type)}
//             />
//           ))}
//           {activeTypes.size < EVENT_TYPES.length && (
//             <button
//               onClick={() => setActiveTypes(new Set(EVENT_TYPES))}
//               className="text-[10px] underline ml-1"
//               style={{ color: "#475569" }}
//             >
//               Reset
//             </button>
//           )}
//         </div>
//       )}

//       {/* ── Type legend ───────────────────────────────────────────────────── */}
//       <div
//         className="flex items-center gap-5 px-6 py-2 flex-wrap"
//         style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
//       >
//         {EVENT_TYPES.map((type) => (
//           <span key={type} className="flex items-center gap-1.5">
//             <span
//               className="w-2 h-2 rounded-full"
//               style={{ background: TYPE_CFG[type].color }}
//             />
//             <span
//               className="text-[10px] font-semibold"
//               style={{ color: "#475569" }}
//             >
//               {type}
//             </span>
//           </span>
//         ))}
//       </div>

//       {/* ── Week grid ─────────────────────────────────────────────────────── */}
//       <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
//         {weekDays.map((date) => (
//           <DayColumn
//             key={date.toISOString()}
//             date={date}
//             events={eventsForDay(date)}
//             isToday={isSameDay(date, today)}
//             onClick={openCreate}
//             onEventClick={openEdit}
//           />
//         ))}
//       </div>

//       {/* ── Empty state overlay ────────────────────────────────────────────── */}
//       {!loading && weekEvents.length === 0 && (
//         <div
//           className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
//           style={{ top: "40%" }}
//         >
//           <FiCalendar size={32} style={{ color: "#1E293B" }} />
//           <p
//             className="mt-3 text-sm font-semibold"
//             style={{ color: "#1E293B" }}
//           >
//             No events this week
//           </p>
//           <p className="text-xs mt-1" style={{ color: "#0F172A" }}>
//             Click any day column or "+ Add Event" to create one
//           </p>
//         </div>
//       )}

//       {/* ── Modal ─────────────────────────────────────────────────────────── */}
//       {modalOpen && (
//         <Event
//           isOpen={modalOpen}
//           event={selectedEvent}
//           defaultDate={defaultDate}
//           onClose={() => setModalOpen(false)}
//           onSaved={handleSaved}
//           onDeleted={handleDeleted}
//         />
//       )}

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//       `}</style>
//     </div>
//   );
// };

// export default Calendar;

import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";

const academicYears = [
  {
    _id: "1",
    name: "2025-26",
    startDate: "2025-04-01",
    endDate: "2026-03-31",
    isActive: true,
  },
];

const eventsData = [
  {
    _id: "e1",
    title: "Annual Sports Day",
    type: "Sports",
    priority: "High",
    startDate: "2025-08-15",
    time: "10:00 AM",
    location: "School Ground",
    description: "Annual sports competition",
  },
  {
    _id: "e2",
    title: "Science Exhibition",
    type: "Competition",
    priority: "Normal",
    startDate: "2025-09-10",
    time: "09:00 AM",
    location: "Hall",
    description: "Student projects showcase",
  },
  {
    _id: "e3",
    title: "Diwali Celebration",
    type: "Cultural",
    priority: "Low",
    startDate: "2025-10-25",
    time: "11:00 AM",
    location: "Auditorium",
    description: "Festival celebration",
  },
];

const months = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

export default function Calendar() {
  const [selectedYear, setSelectedYear] = useState(academicYears[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  useEffect(() => {
    const filtered = eventsData.filter((event) => {
      const date = new Date(event.startDate);
      return (
        date >= new Date(selectedYear.startDate) &&
        date <= new Date(selectedYear.endDate)
      );
    });
    setEvents(filtered);
  }, [selectedYear]);

  const daysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();

  const getEventsForDate = (date) =>
    events.filter(
      (e) => new Date(e.startDate).toDateString() === date.toDateString()
    );

  const handleDateClick = (date) => {
    const dayEvents = getEventsForDate(date);
    setSelectedDateEvents(dayEvents);
    if (dayEvents.length === 0) toast.info("No events");
  };

  const getColor = (type) => {
    if (type === "Sports") return "bg-green-500";
    if (type === "Cultural") return "bg-purple-500";
    if (type === "Competition") return "bg-blue-500";
    return "bg-gray-500";
  };

  const renderCalendar = () => {
    const year = new Date(selectedYear.startDate).getFullYear();
    const totalDays = daysInMonth(selectedMonth, year);

    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, selectedMonth, day);
      const dayEvents = getEventsForDate(date);

      return (
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className="border rounded-xl p-2 h-24 cursor-pointer hover:bg-blue-50"
        >
          <div className="font-semibold">{day}</div>

          <div className="mt-1 space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event._id}
                className={`text-xs px-1 rounded text-white ${getColor(event.type)}`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">School Calendar</h2>

        <select
          value={selectedYear._id}
          onChange={(e) =>
            setSelectedYear(
              academicYears.find((y) => y._id === e.target.value)
            )
          }
          className="border px-3 py-2 rounded-lg"
        >
          {academicYears.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSelectedMonth((m) => (m === 0 ? 11 : m - 1))}>
          <FaChevronLeft />
        </button>

        <h3 className="text-lg font-semibold">
          {months[selectedMonth]}
        </h3>

        <button onClick={() => setSelectedMonth((m) => (m === 11 ? 0 : m + 1))}>
          <FaChevronRight />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {renderCalendar()}
      </div>

      {/* Events Panel */}
      {selectedDateEvents.length > 0 && (
        <div className="mt-6 p-4 border rounded-xl">
          <h4 className="font-bold mb-2">Events</h4>
          {selectedDateEvents.map((event) => (
            <div key={event._id} className="mb-2">
              <div className="font-semibold">{event.title}</div>
              <div className="text-sm text-gray-600">
                {event.time} | {event.location}
              </div>
              <div className="text-sm">{event.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}