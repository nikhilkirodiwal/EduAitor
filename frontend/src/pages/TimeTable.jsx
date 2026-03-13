import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaSave,
  FaEdit,
  FaClock,
  FaPlus,
  FaTrash,
  FaUserTie,
  FaBook,
} from "react-icons/fa";
import { MdOutlineClass, MdEventNote } from "react-icons/md";

const API = import.meta.env.VITE_API_URL;
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimeTable() {
  const [classes, setClasses] = useState([]); // Now includes combined Class-Section name
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [classId, setClassId] = useState("");
  const [isEditMode, setIsEditMode] = useState(true);

  // Step 1: Define Fixed Periods (Time Slots)
  const [periodConfigs, setPeriodConfigs] = useState([
    { id: "P1", name: "Period 1", start: "08:00", end: "08:45" },
    { id: "P2", name: "Period 2", start: "08:45", end: "09:30" },
  ]);

  // Step 2: Assignments { Day: { PeriodID: { subjectId, teacherId } } }
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cls, sub, tea] = await Promise.all([
        axios.get(`${API}/classes/all`), // Backend should return "Grade 10 - A" format
        axios.get(`${API}/subjects/all`),
        axios.get(`${API}/teachers`),
      ]);
      setClasses(cls.data.classes);
      setSubjects(sub.data.subjects);
      setTeachers(tea.data.data);
    } catch {
      toast.error("Error loading ERP data");
    }
  };

  const addPeriodSlot = () => {
    const nextId = `P${periodConfigs.length + 1}`;
    setPeriodConfigs([
      ...periodConfigs,
      { id: nextId, name: `Period ${nextId.slice(1)}`, start: "", end: "" },
    ]);
  };

  const updateAssignment = (day, pId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [day]: { ...prev[day], [pId]: { ...prev[day]?.[pId], [field]: value } },
    }));
  };

  const saveDraft = async () => {
    if (!classId) return toast.warning("Select a Class first");
    try {
      await axios.post(`${API}/timetable/save`, {
        classId,
        periodConfigs,
        assignments,
      });
      toast.success("Timetable locked and saved");
      setIsEditMode(false);
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <MdOutlineClass className="text-3xl text-indigo-600" />
          <select
            className="border-none bg-slate-100 p-3 rounded-xl font-bold text-slate-700 w-full md:w-64 focus:ring-2 focus:ring-indigo-500"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c?.sectionId?.name ? `- ${c.sectionId.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {isEditMode ? (
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 shadow-md transition-all"
            >
              <FaSave /> Save & View
            </button>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-md transition-all"
            >
              <FaEdit /> Edit Schedule
            </button>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="space-y-8">
          {/* STEP 1: DEFINE TIME PERIODS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FaClock className="text-indigo-500" /> Step 1: Define Period
                Timings
              </h3>
              <button
                onClick={addPeriodSlot}
                className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:underline"
              >
                <FaPlus size={12} /> Add Period
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {periodConfigs.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2 relative group"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {p.name}
                  </span>
                  <input
                    type="time"
                    className="text-xs border-none rounded p-1"
                    value={p.start}
                    onChange={(e) => {
                      const newCfg = [...periodConfigs];
                      newCfg[idx].start = e.target.value;
                      setPeriodConfigs(newCfg);
                    }}
                  />
                  <input
                    type="time"
                    className="text-xs border-none rounded p-1"
                    value={p.end}
                    onChange={(e) => {
                      const newCfg = [...periodConfigs];
                      newCfg[idx].end = e.target.value;
                      setPeriodConfigs(newCfg);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: ASSIGNMENT CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {days.map((day) => (
              <div
                key={day}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-800 text-white p-4 font-bold tracking-widest text-center">
                  {day}
                </div>
                <div className="p-4 space-y-3">
                  {periodConfigs.map((p) => (
                    <div
                      key={p.id}
                      className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="w-16 text-[10px] font-bold text-slate-500 text-center border-r border-slate-200">
                        {p.name}
                        <br />
                        {p.start || "--"}
                      </div>
                      <div className="grow grid grid-cols-1 gap-1">
                        <select
                          className="text-[11px] border-none bg-white rounded p-1 shadow-sm"
                          value={assignments[day]?.[p.id]?.subjectId || ""}
                          onChange={(e) =>
                            updateAssignment(
                              day,
                              p.id,
                              "subjectId",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Subject</option>
                          {subjects.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="text-[11px] border-none bg-white rounded p-1 shadow-sm"
                          value={assignments[day]?.[p.id]?.teacherId || ""}
                          onChange={(e) =>
                            updateAssignment(
                              day,
                              p.id,
                              "teacherId",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Teacher</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SAVED VIEW: TRADITIONAL TIMETABLE GRID */
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-5 border-r border-slate-700 text-left min-w-30">
                  Period / Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-5 font-bold uppercase tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodConfigs.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 border-r border-slate-100">
                    <div className="font-bold text-indigo-600 text-sm">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono italic">
                      {p.start} - {p.end}
                    </div>
                  </td>
                  {days.map((day) => {
                    const data = assignments[day]?.[p.id];
                    const subName = subjects.find(
                      (s) => s._id === data?.subjectId,
                    )?.name;
                    const teaName = teachers.find(
                      (t) => t._id === data?.teacherId,
                    )?.fullName;
                    return (
                      <td key={day} className="p-4 min-w-37.5">
                        {data?.subjectId ? (
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                              <FaBook size={10} className="text-indigo-400" />{" "}
                              {subName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <FaUserTie size={10} className="text-slate-300" />{" "}
                              {teaName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">
                            No Class
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
