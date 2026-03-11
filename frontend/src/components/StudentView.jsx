import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const StudentView = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [student,setStudent] = useState(null);
  const [loading,setLoading] = useState(true);

  /* ================= FETCH STUDENT ================= */

  const fetchStudent = async () => {

    try{

      const res = await axios.get(`${API}/students/${id}`);

      setStudent(res.data.data);

    }catch{

      toast.error("Failed to load student");

    }finally{

      setLoading(false);

    }

  };

  useEffect(()=>{
    fetchStudent();
  },[]);

  if(loading) return <div className="p-10">Loading...</div>;

  if(!student) return <div className="p-10">Student not found</div>;

  const docs = student.documents || {};

  return (

    <div className="p-8 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex justify-between mb-6">

        <h1 className="text-3xl font-bold">
          Student Details
        </h1>

        <button
          onClick={()=>navigate(`/school/student-manage/${student._id}`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Edit Student
        </button>

      </div>

      {/* PROFILE */}

      <div className="bg-white rounded-xl shadow p-6 mb-6 flex gap-6 items-center">

        <img
          src={docs.studentPhoto?.url || "https://via.placeholder.com/120"}
          alt="student"
          className="w-28 h-28 rounded-full object-cover border"
        />

        <div>

          <h2 className="text-2xl font-semibold">
            {student.firstName} {student.lastName}
          </h2>

          <p className="text-gray-500">
            Class {student.className} - {student.section}
          </p>

          <p className="text-gray-500">
            Roll No: {student.rollNo}
          </p>

        </div>

      </div>

      {/* STUDENT INFO */}

      <div className="grid md:grid-cols-2 gap-6">

        {/* STUDENT DETAILS */}

        <Card title="Student Details">

          <Info label="First Name" value={student.firstName}/>
          <Info label="Last Name" value={student.lastName}/>
          <Info label="Gender" value={student.gender}/>
          <Info label="Blood Group" value={student.bloodGroup}/>
          <Info label="DOB" value={student.dob?.slice(0,10)}/>
          <Info label="Admission Date" value={student.admissionDate?.slice(0,10)}/>

        </Card>


        {/* CLASS DETAILS */}

        <Card title="Class Details">

          <Info label="Class" value={student.className}/>
          <Info label="Section" value={student.section}/>
          <Info label="Roll Number" value={student.rollNo}/>
          <Info label="Student Type" value={student.studentType}/>

        </Card>


        {/* PARENT DETAILS */}

        <Card title="Parent Details">

          <Info label="Father Name" value={student.fatherName}/>
          <Info label="Father Mobile" value={student.fatherMobile}/>
          <Info label="Father Email" value={student.fatherEmail}/>

          <hr className="my-2"/>

          <Info label="Mother Name" value={student.motherName}/>
          <Info label="Mother Mobile" value={student.motherMobile}/>
          <Info label="Mother Email" value={student.motherEmail}/>

        </Card>


        {/* GUARDIAN */}

        <Card title="Guardian Details">

          <Info label="Guardian Name" value={student.guardianName}/>
          <Info label="Guardian Mobile" value={student.guardianMobile}/>
          <Info label="Relation" value={student.guardianRelation}/>
          <Info label="Address" value={student.address}/>

        </Card>


        {/* FEE DETAILS */}

        <Card title="Fee Details">

          <Info label="Total Fee" value={`₹ ${student.totalFee}`}/>
          <Info label="Discount Type" value={student.discountType}/>
          <Info label="Discount Value" value={student.discountValue}/>
          <Info label="Final Fee" value={`₹ ${student.finalFee}`}/>

        </Card>


        {/* DOCUMENTS */}

        <Card title="Documents">

          <Doc label="Birth Certificate" file={docs.birthCertificate}/>
          <Doc label="Transfer Certificate" file={docs.transferCertificate}/>
          <Doc label="Student Aadhar" file={docs.studentAadhar}/>
          <Doc label="Father Aadhar" file={docs.fatherAadhar}/>
          <Doc label="Mother Aadhar" file={docs.motherAadhar}/>

        </Card>

      </div>

    </div>

  );

};

export default StudentView;


/* ================= CARD ================= */

const Card = ({title,children}) => (

  <div className="bg-white rounded-xl shadow p-6">

    <h3 className="text-lg font-semibold mb-4">
      {title}
    </h3>

    <div className="space-y-2">
      {children}
    </div>

  </div>

);


/* ================= INFO ================= */

const Info = ({label,value}) => (

  <div className="flex justify-between text-sm">

    <span className="text-gray-500">
      {label}
    </span>

    <span className="font-medium">
      {value || "-"}
    </span>

  </div>

);


/* ================= DOCUMENT ================= */

const Doc = ({label,file}) => (

  <div className="flex justify-between text-sm">

    <span className="text-gray-500">
      {label}
    </span>

    {file?.url ? (

      <a
        href={file.url}
        target="_blank"
        className="text-indigo-600 font-medium"
      >
        View
      </a>

    ) : (

      <span className="text-gray-400">
        Not Uploaded
      </span>

    )}

  </div>

);