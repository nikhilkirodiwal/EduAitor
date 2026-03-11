import { useState, useEffect } from "react";
import { FaUserShield, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (role === "super_admin") {
      navigate("/admin/dashboard", { replace: true });
    }
    if (role === "school_admin") {
      navigate("/school/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/auth/login`, form);

      const user = res.data.data;

      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userData", JSON.stringify(user));

      if (user.role === "super_admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/school/dashboard");
      }
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden md:flex flex-col justify-center items-center bg-linear-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-12">
        <h1 className="text-5xl font-bold mb-4">EduAitor</h1>

        <p className="text-lg opacity-90 text-center max-w-md">
          Super Admin Control Panel for managing schools, users, reports and
          system configuration.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center bg-linear-to-br from-[#e6edf8] via-[#d7e2f5] to-[#eef1fb] p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-white/40">
          <div className="text-center mb-8">
            <FaUserShield className="mx-auto text-4xl text-indigo-500 mb-3" />

            <h2 className="text-3xl font-bold text-gray-700">Admin Login</h2>

            <p className="text-gray-500 text-sm">EduAitor Control Panel</p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <FaUserShield className="absolute left-4 top-4 text-gray-400" />

              <input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-4 text-gray-400" />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition shadow-md"
            >
              Login to Admin Panel
            </button>
            <p className="text-center">demo: super@admin.com / admin</p>
          </form>
        </div>
      </div>
    </div>
  );
}
