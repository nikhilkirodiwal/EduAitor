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
  FaCoffee,
  FaRunning,
} from "react-icons/fa";
import { MdOutlineClass } from "react-icons/md";

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
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classId, setClassId] = useState("");
  const [isEditMode, setIsEditMode] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Period Configuration (Timings)
  const [periodConfigs, setPeriodConfigs] = useState([
    { id: "P1", name: "Period 1", start: "08:00", end: "08:45" },
    { id: "P2", name: "Period 2", start: "08:45", end: "09:30" },
    { id: "P3", name: "Period 3", start: "09:30", end: "10:15" },
  ]);

  // Assignments structure: { Monday: { P1: { type, subjectId, teacherId, customName } } }
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  // Fetch timetable when classId changes
  useEffect(() => {
    if (classId) fetchTimetableByClass();
  }, [classId]);

  const loadData = async () => {
    try {
      const [cls, sub, tea] = await Promise.all([
        axios.get(`${API}/classes/all`),
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

  const fetchTimetableByClass = async () => {
    try {
      const res = await axios.get(`${API}/timetable/${classId}`);
      if (res.data.data) {
        setPeriodConfigs(res.data.data.periodConfigs || []);
        setAssignments(res.data.data.assignments || {});
        setIsEditMode(false);
      } else {
        setAssignments({});
        setIsEditMode(true);
      }
    } catch (err) {
      console.log("No existing timetable found for this class");
    }
  };

  const addPeriodSlot = () => {
    const nextId = `P${Date.now()}`; // Unique ID
    setPeriodConfigs([
      ...periodConfigs,
      { id: nextId, name: `New Period`, start: "", end: "" },
    ]);
  };

  const deletePeriodSlot = (id) => {
    setPeriodConfigs((prev) => prev.filter((p) => p.id !== id));
    // Also clean assignments for this deleted period
    const newAssignments = { ...assignments };
    days.forEach((day) => {
      if (newAssignments[day]) delete newAssignments[day][id];
    });
    setAssignments(newAssignments);
  };

  const updateAssignment = (day, pId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [pId]: { ...(prev[day]?.[pId] || { type: "lecture" }), [field]: value },
      },
    }));

    setHasChanges(true);
  };

  const saveDraft = async () => {
    if (!classId) return toast.warning("Select a Class first");
    try {
      await axios.post(`${API}/timetable/save`, {
        classId,
        periodConfigs,
        assignments,
      });
      toast.success("Timetable saved successfully");
      setIsEditMode(false);
    } catch {
      toast.error("Save failed");
    }
  };

  const getCellStyle = (data) => {
    if (data?.type === "lecture" && !data?.teacherId) {
      return "bg-red-50 border border-red-200";
    }

    if (data?.status === "teacher-absent") {
      return "bg-yellow-50 border border-yellow-300";
    }

    return "";
  };

  const saveTeacherUpdate = async () => {
    try {
      await axios.post(`${API}/timetable/save`, {
        classId,
        periodConfigs,
        assignments,
      });

      toast.success("Teacher assignment updated");

      setHasChanges(false);

      fetchTimetableByClass();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <MdOutlineClass className="text-3xl text-indigo-600" />

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Select Class & Section
            </label>

            <select
              className="border-none bg-slate-100 p-3 rounded-xl font-bold text-slate-700 w-full sm:w-72 lg:w-80"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Choose Class</option>

              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c?.sectionId?.name ? `- ${c.sectionId.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 shadow-md"
            >
              <FaSave /> Save Draft
            </button>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-md"
            >
              <FaEdit /> Edit Timetable
            </button>
          )}
        </div>
      </div>

      {!classId ? (
        <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
          <MdOutlineClass className="text-5xl text-indigo-500 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-slate-700">
            Please Select a Class
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Choose a class to create or view timetable
          </p>
        </div>
      ) : (
        <>
          {isEditMode ? (
            <div className="space-y-8">
              {/* STEP 1: TIME PERIODS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FaClock className="text-indigo-500" /> 1. Define Standard
                    Period Timings
                  </h3>
                  <button
                    onClick={addPeriodSlot}
                    className="text-indigo-600 font-bold text-sm flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-lg"
                  >
                    <FaPlus /> Add Period
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {periodConfigs.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 rounded-xl border relative group w-full"
                    >
                      <button
                        onClick={() => deletePeriodSlot(p.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <FaTrash size={10} />
                      </button>
                      <input
                        type="text"
                        className="text-[10px] font-bold text-slate-400 uppercase w-full bg-transparent border-none p-0 mb-1"
                        value={p.name}
                        onChange={(e) => {
                          const newCfg = [...periodConfigs];
                          newCfg[idx].name = e.target.value;
                          setPeriodConfigs(newCfg);
                        }}
                      />
                      <div className="space-y-1">
                        <input
                          type="time"
                          className="text-xs w-full p-1 rounded border border-slate-200"
                          value={p.start}
                          onChange={(e) => {
                            const newCfg = [...periodConfigs];
                            newCfg[idx].start = e.target.value;
                            setPeriodConfigs(newCfg);
                          }}
                        />
                        <input
                          type="time"
                          className="text-xs w-full p-1 rounded border border-slate-200"
                          value={p.end}
                          onChange={(e) => {
                            const newCfg = [...periodConfigs];
                            newCfg[idx].end = e.target.value;
                            setPeriodConfigs(newCfg);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 2: ASSIGNMENTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {days.map((day) => (
                  <div
                    key={day}
                    className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                  >
                    <div className="bg-slate-800 text-white p-3 font-bold text-center uppercase tracking-widest">
                      {day}
                    </div>
                    <div className="p-4 space-y-4">
                      {periodConfigs.map((p) => {
                        const data = assignments[day]?.[p.id] || {
                          type: "lecture",
                        };
                        return (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-50 rounded-xl border space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-extrabold text-indigo-600">
                                {p.name}
                              </span>
                              <select
                                className="text-[10px] font-bold border rounded p-1 bg-white"
                                value={data.type}
                                onChange={(e) =>
                                  updateAssignment(
                                    day,
                                    p.id,
                                    "type",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="lecture">Lecture</option>
                                <option value="lunch">Lunch/Break</option>
                                <option value="activity">Activity</option>
                              </select>
                            </div>

                            {data.type === "lecture" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <select
                                  className="text-xs p-2 border rounded bg-white shadow-sm"
                                  value={data.subjectId || ""}
                                  onChange={(e) =>
                                    updateAssignment(
                                      day,
                                      p.id,
                                      "subjectId",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select Subject</option>
                                  {subjects.map((s) => (
                                    <option key={s._id} value={s._id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="text-xs p-2 border rounded bg-white shadow-sm"
                                  value={data.teacherId || ""}
                                  onChange={(e) =>
                                    updateAssignment(
                                      day,
                                      p.id,
                                      "teacherId",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select Teacher</option>
                                  {teachers.map((t) => (
                                    <option key={t._id} value={t._id}>
                                      {t.fullName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {data.type === "activity" && (
                              <input
                                type="text"
                                placeholder="e.g. Sports, Assembly"
                                className="text-xs p-2 w-full border rounded bg-white"
                                value={data.customName || ""}
                                onChange={(e) =>
                                  updateAssignment(
                                    day,
                                    p.id,
                                    "customName",
                                    e.target.value,
                                  )
                                }
                              />
                            )}

                            {data.type === "lunch" && (
                              <div className="flex items-center justify-center gap-2 py-2 text-orange-600 font-bold text-[10px] italic bg-orange-50 rounded">
                                <FaCoffee /> LUNCH BREAK
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SAVED VIEW GRID */
            <>
              {hasChanges && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={saveTeacherUpdate}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow"
                  >
                    Save Teacher Substitution
                  </button>
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-x-auto w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-4 sm:p-5 border-r border-slate-700 text-left min-w-35">
                        Time Slot
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
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4 border-r bg-slate-50/50">
                          <div className="font-bold text-indigo-600 text-sm">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.start} - {p.end}
                          </div>
                        </td>
                        {days.map((day) => {
                          const data = assignments[day]?.[p.id];
                          return (
                            <td
                              key={day}
                              className={`p-3 sm:p-4 min-w-40 sm:min-w-45 text-center ${getCellStyle(data)}`}
                            >
                              {data?.type === "lecture" ? (
                                <div className="text-left">
                                  {/* SUBJECT */}
                                  {data?.subjectId && (
                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                      <FaBook
                                        size={10}
                                        className="text-indigo-400"
                                      />
                                      {
                                        subjects.find(
                                          (s) => s._id === data.subjectId,
                                        )?.name
                                      }
                                    </div>
                                  )}

                                  {/* TEACHER */}
                                  {data?.teacherId ? (
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <FaUserTie
                                        size={10}
                                        className="text-slate-300"
                                      />
                                      {
                                        teachers.find(
                                          (t) => t._id === data.teacherId,
                                        )?.fullName
                                      }
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-[10px] text-red-600 font-bold">
                                        No Teacher Assigned
                                      </div>

                                      <select
                                        className="mt-1 text-[10px] border rounded p-1 w-full"
                                        onChange={(e) =>
                                          updateAssignment(
                                            day,
                                            p.id,
                                            "teacherId",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option>Select Teacher</option>
                                        {teachers.map((t) => (
                                          <option key={t._id} value={t._id}>
                                            {t.fullName}
                                          </option>
                                        ))}
                                      </select>
                                    </>
                                  )}

                                  {/* SUBSTITUTE TEACHER */}
                                  {data?.status === "teacher-absent" && (
                                    <>
                                      <div className="text-[10px] text-yellow-600 font-bold mt-1">
                                        Teacher Absent
                                      </div>

                                      <select
                                        className="mt-1 text-[10px] border rounded p-1 w-full"
                                        onChange={(e) =>
                                          updateAssignment(
                                            day,
                                            p.id,
                                            "substituteTeacherId",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option>Select Substitute</option>
                                        {teachers.map((t) => (
                                          <option key={t._id} value={t._id}>
                                            {t.fullName}
                                          </option>
                                        ))}
                                      </select>
                                    </>
                                  )}
                                </div>
                              ) : data?.type === "lunch" ? (
                                <span className="text-[10px] font-bold text-orange-400 uppercase italic">
                                  Lunch Break
                                </span>
                              ) : data?.type === "activity" ? (
                                <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                                  <FaRunning /> {data.customName}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">
                                  Free
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
            </>
          )}
        </>
      )}
    </div>
  );
}
