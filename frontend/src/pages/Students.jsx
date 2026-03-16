import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaEye, FaEdit, FaUsers } from "react-icons/fa";
import { MdPersonOutline } from "react-icons/md";
import { PiChartPieSliceBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const Students = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data.data);
    } catch {
      toast.error("Failed to load students");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= STATS ================= */

  const totalStudents = students.length;

  const maleCount = students.filter((s) => s.gender === "Male").length;
  const femaleCount = students.filter((s) => s.gender === "Female").length;

  const present = Math.floor(totalStudents * 0.64);

  const classes = [...new Set(students.map((s) => s.className))];

  const filteredStudents = selectedClass
    ? students.filter((s) => s.className === selectedClass)
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Students
          </h1>

          <p className="text-sm sm:text-base text-slate-500">
            Good Morning, Dr. Rajesh Kumar! Welcome to the Students panel.
          </p>
        </div>

        <button
          onClick={() => navigate("/school/student-manage")}
          className="flex items-center gap-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-lg shadow hover:opacity-90"
        >
          <FaPlus />
          New Admission
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="TOTAL STUDENTS"
          value={totalStudents}
          icon={<FaUsers size={20} />}
          color="blue"
        />

        <StatCard
          title="PRESENT"
          value={present}
          icon={<MdPersonOutline size={20} />}
          color="green"
        />

        <StatCard
          title="MALE / FEMALE"
          value={`${maleCount} / ${femaleCount}`}
          icon={<PiChartPieSliceBold size={20} />}
          color="purple"
        />
      </div>

      {/* CLASS FILTER */}

      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
        <p className="text-sm font-medium mb-2 text-gray-700">Select Class</p>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full sm:w-72 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">-- Select a Class --</option>

          {classes.map((cls) => (
            <option key={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* DIRECTORY */}

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-700">
            Student Directory
          </h2>
        </div>

        {!selectedClass && (
          <EmptyState text="Select a class to view students" />
        )}

        {selectedClass && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Father</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {student.firstName} {student.lastName}
                    </td>

                    <td className="p-3">{student.className}</td>

                    <td className="p-3">{student.fatherName}</td>

                    <td className="p-3">{student.fatherMobile}</td>

                    <td className="p-3">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() =>
                            navigate(`/school/student-view/${student._id}`)
                          }
                          className="bg-blue-100 text-blue-600 p-2 rounded-md hover:bg-blue-200"
                        >
                          <FaEye />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/school/student-manage/${student._id}`)
                          }
                          className="bg-green-100 text-green-600 p-2 rounded-md hover:bg-green-200"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;

/* ================= COMPONENTS ================= */

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
      <div className={`${colors[color]} p-3 rounded-lg`}>{icon}</div>

      <div>
        <p className="text-xs sm:text-sm text-gray-500">{title}</p>

        <p className="text-xl sm:text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <img
      src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
      className="w-14 mb-3 opacity-50"
    />

    <p className="text-sm sm:text-base">{text}</p>
  </div>
);
