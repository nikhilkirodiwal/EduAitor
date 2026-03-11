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

  const present = Math.floor(totalStudents * 0.64); // demo stat

  const classes = [...new Set(students.map((s) => s.className))];

  const filteredStudents = selectedClass
    ? students.filter((s) => s.className === selectedClass)
    : [];

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Students</h1>
        <p className="text-slate-500">
          Good Morning, Dr. Rajesh Kumar! Welcome to the Students panel.
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <FaUsers size={20} />
          </div>

          <div>
            <p className="text-sm text-gray-500">TOTAL STUDENTS</p>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <MdPersonOutline size={20} />
          </div>

          <div>
            <p className="text-sm text-gray-500">PRESENT</p>
            <p className="text-2xl font-bold">{present}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <PiChartPieSliceBold size={20} />
          </div>

          <div>
            <p className="text-sm text-gray-500">MALE / FEMALE</p>
            <p className="text-2xl font-bold">
              {maleCount} / {femaleCount}
            </p>
          </div>
        </div>
      </div>

      {/* CLASS SELECT */}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="text-sm mb-2 font-medium">Select Class</p>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border rounded-lg px-4 py-2 w-75"
        >
          <option value="">-- Select a Class --</option>

          {classes.map((cls) => (
            <option key={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* STUDENT DIRECTORY */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Student Directory
        </h2>

        <button
          onClick={() => navigate("/school/student-manage")}
          className="flex items-center gap-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white px-5 py-2 rounded-lg shadow"
        >
          <FaPlus />
          New Admission
        </button>
      </div>

      {/* DIRECTORY BOX */}

      <div className="bg-white rounded-xl shadow p-8 min-h-62.5">
        {!selectedClass && (
          <div className="flex flex-col items-center justify-center h-50 text-gray-400">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
              className="w-12 mb-3 opacity-50"
            />

            <p>Select a class to view students</p>
          </div>
        )}

        {selectedClass && (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Class</th>
                <th className="p-4 text-left">Father</th>
                <th className="p-4 text-left">Mobile</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-t">
                  <td className="p-4 font-medium">
                    {student.firstName} {student.lastName}
                  </td>

                  <td className="p-4">{student.className}</td>

                  <td className="p-4">{student.fatherName}</td>

                  <td className="p-4">{student.fatherMobile}</td>

                  {/* ACTIONS */}

                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      {/* VIEW */}

                      <button
                        onClick={() =>
                          navigate(`/school/student-view/${student._id}`)
                        }
                        className="bg-blue-100 text-blue-600 p-2 rounded-md hover:bg-blue-200"
                      >
                        <FaEye />
                      </button>

                      {/* EDIT */}

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
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Students;
