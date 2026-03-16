import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const steps = [
  "Basic Information",
  "Professional Details",
  "Employment Details",
  "ERP Mapping",
  "Review",
];

const emptyForm = {
  fullName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  governmentId: "",
  photo: null,

  qualification: "",
  experience: "",
  subject: "",
  department: "",

  teacherId: "",
  designation: "",
  joiningDate: "",
  employmentType: "",
  salary: "",

  assignedClasses: "",
  role: "",
  username: "",
  password: "",
};

const TeacherManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const progress = (step / steps.length) * 100;

  /* FETCH TEACHER */

  useEffect(() => {
    if (!id) return;

    const fetchTeacher = async () => {
      try {
        const res = await axios.get(`${API}/teachers/${id}`);

        const t = res.data.data;

        setForm({
          ...t,
          dob: t.dob ? t.dob.split("T")[0] : "",
          joiningDate: t.joiningDate ? t.joiningDate.split("T")[0] : "",
        });
      } catch {
        toast.error("Failed to load teacher");
      }
    };

    fetchTeacher();
  }, [id]);

  /* FORM CHANGE */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* FILE */

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    const file = files[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be less than 2MB");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  /* DIRTY CHECK */

  const isDirty = () => Object.values(form).some((v) => v !== "");

  /* VALIDATION */

  const validateStep = () => {
    const errors = [];

    if (step === 1) {
      if (!form.fullName.trim()) errors.push("Full Name required");
      if (!form.phone.trim()) errors.push("Phone required");
      if (!form.email.trim()) errors.push("Email required");

      if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
        errors.push("Invalid phone number");
    }

    if (step === 2) {
      if (!form.qualification) errors.push("Qualification required");
      if (!form.subject) errors.push("Subject required");
    }

    if (step === 3) {
      if (!form.teacherId) errors.push("Teacher ID required");
      if (!form.designation) errors.push("Designation required");
    }

    if (step === 4) {
      if (!form.username) errors.push("Username required");
      if (!form.role) errors.push("Role required");
    }

    return errors;
  };

  const next = () => {
    const errors = validateStep();

    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    setStep((s) => s + 1);
  };

  const prev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  /* RESET */

  const resetForm = () => {
    if (!isDirty()) {
      setForm(emptyForm);
      setStep(1);
      return;
    }

    setConfirmMessage("Are you sure you want to reset the form?");

    setConfirmAction(() => () => {
      setForm(emptyForm);
      setStep(1);
    });

    setConfirmOpen(true);
  };

  /* SUBMIT */

  const handleSubmit = () => {
    setConfirmMessage(
      isEdit
        ? "Are you sure you want to update this teacher?"
        : "Are you sure you want to save this teacher?",
    );

    setConfirmAction(() => submitTeacher);

    setConfirmOpen(true);
  };

  const submitTeacher = async () => {
    try {
      const data = new FormData();

      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });

      if (isEdit) {
        await axios.put(`${API}/teachers/${id}`, data);

        toast.success("Teacher updated successfully");
      } else {
        await axios.post(`${API}/teachers`, data);

        toast.success("Teacher added successfully");
      }

      navigate("/school/teachers");
    } catch {
      toast.error("Operation failed");
    }
  };

  /* REFRESH WARNING */

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEdit ? "Edit Teacher Details" : "Add Teacher"}
        </h1>

        <button
          onClick={resetForm}
          className="px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* STEP SIDEBAR */}

        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-xl shadow p-4 sticky top-6">
            {steps.map((s, i) => {
              const index = i + 1;

              const status =
                step === index
                  ? "active"
                  : step > index
                    ? "complete"
                    : "pending";

              return (
                <div
                  key={i}
                  onClick={() => {
                    const errors = validateStep();

                    if (index > step && errors.length) {
                      toast.error("Complete this step first");
                      return;
                    }

                    setStep(index);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer
                  ${
                    status === "active"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
                    ${
                      status === "complete"
                        ? "bg-green-500 text-white"
                        : status === "active"
                          ? "bg-white text-indigo-600"
                          : "bg-gray-300"
                    }`}
                  >
                    {status === "complete" ? "✓" : index}
                  </div>

                  <span className="text-sm font-medium">{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FORM */}

        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white rounded-xl shadow p-6 lg:p-8">
            {/* PROGRESS */}

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Step {step} of {steps.length}
                </span>

                <span>{Math.round(progress)}%</span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* STEP CONTENT */}

            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Full Name *"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                />
                <Input
                  type="date"
                  label="Date of Birth"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />
                <Select
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  options={["Male", "Female"]}
                  onChange={handleChange}
                />
                <Input
                  label="Phone *"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Email *"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                <Input
                  label="Government ID"
                  name="governmentId"
                  value={form.governmentId}
                  onChange={handleChange}
                />
                <Input
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
                <File
                  label="Teacher Photo"
                  name="photo"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Qualification"
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                />
                <Input
                  label="Experience"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                />
                <Input
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                />
              </div>
            )}

            {step === 3 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Teacher ID"
                  name="teacherId"
                  value={form.teacherId}
                  onChange={handleChange}
                />
                <Input
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                />
                <Input
                  type="date"
                  label="Joining Date"
                  name="joiningDate"
                  value={form.joiningDate}
                  onChange={handleChange}
                />
                <Select
                  label="Employment Type"
                  name="employmentType"
                  value={form.employmentType}
                  options={["Full Time", "Part Time", "Contract"]}
                  onChange={handleChange}
                />
                <Input
                  label="Salary"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                />
              </div>
            )}

            {step === 4 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Assigned Classes"
                  name="assignedClasses"
                  value={form.assignedClasses}
                  onChange={handleChange}
                />
                <Input
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                />
                <Input
                  label="Username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                />
                <Input
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            )}

            {step === 5 && (
              <div className="bg-gray-50 border rounded-xl p-6 overflow-auto">
                <pre className="text-sm">{JSON.stringify(form, null, 2)}</pre>
              </div>
            )}

            {/* NAVIGATION */}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  onClick={prev}
                  className="px-6 py-2 bg-gray-200 rounded-lg"
                >
                  Back
                </button>
              )}

              {step < steps.length ? (
                <button
                  onClick={next}
                  disabled={validateStep().length > 0}
                  className={`px-6 py-2 rounded-lg text-white
                  ${
                    validateStep().length
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg"
                >
                  {isEdit ? "Update Teacher" : "Save Teacher"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal
          message={confirmMessage}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            confirmAction?.();
            setConfirmOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TeacherManagement;

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm mb-1 text-gray-600">{label}</label>
    <input {...props} className="w-full border px-3 py-2 rounded-lg" />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm mb-1 text-gray-600">{label}</label>
    <select {...props} className="w-full border px-3 py-2 rounded-lg">
      <option value="">Select</option>
      {options.map((o, i) => (
        <option key={i}>{o}</option>
      ))}
    </select>
  </div>
);

const File = ({ label, name, onChange }) => (
  <div>
    <label className="block text-sm mb-1 text-gray-600">{label}</label>
    <input
      type="file"
      name={name}
      onChange={onChange}
      className="w-full border px-3 py-2 rounded-lg"
    />
  </div>
);

const ConfirmModal = ({ message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-xl p-6 w-100">
      <h3 className="text-lg font-semibold mb-3">Confirmation</h3>
      <p className="mb-6">{message}</p>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);
