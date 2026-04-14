import React, { useEffect, useState } from "react";
import axios from "axios";

function TeacherExam() {
  const API = import.meta.env.VITE_API_URL;
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeacherExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/exam/teacher-exams`, {
        withCredentials: true,
      });
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherExams();
  }, []);

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-indigo-900">
          All Exams
        </h1>
        <p className="text-sm text-slate-500">
          Exams assigned to Me
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <p className="text-center text-slate-500">Loading...</p>
        ) : exams.length === 0 ? (
          <p className="text-center text-slate-400">
            No exams assigned
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-xs uppercase text-slate-400">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">
                        {exam.subject?.name}
                      </td>
                      <td className="p-4">
                        Class {exam.className?.name}
                      </td>
                      <td className="p-4">
                        {new Date(exam.examDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                      </td>
                      <td className="p-4 text-indigo-600 font-semibold">
                        {exam.termId?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-white p-4 rounded-2xl shadow border"
                >
                  <h3 className="font-bold text-lg text-slate-800">
                    {exam.subject?.name}
                  </h3>

                  <p className="text-xs text-indigo-600 font-bold uppercase">
                    Class {exam.className?.name}
                  </p>

                  <div className="mt-2 text-sm text-slate-500">
                    📅 {new Date(exam.examDate).toLocaleDateString("en-GB")}
                  </div>

                  <div className="text-sm text-slate-500">
                    ⏰ {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                  </div>

                  <div className="mt-2 text-xs text-indigo-500 font-bold">
                    {exam.termId?.name}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeacherExam;