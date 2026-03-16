import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const steps = [
  "Student Details",
  "Parent / Guardian",
  "Documents",
  "Class Details",
  "Fee Structure",
  "Review",
];

const emptyForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  admissionDate: "",

  fatherName: "",
  fatherMobile: "",
  fatherEmail: "",

  motherName: "",
  motherMobile: "",
  motherEmail: "",

  guardianName: "",
  guardianMobile: "",
  guardianRelation: "",

  address: "",

  className: "",
  section: "",
  rollNo: "",
  studentType: "",

  totalFee: "",
  discountType: "",
  discountValue: "",
  finalFee: "",

  studentPhoto: null,
  fatherPhoto: null,
  motherPhoto: null,
  guardianPhoto: null,

  birthCertificate: null,
  transferCertificate: null,

  studentAadhar: null,
  fatherAadhar: null,
  motherAadhar: null,
};

const StudentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const progress = (step / steps.length) * 100;

  /* FETCH STUDENT */

  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${API}/students/${id}`);
        const student = res.data.data;

        setForm({
          ...student,
          dob: student.dob ? student.dob.split("T")[0] : "",
          admissionDate: student.admissionDate
            ? student.admissionDate.split("T")[0]
            : "",
        });
      } catch {
        toast.error("Failed to load student");
      }
    };

    fetchStudent();
  }, [id]);

  /* CHANGE */

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

  /* FEE CALCULATION */

  useEffect(() => {
    let total = Number(form.totalFee) || 0;
    let discount = Number(form.discountValue) || 0;

    let final = total;

    if (form.discountType === "Percentage") {
      final = total - (total * discount) / 100;
    }

    if (form.discountType === "Rupees") {
      final = total - discount;
    }

    setForm((prev) => ({
      ...prev,
      finalFee: final >= 0 ? final : 0,
    }));
  }, [form.totalFee, form.discountType, form.discountValue]);

  const isDirty = () => Object.values(form).some((v) => v !== "");

  const validateStep = () => {
    const errors = [];

    if (step === 1) {
      if (!form.firstName.trim()) errors.push("First Name required");
      if (!form.lastName.trim()) errors.push("Last Name required");
      if (!form.dob) errors.push("Date of Birth required");
      if (!form.gender) errors.push("Gender required");
      if (!form.admissionDate) errors.push("Admission Date required");
    }

    if (step === 2) {
      if (!form.fatherName.trim()) errors.push("Father name required");
      if (!form.fatherMobile.trim()) errors.push("Father mobile required");
      if (!form.address.trim()) errors.push("Address required");

      if (form.fatherMobile && !/^[6-9]\d{9}$/.test(form.fatherMobile))
        errors.push("Invalid Father Mobile Number");
    }

    if (step === 4) {
      if (!form.className) errors.push("Class required");
      if (!form.section) errors.push("Section required");
      if (!form.rollNo) errors.push("Roll number required");
    }

    if (step === 5) {
      if (!form.totalFee) errors.push("Total fee required");
    }

    return errors;
  };

  const next = () => {
    const errors = validateStep();
    if (errors.length) return errors.forEach((e) => toast.error(e));
    setStep((s) => s + 1);
  };

  const prev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

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

  const handleSubmit = () => {
    setConfirmMessage(
      isEdit
        ? "Are you sure you want to update this student?"
        : "Are you sure you want to save this student?",
    );

    setConfirmAction(() => submitStudent);
    setConfirmOpen(true);
  };

  const submitStudent = async () => {
    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        const forbidden = ["_id", "__v", "createdAt", "updatedAt", "studentId"];

        if (forbidden.includes(key)) return;

        if (value !== null && value !== "") {
          data.append(key, value);
        }
      });

      if (isEdit) {
        await axios.put(`${API}/students/${id}`, data);
        toast.success("Student Updated Successfully");
      } else {
        await axios.post(`${API}/students`, data);
        toast.success("Student Added Successfully");
      }

      navigate("/school/students");
    } catch {
      toast.error("Operation failed");
    }
  };

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
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}

      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold">
          {isEdit ? "Edit Student Details" : "Student Admission"}
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
                    if (index > step && errors.length > 0) {
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

        {/* FORM AREA */}

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

            {/* STEP 1 */}

            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="First Name *"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                />
                <Input
                  label="Last Name *"
                  name="lastName"
                  value={form.lastName}
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
                  label="Blood Group"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                />
                <Input
                  type="date"
                  label="Admission Date"
                  name="admissionDate"
                  value={form.admissionDate}
                  onChange={handleChange}
                />
              </div>
            )}
            {/* STEP 2 */}

            {step === 2 && (
              <div className="space-y-6">
                <Input
                  label="Father Name"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                />
                <Input
                  label="Father Mobile"
                  name="fatherMobile"
                  value={form.fatherMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Father Email"
                  name="fatherEmail"
                  value={form.fatherEmail}
                  onChange={handleChange}
                />

                <Input
                  label="Mother Name"
                  name="motherName"
                  value={form.motherName}
                  onChange={handleChange}
                />
                <Input
                  label="Mother Mobile"
                  name="motherMobile"
                  value={form.motherMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Mother Email"
                  name="motherEmail"
                  value={form.motherEmail}
                  onChange={handleChange}
                />

                <Input
                  label="Guardian Name"
                  name="guardianName"
                  value={form.guardianName}
                  onChange={handleChange}
                />
                <Input
                  label="Guardian Mobile"
                  name="guardianMobile"
                  value={form.guardianMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Relation"
                  name="guardianRelation"
                  value={form.guardianRelation}
                  onChange={handleChange}
                />

                <Input
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* STEP 3 */}

            {step === 3 && (
              <div className="grid gap-4">
                <File
                  label="Student Photo"
                  name="studentPhoto"
                  onChange={handleFileChange}
                />

                <File
                  label="Father Photo"
                  name="fatherPhoto"
                  onChange={handleFileChange}
                />

                <File
                  label="Mother Photo"
                  name="motherPhoto"
                  onChange={handleFileChange}
                />

                <File
                  label="Guardian Photo"
                  name="guardianPhoto"
                  onChange={handleFileChange}
                />

                <File
                  label="Birth Certificate"
                  name="birthCertificate"
                  onChange={handleFileChange}
                />

                <File
                  label="Transfer Certificate"
                  name="transferCertificate"
                  onChange={handleFileChange}
                />

                <File
                  label="Student Aadhar"
                  name="studentAadhar"
                  onChange={handleFileChange}
                />

                <File
                  label="Father Aadhar"
                  name="fatherAadhar"
                  onChange={handleFileChange}
                />

                <File
                  label="Mother Aadhar"
                  name="motherAadhar"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* STEP 4 */}

            {step === 4 && (
              <div className="grid gap-4">
                <Input
                  label="Class"
                  name="className"
                  value={form.className}
                  onChange={handleChange}
                />

                <Input
                  label="Section"
                  name="section"
                  value={form.section}
                  onChange={handleChange}
                />

                <Input
                  label="Roll Number"
                  name="rollNo"
                  value={form.rollNo}
                  onChange={handleChange}
                />

                <Select
                  label="Student Type"
                  name="studentType"
                  value={form.studentType}
                  options={["Day Scholar", "Day Boarder", "Boarder"]}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* STEP 5 */}

            {step === 5 && (
              <div className="grid gap-4">
                <Input
                  label="Total Fee (₹)"
                  name="totalFee"
                  value={form.totalFee}
                  onChange={handleChange}
                />

                <Select
                  label="Discount Type"
                  name="discountType"
                  value={form.discountType}
                  options={["Rupees", "Percentage"]}
                  onChange={handleChange}
                />

                <Input
                  label="Discount Value"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                />

                <Input
                  label="Final Fee"
                  name="finalFee"
                  value={form.finalFee}
                  readOnly
                />
              </div>
            )}
            {/* STEP 6 REVIEW */}

            {step === 6 && (
              <div className="bg-gray-50 border rounded-xl p-6 overflow-auto">
                <pre className="text-sm">{JSON.stringify(form, null, 2)}</pre>
              </div>
            )}

            {/* NAV */}

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
                    validateStep().length > 0
                      ? "bg-gray-400"
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
                  {isEdit ? "Update Student" : "Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirmation</h3>

            <p className="text-gray-600 mb-6">{confirmMessage}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  confirmAction?.();
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;

/* INPUT */

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>

    <input
      {...props}
      className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

/* SELECT */

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>

    <select
      {...props}
      className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
    >
      <option value="">Select</option>

      {options.map((o, i) => (
        <option key={i} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

/* FILE */

const File = ({ label, name, onChange }) => {
  const [preview, setPreview] = useState(null);

  const handlePreview = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    onChange(e);
  };

  return (
    <div className="border rounded-xl p-4 bg-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <input
        type="file"
        name={name}
        onChange={handlePreview}
        className="w-full border px-3 py-2 rounded-lg"
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          className="mt-3 h-24 rounded-lg object-cover"
        />
      )}
    </div>
  );
};
