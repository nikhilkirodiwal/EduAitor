import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const Teachers = () => {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teachers`);
      setTeachers(res.data.data);
    } catch {
      console.error("Failed to load teachers");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const totalTeachers = teachers.length;

  const present = teachers.filter((t) => t.status === "Present").length;

  const avgExperience =
    teachers.reduce((a, b) => a + Number(b.experience || 0), 0) /
    (teachers.length || 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen">
      {/* HEADER */}

      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teachers</h1>

          <p className="text-gray-500 text-sm sm:text-base">
            Good Afternoon, Dr. Rajesh Kumar! Welcome to the Teachers panel.
          </p>
        </div>

        <button
          onClick={() => navigate("/school/teacher-manage")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-green-700"
        >
          <FaPlus />
          Add Teacher
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat title="TOTAL TEACHERS" value={totalTeachers} />
        <Stat title="PRESENT" value={present} />
        <Stat
          title="AVG EXPERIENCE"
          value={`${avgExperience.toFixed(1)} yrs`}
        />
        <Stat title="AVG RATING" value="4.1 ★" />
      </div>

      {/* DIRECTORY HEADER */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Faculty Directory</h2>

        <select className="border rounded-lg px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-indigo-500">
          <option>All Classes</option>
        </select>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Teacher</th>
                <th className="p-4 text-left">Department</th>
                <th className="p-4 text-left">Subject</th>
                <th className="p-4 text-left">Experience</th>
                <th className="p-4 text-left">Rating</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="border-t hover:bg-gray-50">
                  {/* TEACHER */}

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {teacher.fullName?.charAt(0)}
                      </div>

                      <div>
                        <p className="font-medium">{teacher.fullName}</p>

                        <p className="text-gray-400 text-xs">
                          {teacher.teacherId}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">{teacher.department}</td>

                  <td className="p-4">{teacher.subject}</td>

                  <td className="p-4">{teacher.experience} years</td>

                  <td className="p-4">⭐ {teacher.rating}</td>

                  <td className="p-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                      {teacher.status || "Present"}
                    </span>
                  </td>

                  {/* ACTIONS */}

                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        navigate(`/school/teacher-view/${teacher._id}`)
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded mr-2 hover:bg-blue-200"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/school/teacher-manage/${teacher._id}`)
                      }
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {teachers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Teachers;

/* STAT CARD */

const Stat = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <p className="text-xs sm:text-sm text-gray-500">{title}</p>

    <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
  </div>
);
