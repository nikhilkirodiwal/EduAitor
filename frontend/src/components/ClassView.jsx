import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaEdit,
  FaSchool,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
} from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

export default function ClassView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClass = async () => {
    try {
      const { data } = await axios.get(`${API}/classes/all`);

      const found = data.classes.find((c) => c._id === id);

      setClassData(found);
    } catch {
      toast.error("Failed to load class");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClass();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading class...</div>;
  }

  if (!classData) {
    return <div className="p-10 text-center">Class not found</div>;
  }

  const percent = classData.capacity
    ? (classData.studentCount / classData.capacity) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/school/class")}
          className="flex items-center gap-2 text-indigo-600 font-medium"
        >
          <FaArrowLeft /> Back to Classes
        </button>

    
      </div>

      {/* CLASS HEADER CARD */}

      <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
          {classData.name}
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Class {classData.name}</h2>

          <p className="text-gray-500">Room {classData.roomNumber}</p>
        </div>
      </div>

      {/* DETAILS GRID */}

      <div className="grid grid-cols-3 gap-6">
        {/* TEACHER */}

        <div className="bg-white rounded-xl shadow p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FaChalkboardTeacher />
            <span className="font-medium">Class Teacher</span>
          </div>

          <p className="text-gray-600">
            {classData.teacherId?.fullName || "Not Assigned"}
          </p>
        </div>

        {/* SECTION */}

        <div className="bg-white rounded-xl shadow p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FaSchool />
            <span className="font-medium">Section</span>
          </div>

          <p className="text-gray-600">
            {classData.sectionId?.name || "Not Assigned"}
          </p>
        </div>

        {/* STUDENTS */}

        <div className="bg-white rounded-xl shadow p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FaUserGraduate />
            <span className="font-medium">Students</span>
          </div>

          <p className="text-gray-600">{classData.studentCount} Students</p>
        </div>
      </div>

      {/* CAPACITY */}

      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="flex justify-between">
          <h3 className="font-semibold">Class Capacity</h3>

          <span className="text-sm text-gray-500">
            {classData.studentCount}/{classData.capacity}
          </span>
        </div>

        <div className="h-3 bg-gray-200 rounded-full">
          <div
            className="h-3 bg-pink-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* SUBJECTS */}

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <FaBook />

          <h3 className="font-semibold">Subjects</h3>
        </div>

        {classData.subjects?.length === 0 ? (
          <p className="text-gray-400">No subjects assigned</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classData.subjects.map((sub) => (
              <span
                key={sub._id}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
              >
                {sub.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
