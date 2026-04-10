import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

const steps = [
  "Student Details",
  "Parent / Guardian",
  "Documents",
  "Class Details",
  "Fee Structure",
  "Parent Login",
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

  classId: "",
  sectionId: "",
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

  parentUsername: "",
  parentPassword: "",
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

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [feeStructure, setFeeStructure] = useState([]);
  const [freqFilter, setFreqFilter] = useState("monthly");

  const isMobile = window.innerWidth <= 768;

  const calcAmount = (amount) => {
    let value;

    switch (freqFilter) {
      case "monthly":
        value = amount / 12;
        break;

      case "quarterly":
        value = amount / 4;
        break;

      case "half-yearly":
        value = amount / 2;
        break;

      case "annually":
        value = amount;
        break;

      default:
        value = amount;
    }

    return Number(value).toFixed(2);
  };

  const progress = (step / steps.length) * 100;

  /* FETCH CLASS */
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/classes/all`, {
          withCredentials: true,
        });

        setClasses(res.data.classes || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load classes");
      }
    };

    fetchClasses();
  }, []);

  /* FETCH SECTION CLASS BASED*/
  useEffect(() => {
    if (!form.classId) {
      setSections([]);
      return;
    }

    const selectedClass = classes.find((c) => c._id === form.classId);
    if (!selectedClass) return;

    const derivedSections =
      selectedClass.details?.map((d) => ({
        label: d.sectionId?.name || d.sectionId?.sectionName || "Section",
        value: d.sectionId?._id,
      })) || [];

    setSections(derivedSections);
    if (
      form.sectionId &&
      !derivedSections.find((s) => s.value === form.sectionId)
    ) {
      setForm((prev) => ({ ...prev, sectionId: "" }));
    }
  }, [form.classId, classes]);

  /* FETCH FEE STRUCTURE */
  useEffect(() => {
    if (!form.classId) return;

    const fetchFeeStructure = async () => {
      try {
        const { data } = await axios.get(
          `${API}/fee-structure/${form.classId}`,
          { withCredentials: true },
        );

        if (data?.success) {
          setFeeStructure(data.fees || []);
        } else {
          toast.error(data.message || "Failed to load fee structure");
          setFeeStructure([]);
        }
      } catch (err) {
        console.error(err);
        toast.error(
          err?.response?.data?.message || "Failed to load fee structure",
        );
        setFeeStructure([]);
      }
    };

    fetchFeeStructure();
  }, [form.classId]);

  /* FETCH STUDENT */
  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${API}/students/${id}`, {
          withCredentials: true,
        });
        const student = res.data.data;

        setForm({
          ...student,
          classId: student.classId?._id || student.classId,
          sectionId: student.sectionId?._id || student.sectionId,
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
      ...(name === "classId" && {
        sectionId: "",
        discountType: "",
        discountValue: "",
        totalFee: "",
        finalFee: "",
      }),
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
    const annual = feeStructure.reduce((sum, f) => {
      if (f.isOptional) return sum;
      return sum + (f.amount || 0); // ✅ correct
    }, 0);

    let discount = Number(form.discountValue) || 0;
    let final = annual;

    if (form.discountType === "Percentage") {
      final = annual - (annual * discount) / 100;
    }

    if (form.discountType === "Rupees") {
      final = annual - discount;
    }

    // 🔥 FORCE UPDATE (no condition)
    setForm((prev) => ({
      ...prev,
      totalFee: annual,
      finalFee: final >= 0 ? final : 0,
    }));
  }, [feeStructure, form.discountType, form.discountValue]);

  const isDirty = () =>
    Object.values(form).some((v) => v !== "" && v !== null && v !== undefined);

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
      if (form.fatherMobile && !/^\d{10}$/.test(form.fatherMobile))
        errors.push("Invalid Father Mobile Number");
    }

    if (step === 4) {
      if (!form.classId) errors.push("Class required");

      if (sections.length > 0 && !form.sectionId) {
        errors.push("Section required");
      }

      if (!form.rollNo) errors.push("Roll number required");
    }

    if (step === 5) {
      if (form.totalFee === "" || form.totalFee === null) {
        errors.push("Total fee required");
      }
    }

    if (step === 6) {
      if (!form.username?.trim()) errors.push("Username is required");
      if (!isEdit && !form.password?.trim())
        errors.push("Password is required");
      if (form.password && form.password.length < 5)
        errors.push("Password must be at least 5 characters");
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

        if (value !== null && value !== "" && key !== "documents") {
          if (typeof value === "object") {
            data.append(key, JSON.stringify(value)); // ✅ FIX
          } else {
            data.append(key, value);
          }
        }
      });

      data.set("feeFrequency", freqFilter);

      if (isEdit) {
        await axios.put(`${API}/students/${id}`, data, {
          withCredentials: true,
        });
        toast.success("Student Updated Successfully");
      } else {
        await axios.post(`${API}/students`, data, { withCredentials: true });
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
      {/* 🔙 BACK BUTTON */}
      {isMobile && (
          <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                 bg-white shadow-sm border border-slate-100
                 text-sm font-bold text-slate-600 active:scale-95 transition-transform mb-2.5"
          >
            <FaArrowLeft size={16} />
            Back
          </button>
        </div>
      )}
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
                  placeholder="Enter first name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                />
                <Input
                  label="Last Name *"
                  placeholder="Enter last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                />
                <Input
                  type="date"
                  label="Date of Birth *"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />
                <Select
                  label="Gender *"
                  name="gender"
                  value={form.gender}
                  options={["Male", "Female"]}
                  onChange={handleChange}
                />
                <Input
                  label="Blood Group *"
                  placeholder="Enter blood group (eg. O+, A-...)"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                />
                <Input
                  type="date"
                  label="Admission Date *"
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
                  label="Father Name *"
                  placeholder="Enter full name"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                />
                <Input
                  label="Father Mobile *"
                  placeholder="Enter mobile number"
                  name="fatherMobile"
                  value={form.fatherMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Father Email *"
                  placeholder="Enter email"
                  name="fatherEmail"
                  value={form.fatherEmail}
                  onChange={handleChange}
                />

                <Input
                  label="Mother Name *"
                  placeholder="Enter full name"
                  name="motherName"
                  value={form.motherName}
                  onChange={handleChange}
                />
                <Input
                  label="Mother Mobile *"
                  placeholder="Enter mobile number"
                  name="motherMobile"
                  value={form.motherMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Mother Email *"
                  placeholder="Enter email"
                  name="motherEmail"
                  value={form.motherEmail}
                  onChange={handleChange}
                />

                <Input
                  label="Guardian Name"
                  placeholder="Enter full name"
                  name="guardianName"
                  value={form.guardianName}
                  onChange={handleChange}
                />
                <Input
                  label="Guardian Mobile"
                  placeholder="Enter mobile number"
                  name="guardianMobile"
                  value={form.guardianMobile}
                  onChange={handleChange}
                />
                <Input
                  label="Relation"
                  placeholder="Enter relation with child"
                  name="guardianRelation"
                  value={form.guardianRelation}
                  onChange={handleChange}
                />

                <Input
                  label="Address *"
                  placeholder="Enter full address"
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
                  existingUrl={form?.documents?.studentPhoto?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Father Photo"
                  name="fatherPhoto"
                  existingUrl={form?.documents?.fatherPhoto?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Mother Photo"
                  name="motherPhoto"
                  existingUrl={form?.documents?.motherPhoto?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Guardian Photo"
                  name="guardianPhoto"
                  existingUrl={form?.documents?.guardianPhoto?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Birth Certificate"
                  name="birthCertificate"
                  existingUrl={form?.documents?.birthCertificate?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Transfer Certificate"
                  name="transferCertificate"
                  existingUrl={form?.documents?.transferCertificate?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Student Aadhar"
                  name="studentAadhar"
                  existingUrl={form?.documents?.studentAadhar?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Father Aadhar"
                  name="fatherAadhar"
                  existingUrl={form?.documents?.fatherAadhar?.url}
                  onChange={handleFileChange}
                />

                <File
                  label="Mother Aadhar"
                  name="motherAadhar"
                  existingUrl={form?.documents?.motherAadhar?.url}
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* STEP 4 */}

            {step === 4 && (
              <div className="grid gap-4">
                <Select
                  label="Class *"
                  name="classId"
                  value={form.classId}
                  options={classes.map((c) => ({
                    label: c.name || c.className,
                    value: c._id,
                  }))}
                  onChange={handleChange}
                />

                {form.classId && sections.length > 0 && (
                  <Select
                    label="Section"
                    name="sectionId"
                    value={form.sectionId}
                    options={sections}
                    onChange={handleChange}
                  />
                )}

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
                {feeStructure.length === 0 && form.classId && (
                  <div className="text-sm text-gray-400">
                    No fee structure found for this class
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1">
                    View As
                  </label>

                  <select
                    value={freqFilter}
                    onChange={(e) => setFreqFilter(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half Yearly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                {feeStructure.length > 0 && (
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2">Fee Breakdown</h3>

                    {feeStructure.map((f, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1"
                      >
                        <span>
                          {f.name}
                          {f.isOptional && (
                            <span className="text-xs text-gray-400 ml-2">
                              (Optional)
                            </span>
                          )}
                        </span>

                        <span>₹{calcAmount(f.amount)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold border-t mt-2 pt-2">
                      <span>Annual Total</span>
                      <span>
                        ₹
                        {feeStructure.reduce(
                          (s, f) => (f.isOptional ? s : s + (f.amount || 0)),
                          0,
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <Input
                  label="Total Annual Fee (₹)"
                  name="totalFee"
                  value={form.totalFee}
                  readOnly
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
                  placeholder="Enter here"
                  name="discountValue"
                  value={form.discountValue}
                  onChange={handleChange}
                  disabled={!form.discountType}
                />

                <Input
                  label="Final Fee"
                  name="finalFee"
                  value={form.finalFee}
                  readOnly
                />
              </div>
            )}

            {/* STEP 6 PARENT LOGIN */}
            {step === 6 && (
              <ParentLoginStep
                form={form}
                handleChange={handleChange}
                isEdit={isEdit}
              />
            )}

            {/* STEP 7 REVIEW */}
            {step === 7 && (
              <ReviewStep form={form} classes={classes} sections={sections} />
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

      {options.map((o, i) => {
        if (typeof o === "string") {
          return (
            <option key={i} value={o}>
              {o}
            </option>
          );
        }

        return (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        );
      })}
    </select>
  </div>
);
/* FILE */

const File = ({ label, name, onChange, existingUrl }) => {
  const [preview, setPreview] = useState(existingUrl || null);

  const handlePreview = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onChange(e);
  };

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

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

/* PARENT LOGIN STEP */
const ParentLoginStep = ({ form, handleChange, isEdit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid gap-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        These credentials will be used by the parent to log into the portal.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          name="username"
          value={form.username || ""}
          onChange={handleChange}
          placeholder="e.g. john.doe2024"
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEdit ? "New Password (leave blank to keep current)" : "Password *"}
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password || ""}
            onChange={handleChange}
            placeholder="Min. 5 characters"
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {form.temp_password && isEdit && (
        <div className="text-xs text-gray-400">
          Current saved password (dev only): <code>{form.temp_password}</code>
        </div>
      )}
    </div>
  );
};

/* REVIEW STEP */
const ReviewStep = ({ form, classes, sections }) => {
  const className =
    classes.find((c) => c._id === form.classId)?.name ||
    classes.find((c) => c._id === form.classId)?.className ||
    form.classId ||
    "—";
  const sectionName =
    sections.find((s) => s.value === form.sectionId)?.label ||
    form.sectionId ||
    "—";

  const initials =
    `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`.toUpperCase();

  const Section = ({ title, headerClass, children }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <div className={`px-4 py-2.5 border-b border-gray-200 ${headerClass}`}>
        <span className="text-sm font-medium text-gray-800">{title}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 bg-white">{children}</div>
    </div>
  );

  const Field = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="px-4 py-2.5 border-b border-r border-gray-100">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
          {label}
        </div>
        <div className="text-sm font-medium text-gray-800">{value}</div>
      </div>
    );
  };

  return (
    <div>
      {/* Header card */}
      <div className="flex items-center gap-4 p-4 mb-4 bg-gray-50 rounded-xl border border-gray-200">
        <div
          className="w-13 h-13 rounded-full bg-blue-100 flex items-center justify-center text-lg font-medium text-blue-800 shrink-0 overflow-hidden"
          style={{ width: 52, height: 52 }}
        >
          {form.documents?.studentPhoto?.url ? (
            <img
              src={form.documents.studentPhoto.url}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <div className="text-base font-medium text-gray-900">
            {form.firstName} {form.lastName}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {className}
            {sectionName ? ` • ${sectionName}` : ""}
            {form.rollNo ? ` • Roll ${form.rollNo}` : ""}
          </div>
        </div>
        {form.studentType && (
          <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-green-100 text-green-800 rounded-lg">
            {form.studentType}
          </span>
        )}
      </div>

      <Section title="Student details" headerClass="bg-gray-100">
        <Field label="First name" value={form.firstName} />
        <Field label="Last name" value={form.lastName} />
        <Field label="Date of birth" value={form.dob} />
        <Field label="Gender" value={form.gender} />
        <Field label="Blood group" value={form.bloodGroup} />
        <Field label="Admission date" value={form.admissionDate} />
      </Section>

      <Section title="Parent / guardian" headerClass="bg-blue-50">
        <Field label="Father name" value={form.fatherName} />
        <Field label="Father mobile" value={form.fatherMobile} />
        <Field label="Father email" value={form.fatherEmail} />
        <Field label="Mother name" value={form.motherName} />
        <Field label="Mother mobile" value={form.motherMobile} />
        <Field label="Mother email" value={form.motherEmail} />
        <Field label="Guardian name" value={form.guardianName} />
        <Field label="Guardian mobile" value={form.guardianMobile} />
        <Field label="Relation" value={form.guardianRelation} />
        <Field label="Address" value={form.address} />
      </Section>

      <Section title="Class details" headerClass="bg-green-50">
        <Field label="Class" value={className} />
        <Field label="Section" value={sectionName} />
        <Field label="Roll number" value={form.rollNo} />
        <Field label="Student type" value={form.studentType} />
      </Section>

      <Section title="Fee structure" headerClass="bg-amber-50">
        <Field
          label="Total annual fee"
          value={
            form.totalFee
              ? `₹${Number(form.totalFee).toLocaleString("en-IN")}`
              : null
          }
        />
        <Field label="Discount type" value={form.discountType} />
        <Field
          label="Discount value"
          value={
            form.discountValue
              ? form.discountType === "Percentage"
                ? `${form.discountValue}%`
                : `₹${form.discountValue}`
              : null
          }
        />
        <Field
          label="Final fee"
          value={
            form.finalFee
              ? `₹${Number(form.finalFee).toLocaleString("en-IN")}`
              : null
          }
        />
      </Section>

      <Section title="Parent login" headerClass="bg-purple-50">
        <Field label="Username" value={form.username} />
        <Field label="Password" value={form.password ? "••••••••" : null} />
      </Section>

      {/* Documents */}
      {form.documents &&
        Object.keys(form.documents).some((k) => form.documents[k]?.url) && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-pink-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-800">
                Documents uploaded
              </span>
            </div>
            <div className="flex flex-wrap gap-2 p-4 bg-white">
              {Object.entries(form.documents).map(([key, val]) =>
                val?.url ? (
                  <span
                    key={key}
                    className="px-3 py-1 text-xs font-medium bg-pink-50 text-pink-800 rounded-lg"
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        )}
    </div>
  );
};
