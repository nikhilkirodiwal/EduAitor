import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function FeeCollection() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const API = import.meta.env.VITE_API_URL;
  /* Fetch all classes for the dropdown */
  const fetchClasses = async () => {
    // 1. Get the string from localStorage
    const savedUserData = localStorage.getItem("userData");

    // 2. Parse it back into an object
    const userData = savedUserData ? JSON.parse(savedUserData) : null;
    const schoolId = userData?.school_id;

    if (!schoolId) {
      console.error("No School ID found");
      return;
    }
    try {
      const { data } = await axios.get(`${API}/classes/all`, {
        params: { schoolId },
      });
      setClasses(data.classes);
    } catch {
      console.error("Failed to load classes");
    }
  };

  //   fetch student
  const fetchStudents = async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const schoolId = userData?.school_id;

    if (!schoolId) return alert("school id not found");
    try {
      const res = await axios.get(`${API}/students`, {
        params: { schoolId },
      });
      setStudents(res.data.data);
      setFilteredStudents(res.data.data);
      console.log(res.data.data);
    } catch {
      toast.error("Failed to load students");
    }
  };
  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);

    const query = inputValue.toLowerCase();

    const filtered = students.filter((s) => {
      // Check Class
      const isClassMatch = !classId
        ? true
        : s.classId === classId || s.classId?._id === classId;

      // Check Search
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const isSearchMatch =
        fullName.includes(query) || s.studentId.toLowerCase().includes(query);

      return isClassMatch && isSearchMatch;
    });

    setFilteredStudents(filtered);
  };

  const handleinput = (e) => {
    const query = e.target.value.toLowerCase();
    setInputValue(query); // Update the search box state

    const filtered = students.filter((s) => {
      // 1. Search Match (Name or ID)
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const isSearchMatch =
        fullName.includes(query) || s.studentId.toLowerCase().includes(query);

      // 2. Class Match
      // If selectedClass is empty (""), it's 'All Classes', so always true.
      // Otherwise, check if the student's classId matches.
      const isClassMatch = !selectedClass
        ? true
        : s.classId === selectedClass || s.classId?._id === selectedClass;

      return isSearchMatch && isClassMatch;
    });

    setFilteredStudents(filtered);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amountToPay, setAmountToPay] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  // This function triggers when you click the "Collect Fee" button in your table
  const handleCollectFee = (student) => {
    setSelectedStudent(student);
    setAmountToPay(student.totalDue); // Default to total due amount
    setIsModalOpen(true);
  };

  const confirmPayment = async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const schoolId = userData?.school_id;

    if (!amountToPay || Number(amountToPay) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const payload = {
      studentId: selectedStudent._id,
      amountPaid: Number(amountToPay),
      paymentMode: paymentMode,
      remarks: "Fee collection via Accountant",
      schoolId: schoolId,
    };

    const loadingToast = toast.loading("Processing payment...");
    let isSuccess = false; // 👈 flag to track what happened

    try {
      const response = await axios.post(`${API}/fee-collect`, payload);
      toast.dismiss(loadingToast);

      if (response.data.success) {
        isSuccess = true; // 👈 mark success
        toast.success(`₹${amountToPay} collected successfully! 🎉`);
      } else {
        toast.error(response.data.message || "Payment failed");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Something went wrong");
    }

    // ✅ Runs AFTER try/catch — errors here won't trigger error toast
    if (isSuccess) {
      setIsModalOpen(false);
      setSelectedStudent(null);
      setAmountToPay("");
      setPaymentMode("Cash");

      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const schoolId = userData?.school_id;

        // 1. Fetch the fresh data from the server
        const res = await axios.get(`${API}/students`, {
          params: { schoolId },
        });
        const freshStudents = res.data.data;

        if (freshStudents) {
          // 2. Update the master list
          setStudents(freshStudents);

          // 3. Re-apply the current filters to the fresh data
          const query = inputValue.toLowerCase();

          const refreshedFilteredList = freshStudents.filter((s) => {
            const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();

            // Check if matches current search query
            const matchesSearch =
              fullName.includes(query) ||
              s.studentId.toLowerCase().includes(query);

            /* ─────────────────────────────────────────────────────────────
               CHANGE HERE: We match based on ID now, not className string
               ───────────────────────────────────────────────────────────── */
            const matchesClass = selectedClass
              ? s.classId === selectedClass || s.classId?._id === selectedClass
              : true;

            return matchesSearch && matchesClass;
          });

          // 4. Finally, update the UI list
          setFilteredStudents(refreshedFilteredList);
        }
      } catch (error) {
        console.error("Error refreshing student list:", error);
        toast.error(
          "Payment successful, but failed to refresh the list. Please reload.",
        );
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Fee Collection</h1>
      <div className="fc-container">
        <div className="fc-search">
          <input
            type="text"
            placeholder="Search by student name or ID"
            value={inputValue}
            className="fc-input w-2xs border-2 rounded-md px-4 py-1 mb-2.5"
            onInput={handleinput}
          />
        </div>

        {classes.length === 0 ? (
          <div> Classs not found</div>
        ) : (
          <div className="flex flex-col gap-2 max-w-xs">
            <label className="text-sm font-semibold text-gray-700">
              Select class
            </label>
            <select
              onChange={handleClassChange}
              value={selectedClass}
              className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
              No students found for this class.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID / Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Deu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">
                          {student.studentId}
                        </div>
                        <div className="text-xs text-gray-400">
                          Roll: {student.rollNo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.gender} | {student.bloodGroup}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {student.studentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          ₹{student.totalDue}
                        </div>
                        {student.discountValue > 0 && (
                          <div className="text-xs text-red-500">
                            -{student.discountValue} Off
                          </div>
                        )}
                      </td>
                      <td className=" whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCollectFee(student)}
                          className="inline-flex items-center px-4 py-2 border border-transparent 
                    text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>{" "}
      {/* end of container div */}
      {/* popup modal for collect payemnt - */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[3px]"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-sm sm:max-w-lg md:max-w-xl max-h-[90vh] sm:max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
            {/* 1. FIXED HEADER */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Collect Fee
                </h2>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                  Payment Portal
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 2. SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
              {/* Student Info Card */}
              <div className="bg-blue-50/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-4 border border-blue-100/50">
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {selectedStudent?.firstName?.charAt(0) || "S"}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-slate-800 leading-none">
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Roll No: {selectedStudent?.rollNo} •{" "}
                    {selectedStudent?.studentId}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Total
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    ₹{selectedStudent?.finalFee}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                  <p className="text-[9px] font-bold text-green-500 uppercase">
                    Paid
                  </p>
                  <p className="text-sm font-bold text-green-700">
                    ₹{selectedStudent?.totalPaid || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <p className="text-[9px] font-bold text-red-400 uppercase">
                    Due
                  </p>
                  <p className="text-sm font-bold text-red-600">
                    ₹{selectedStudent?.totalDue}
                  </p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Amount to Collect
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amountToPay}
                      onChange={(e) => setAmountToPay(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {["Cash", "UPI", "Cheque", "Online"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          paymentMode === mode
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-50 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. FIXED FOOTER ACTIONS */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 bg-white border-t border-slate-50 flex gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="flex-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeCollection;
