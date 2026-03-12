import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSchool,
  FaBook,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const [viewClassData, setViewClassData] = useState(null);

  const [initialForm, setInitialForm] = useState(null);

  const [form, setForm] = useState({
    name: "",
    sectionId: "",
    roomNumber: "",
    teacherId: "",
    capacity: "",
    subjects: [],
  });

  /* FETCH DATA */

  const fetchClasses = async () => {
    try {
      const { data } = await axios.get(`${API}/classes/all`);
      setClasses(data.classes || []);
    } catch {
      toast.error("Failed to load classes");
    }
  };

  const fetchSections = async () => {
    const { data } = await axios.get(`${API}/sections/all`);
    setSections(data.sections || []);
  };

  const fetchTeachers = async () => {
    const res = await axios.get(`${API}/teachers`);
    setTeachers(res.data.data || []);
  };

  const fetchSubjects = async () => {
    const { data } = await axios.get(`${API}/subjects/all`);
    setSubjects(data.subjects || []);
  };

  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchTeachers();
    fetchSubjects();
  }, []);

  /* SUBJECT TOGGLE */

  const toggleSubject = (id) => {
    setForm((prev) => {
      if (prev.subjects.includes(id)) {
        return { ...prev, subjects: prev.subjects.filter((s) => s !== id) };
      } else {
        return { ...prev, subjects: [...prev.subjects, id] };
      }
    });
  };

  /* EDIT */

  const openEdit = (cls) => {
    const data = {
      name: cls.name,
      sectionId: cls.sectionId?._id || "",
      roomNumber: cls.roomNumber,
      teacherId: cls.teacherId?._id || "",
      capacity: cls.capacity,
      subjects: cls.subjects?.map((s) => s._id) || [],
    };

    setForm(data);
    setInitialForm(data);
    setEditingClass(cls);
    setShowModal(true);
  };

  /* CHANGE DETECTION */

  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  };

  /* SAVE */

  const saveClass = async () => {
    if (!form.name || !form.roomNumber) {
      toast.error("Class name and room number required");
      return;
    }

    if (editingClass) {
      setConfirmUpdate(true);
      return;
    }

    try {
      await axios.post(`${API}/classes/create`, form);

      toast.success("Class created");

      setShowModal(false);

      resetForm();

      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  /* UPDATE */

  const confirmUpdateClass = async () => {
    try {
      await axios.put(`${API}/classes/update/${editingClass._id}`, form);

      toast.success("Class updated");

      setConfirmUpdate(false);
      setShowModal(false);

      resetForm();

      fetchClasses();
    } catch {
      toast.error("Update failed");
    }
  };

  /* DELETE */

  const deleteClass = async () => {
    try {
      await axios.delete(`${API}/classes/delete/${confirmDelete}`);

      toast.success("Class deleted");

      setConfirmDelete(null);

      fetchClasses();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* RESET */

  const resetForm = () => {
    setEditingClass(null);
    setForm({
      name: "",
      sectionId: "",
      roomNumber: "",
      teacherId: "",
      capacity: "",
      subjects: [],
    });
  };

  /* CLOSE MODAL */

  const closeModal = () => {
    if (editingClass && hasChanges()) {
      setDiscardConfirm(true);
    } else {
      setShowModal(false);
      resetForm();
    }
  };

  /* STATS */

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.studentCount || 0),
    0,
  );

  const avgClassSize =
    classes.length > 0 ? Math.floor(totalStudents / classes.length) : 0;

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="text-gray-500">Manage school classes</p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-4 gap-6">
        <StatCard
          icon={<FaSchool />}
          title="TOTAL CLASSES"
          value={classes.length}
        />

        <StatCard
          icon={<FaUserGraduate />}
          title="TOTAL STUDENTS"
          value={totalStudents}
        />

        <StatCard
          icon={<FaChalkboardTeacher />}
          title="WITH TEACHERS"
          value={classes.filter((c) => c.teacherId).length}
        />

        <StatCard
          icon={<FaSchool />}
          title="AVG CLASS SIZE"
          value={avgClassSize}
        />
      </div>

      {/* DIRECTORY */}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Class Directory</h2>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center"
        >
          <FaPlus /> Add Class
        </button>
      </div>

      {/* CLASS CARDS */}

      <div className="grid grid-cols-4 gap-6">
        {classes.map((cls) => {
          const percent = cls.capacity
            ? (cls.studentCount / cls.capacity) * 100
            : 0;

          return (
            <div
              key={cls._id}
              className="bg-white rounded-xl shadow p-5 space-y-4"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-semibold">
                  {cls.name}  {cls.sectionId ? `- ${cls.sectionId.name}` : ""}
                </div>

                <div>
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-sm text-gray-500">Room {cls.roomNumber}</p>
                </div>
              </div>

              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex items-center gap-2">
                  <FaChalkboardTeacher />
                  {cls.teacherId?.fullName || "No Teacher"}
                </div>

                <div className="flex items-center gap-2">
                  <FaUserGraduate />
                  {cls.studentCount || 0} students
                </div>

                <div className="flex items-center gap-2">
                  <FaBook />
                  {cls.subjects?.length || 0} subjects
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Capacity</span>
                  <span>
                    {cls.studentCount || 0}/{cls.capacity}
                  </span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-pink-500 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}

              <div className="flex justify-end gap-4 pt-3 border-t text-lg">
                <button
                  className="text-indigo-600 text-lg"
                  onClick={() => navigate(`/school/class-view/${cls._id}`)}
                >
                  <FaEye />
                </button>

                <button className="text-blue-600" onClick={() => openEdit(cls)}>
                  <FaEdit />
                </button>

                <button
                  className="text-red-600"
                  onClick={() => setConfirmDelete(cls._id)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-180 max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg relative">
            {/* CLOSE BUTTON */}

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            {/* HEADER */}

            <div className="border-b px-8 py-5">
              <h2 className="text-2xl font-semibold">
                {editingClass ? "Edit Class" : "Add New Class"}
              </h2>
            </div>

            {/* FORM */}

            <div className="px-8 py-6 space-y-6">
              {/* CLASS NAME */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Class Name
                </label>

                <input
                  className="input w-full"
                  placeholder="e.g. 9"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* SECTION */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Section (Optional)
                </label>

                <select
                  className="input w-full"
                  value={form.sectionId}
                  onChange={(e) =>
                    setForm({ ...form, sectionId: e.target.value })
                  }
                >
                  <option value="">Select Section</option>

                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROOM */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Room Number
                </label>

                <input
                  className="input w-full"
                  placeholder="e.g. 204"
                  value={form.roomNumber}
                  onChange={(e) =>
                    setForm({ ...form, roomNumber: e.target.value })
                  }
                />
              </div>

              {/* CAPACITY */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Capacity
                </label>

                <input
                  type="number"
                  className="input w-full"
                  placeholder="e.g. 40"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                />
              </div>

              {/* TEACHER */}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Class Teacher (Optional)
                </label>

                <select
                  className="input w-full"
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm({ ...form, teacherId: e.target.value })
                  }
                >
                  <option value="">Select Teacher</option>

                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBJECTS */}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign Subjects
                </label>

                <div className="border rounded-xl p-4 grid grid-cols-4 gap-4 max-h-50 overflow-y-auto">
                  {subjects.map((sub) => (
                    <label
                      key={sub._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.subjects.includes(sub._id)}
                        onChange={() => toggleSubject(sub._id)}
                      />

                      {sub.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeModal}
                  className="border px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={saveClass}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
                >
                  {editingClass ? "Update Class" : "Save Class"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this class?"
          confirm={deleteClass}
          cancel={() => setConfirmDelete(null)}
        />
      )}

      {/* UPDATE CONFIRM */}

      {confirmUpdate && (
        <ConfirmModal
          title="Update class?"
          confirm={confirmUpdateClass}
          cancel={() => setConfirmUpdate(false)}
        />
      )}

      {/* DISCARD CONFIRM */}

      {discardConfirm && (
        <ConfirmModal
          title="Discard changes?"
          confirm={() => {
            setDiscardConfirm(false);
            setShowModal(false);
            resetForm();
          }}
          cancel={() => setDiscardConfirm(false)}
        />
      )}

      {/* VIEW COMPONENT */}

      {viewClassData && (
        <ClassView data={viewClassData} close={() => setViewClassData(null)} />
      )}
    </div>
  );
}

/* CONFIRM MODAL */

const ConfirmModal = ({ title, confirm, cancel }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl space-y-4 text-center">
      <h3>{title}</h3>

      <div className="flex gap-4 justify-center">
        <button onClick={cancel} className="border px-4 py-2 rounded">
          Cancel
        </button>

        <button
          onClick={confirm}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

/* STAT CARD */

const StatCard = ({ icon, title, value }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 text-indigo-600 text-lg">
      {icon}
    </div>

    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-xl font-bold">{value}</h3>
    </div>
  </div>
);
