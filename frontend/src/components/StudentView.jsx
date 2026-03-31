import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const StudentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */

  const fetchStudent = async () => {
    try {
      const res = await axios.get(`${API}/students/${id}`, {
        withCredentials: true,
      });

      setStudent(res.data.data);
    } catch {
      toast.error("Failed to load student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  if (loading) return <Loader />;

  if (!student) return <Empty />;

  const docs = student.documents || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Student Profile</h1>

        <button
          onClick={() => navigate(`/school/student-manage/${student._id}`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Edit Student
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col sm:flex-row gap-6 items-center">
        <img
          src={docs.studentPhoto?.url || "https://via.placeholder.com/120"}
          alt="student"
          className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
        />

        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {student.firstName} {student.lastName}
          </h2>

          <p className="text-gray-500 mt-1">
            Class {student.classId?.name || "-"}{" "}
            {student.sectionId?.name && `- ${student.sectionId.name}`}
          </p>

          <p className="text-gray-500">Roll No: {student.rollNo || "-"}</p>

          <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600 font-medium">
            {student.studentType || "Student"}
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card title="Student Details">
          <Info label="First Name" value={student.firstName} />
          <Info label="Last Name" value={student.lastName} />
          <Info label="Gender" value={student.gender} />
          <Info label="Blood Group" value={student.bloodGroup} />
          <Info label="DOB" value={formatDate(student.dob)} />
          <Info
            label="Admission Date"
            value={formatDate(student.admissionDate)}
          />
        </Card>

        <Card title="Class Details">
          <Info label="Class" value={student.classId?.name} />
          <Info label="Section" value={student.sectionId?.name} />
          <Info label="Roll Number" value={student.rollNo} />
          <Info label="Student Type" value={student.studentType} />
        </Card>

        <Card title="Fee Details">
          <Info label="Total Fee" value={`₹ ${student.totalFee || 0}`} />
          <Info label="Discount Type" value={student.discountType} />
          <Info label="Discount Value" value={student.discountValue} />
          <Info label="Final Fee" value={`₹ ${student.finalFee || 0}`} />
        </Card>

        <Card title="Parent Details">
          <Info label="Father Name" value={student.fatherName} />
          <Info label="Father Mobile" value={student.fatherMobile} />
          <Info label="Father Email" value={student.fatherEmail} />

          <Divider />

          <Info label="Mother Name" value={student.motherName} />
          <Info label="Mother Mobile" value={student.motherMobile} />
          <Info label="Mother Email" value={student.motherEmail} />
        </Card>

        <Card title="Guardian Details">
          <Info label="Guardian Name" value={student.guardianName} />
          <Info label="Guardian Mobile" value={student.guardianMobile} />
          <Info label="Relation" value={student.guardianRelation} />
          <Info label="Address" value={student.address} />
        </Card>

        <Card title="Documents">
          <Doc label="Birth Certificate" file={docs.birthCertificate} />
          <Doc label="Transfer Certificate" file={docs.transferCertificate} />
          <Doc label="Student Aadhar" file={docs.studentAadhar} />
          <Doc label="Father Aadhar" file={docs.fatherAadhar} />
          <Doc label="Mother Aadhar" file={docs.motherAadhar} />
        </Card>
      </div>
    </div>
  );
};

export default StudentView;

/* ================= COMPONENTS ================= */

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="space-y-2 text-sm">{children}</div>
  </div>
);

const Info = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-right">{value || "-"}</span>
  </div>
);

const Doc = ({ label, file }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>

    {file?.url ? (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="text-indigo-600 font-medium hover:underline"
      >
        View
      </a>
    ) : (
      <span className="text-gray-400">Not Uploaded</span>
    )}
  </div>
);

const Divider = () => <hr className="my-2" />;

const Loader = () => (
  <div className="p-10 text-center text-gray-500">Loading...</div>
);

const Empty = () => (
  <div className="p-10 text-center text-gray-400">Student not found</div>
);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toISOString().slice(0, 10);
};
