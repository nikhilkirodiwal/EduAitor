import { useEffect, useState } from "react";
import axios from "axios";
import { FaSchool, FaUsers, FaCalendarAlt, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const Schools = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);

  /* ---------------- FETCH ---------------- */

  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${API}/schools`);
      setSchools(res.data.data);
    } catch {
      toast.error("Failed to fetch schools");
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  /* ---------------- STATS ---------------- */

  const totalSchools = schools.length;

  const activeSchools = schools.filter((s) => s.status === "Active").length;

  const totalPlans = schools.filter((s) => s.subscription_plan).length;

  const activePlans = schools.filter(
    (s) => s.subscription_plan && s.subscription_plan.status === "Active"
  ).length;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Schools Dashboard
        </h1>

        <p className="text-gray-500 text-sm">
          Manage all schools and their subscriptions
        </p>
      </div>

      {/* STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <StatCard
          icon={<FaSchool />}
          title="Total Schools"
          value={totalSchools}
          color="bg-indigo-100 text-indigo-600"
        />

        <StatCard
          icon={<FaUsers />}
          title="Active Schools"
          value={activeSchools}
          color="bg-green-100 text-green-600"
        />

        <StatCard
          icon={<FaCalendarAlt />}
          title="Total Subscription Plans"
          value={totalPlans}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          icon={<FaCalendarAlt />}
          title="Active Subscription Plans"
          value={activePlans}
          color="bg-purple-100 text-purple-600"
        />

      </div>

      {/* SCHOOL CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {schools.map((school) => (
          <div
            key={school._id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
          >

            {/* HEADER */}

            <div className="flex justify-between items-start mb-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {school.school_name}
                </h2>

                <p className="text-xs text-gray-500">
                  {school.slug}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full
                ${
                  school.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {school.status}
              </span>

            </div>

            {/* SUBSCRIPTION */}

            {school.subscription_plan && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">

                <p className="text-sm font-medium text-indigo-700">
                  {school.subscription_plan?.name}
                </p>

                <p className="text-xs text-gray-500">
                  {school.subscription_plan?.currency}{" "}
                  {school.subscription_plan?.price}
                  {" / "}
                  {school.subscription_plan?.billing_cycle}
                </p>

              </div>
            )}

            {/* DETAILS */}

            <div className="text-sm text-gray-600 space-y-1">

              <p>
                <span className="text-gray-500">Start:</span>{" "}
                {school.start_date?.slice(0, 10)}
              </p>

              <p>
                <span className="text-gray-500">End:</span>{" "}
                {school.end_date?.slice(0, 10)}
              </p>

              <p>
                <span className="text-gray-500">Email:</span>{" "}
                {school.contact_email}
              </p>

              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                {school.contact_phone}
              </p>

            </div>

            {/* ADDRESS */}

            <p className="text-xs text-gray-400 mt-3 line-clamp-2">
              {school.address}
            </p>

            {/* ACTION */}

            <div className="flex justify-end mt-5">

              <button
                onClick={() => navigate(`/admin/school-view/${school._id}`)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                <FaEye />
                View Info
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default Schools;


/* ---------------- STAT CARD ---------------- */

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">

    <div>
      <p className="text-sm text-gray-500 mb-1">
        {title}
      </p>

      <h2 className="text-2xl font-bold text-gray-800">
        {value}
      </h2>
    </div>

    <div className={`p-3 rounded-lg text-xl ${color}`}>
      {icon}
    </div>

  </div>
);
