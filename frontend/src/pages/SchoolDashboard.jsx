import { useEffect, useState } from "react";
import axios from "axios";
import { FaUserGraduate, FaChalkboardTeacher, FaCalendarCheck } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const SchoolDashboard = () => {

  const [students,setStudents] = useState([]);

  const fetchStudents = async () => {

    const res = await axios.get(`${API}/students`);

    setStudents(res.data.data);

  };

  useEffect(()=>{
    fetchStudents();
  },[]);

  return (

    <div className="p-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold mb-8">
        School Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <Card
          title="Total Students"
          value={students.length}
          icon={<FaUserGraduate />}
        />

        <Card
          title="Teachers"
          value="Coming Soon"
          icon={<FaChalkboardTeacher />}
        />

        <Card
          title="Attendance"
          value="Coming Soon"
          icon={<FaCalendarCheck />}
        />

      </div>

    </div>

  );

};

export default SchoolDashboard;


/* CARD */

const Card = ({title,value,icon}) => (

  <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between">

    <div>

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h2 className="text-2xl font-bold">
        {value}
      </h2>

    </div>

    <div className="text-indigo-500 text-3xl">
      {icon}
    </div>

  </div>

);