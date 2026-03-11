import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const Teachers = () => {

  const navigate = useNavigate();

  const [teachers,setTeachers] = useState([]);

  const fetchTeachers = async () => {

    const res = await axios.get(`${API}/teachers`);
    setTeachers(res.data.data);

  };

  useEffect(()=>{
    fetchTeachers();
  },[]);

  const totalTeachers = teachers.length;
  const present = teachers.filter(t => t.status === "Present").length;

  const avgExperience =
    teachers.reduce((a,b)=>a + Number(b.experience || 0),0) /
    (teachers.length || 1);

  return (

    <div className="p-8 bg-slate-100">

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold">
          Teachers
        </h1>

        <p className="text-gray-500">
          Good Afternoon, Dr. Rajesh Kumar! Welcome to the Teachers panel.
        </p>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-4 gap-6 mb-8">

        <Stat title="TOTAL TEACHERS" value={totalTeachers}/>
        <Stat title="PRESENT" value={present}/>
        <Stat title="AVG EXPERIENCE" value={`${avgExperience.toFixed(1)} yrs`}/>
        <Stat title="AVG RATING" value="4.1 ★"/>

      </div>

      {/* DIRECTORY HEADER */}

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-semibold">
          Faculty Directory
        </h2>

        <div className="flex gap-4">

          <select className="border rounded-lg px-3 py-2">
            <option>All Classes</option>
          </select>

          <button
            onClick={()=>navigate("/school/teacher-manage")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus/>
            Add Teacher
          </button>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full text-sm">

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

            {teachers.map((teacher)=> (

              <tr key={teacher._id} className="border-t">

                <td className="p-4">
                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                      {teacher.fullName?.charAt(0)}
                    </div>

                    <div>
                      <p className="font-medium">
                        {teacher.fullName}
                      </p>
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
                <td className="p-4 text-green-600">Present</td>

                <td className="p-4 text-center">

                  <button
                    onClick={()=>navigate(`/school/teacher-view/${teacher._id}`)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded mr-2"
                  >
                    View
                  </button>

                  <button
                    onClick={()=>navigate(`/school/teacher-manage/${teacher._id}`)}
                    className="px-3 py-1 bg-gray-100 rounded"
                  >
                    Edit
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default Teachers;

const Stat = ({title,value}) => (

  <div className="bg-white rounded-xl shadow p-6">

    <p className="text-sm text-gray-500">
      {title}
    </p>

    <p className="text-2xl font-bold">
      {value}
    </p>

  </div>

);