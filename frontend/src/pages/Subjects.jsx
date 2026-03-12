import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaBook, FaEdit, FaTrash, FaLayerGroup } from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    status: "Active",
  });

  /* FETCH */

  const fetchSubjects = async () => {
    try {
      const { data } = await axios.get(`${API}/subjects/all`);
      setSubjects(data.subjects || []);
    } catch {
      toast.error("Failed to load subjects");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  /* STATS */

  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.status === "Active").length;
  const inactiveSubjects = subjects.filter(
    (s) => s.status === "Inactive",
  ).length;
  const usedSubjects = subjects.filter((s) => s.classCount > 0).length;

  /* SAVE */

  const saveSubject = async () => {
    if (!form.name.trim()) {
      toast.error("Subject name required");
      return;
    }

    try {
      if (editing) {
        await axios.put(`${API}/subjects/update/${editing._id}`, form);
        toast.success("Subject updated");
      } else {
        await axios.post(`${API}/subjects/create`, form);
        toast.success("Subject created");
      }

      setForm({ name: "", status: "Active" });
      setEditing(null);
      setShowModal(false);

      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error");
    }
  };

  /* EDIT */

  const openEdit = (sub) => {
    setEditing(sub);

    setForm({
      name: sub.name,
      status: sub.status,
    });

    setShowModal(true);
  };

  /* DELETE */

  const deleteSubject = async (id) => {
    try {
      await axios.delete(`${API}/subjects/delete/${id}`);

      toast.success("Subject deleted");

      setConfirmDelete(null);

      fetchSubjects();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-gray-500">Manage school subjects</p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: "", status: "Active" });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
        >
          <FaPlus /> Add Subject
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-4 gap-6">
        <StatCard
          icon={<FaLayerGroup />}
          title="Total Subjects"
          value={totalSubjects}
        />

        <StatCard
          icon={<FaBook />}
          title="Active Subjects"
          value={activeSubjects}
        />

        <StatCard
          icon={<FaBook />}
          title="Inactive Subjects"
          value={inactiveSubjects}
        />

        <StatCard
          icon={<FaBook />}
          title="Used Subjects"
          value={usedSubjects}
        />
      </div>

      {/* SUBJECT GRID */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <div
            key={sub._id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 border border-gray-100 flex flex-col justify-between"
          >
            {/* HEADER */}

            <div className="flex justify-between">
              <div className="flex gap-3">
                <div className="w-12 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FaBook />
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {sub.name}
                  </h3>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      sub.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(sub)}
                  className="text-blue-600 hover:bg-blue-50 w-8 h-8 flex items-center justify-center rounded"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => setConfirmDelete(sub._id)}
                  className="text-red-600 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* CLASS USAGE */}

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Used in <b>{sub.classCount}</b> classes
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {sub.classes?.length > 0 ? (
                  sub.classes.map((cls) => (
                    <span
                      key={cls._id}
                      className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600"
                    >
                      {cls.name}
                      {cls.section ? `-${cls.section}` : ""}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Not assigned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-105 space-y-4">
            <h3 className="text-lg font-semibold">
              {editing ? "Edit Subject" : "Add Subject"}
            </h3>

            <input
              className="input"
              placeholder="Enter subject name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveSubject}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl space-y-4 text-center">
            <h3>Delete this subject?</h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteSubject(confirmDelete)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* STAT CARD */

const StatCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-lg">
      {icon}
    </div>

    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-xl font-bold">{value}</h3>
    </div>
  </div>
);
