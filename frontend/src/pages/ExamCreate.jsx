import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";

function ExamCreate() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    className: '', subject: '', examDate: '', dayOfWeek: '',
    startTime: '', endTime: '', totalMarks: '', passingMarks: ''
  });

  const API = import.meta.env.VITE_API_URL;

  const getDayName = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(dateString));
  };

  const formatTimeTo12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const getSchoolId = () => JSON.parse(localStorage.getItem("userData"))?.school_id;

  useEffect(() => {
    const fetchData = async () => {
      const schoolId = getSchoolId();
      try {
        const [cRes, sRes] = await Promise.all([
          axios.get(`${API}/classes/all`, { params: { schoolId } }),
          axios.get(`${API}/subjects/all`, { params: { schoolId } })
        ]);
        setClasses(cRes.data.classes || []);
        setSubjects(sRes.data.subjects || []);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  useEffect(() => { fetchExams(); }, [selectedClassFilter]);

  const fetchExams = async () => {
    const schoolId = getSchoolId();
    setLoading(true);
    try {
      const url = `${API}/exam/list?schoolId=${schoolId}${selectedClassFilter ? `&classId=${selectedClassFilter}` : ''}`;
      const res = await axios.get(url);
      setExams(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  
  const [confirmModal, setConfirmModal] = useState({
  isOpen: false,
  type: '', // 'delete' or 'update'
  data: null
});
// 1. CLICK ACTIONS: Just prepare the data or open the form
const handleEditClick = (exam) => {
  setEditingId(exam._id);
  setFormData({
    className: exam.className?._id || '',
    subject: exam.subject,
    examDate: exam.examDate.split('T')[0],
    dayOfWeek: exam.dayOfWeek,
    startTime: exam.startTime,
    endTime: exam.endTime,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks
  });
  setIsModalOpen(true);
};

const handleDeleteClick = (id) => {
  setConfirmModal({ isOpen: true, type: 'delete', data: id });
};

// 2. FORM HANDLER: Logic for New vs Update
const handleFormSubmit = (e) => {
  e.preventDefault();
  // Basic validation before even showing the popup
  if (parseInt(formData.passingMarks) >= parseInt(formData.totalMarks)) {
    return toast.error("Passing marks must be less than total marks");
  }

  if (editingId) {
    // If updating, show confirmation popup
    setConfirmModal({ isOpen: true, type: 'update', data: formData });
  } else {
    // If new exam, just call the API directly (or show popup if you prefer)
    executeFinalAction('create');
  }
};

// 3. DATABASE EXECUTION: The only function that talks to your Server
const executeFinalAction = async (overrideType) => {
  const schoolId = getSchoolId();
  const { type, data } = confirmModal;
  const actionType = overrideType || type; // Supports 'create', 'update', or 'delete'
  
  const loadingToast = toast.loading("Processing...");

  try {
    if (actionType === 'delete') {
      await axios.delete(`${API}/exam/delete/${data}`, { params: { schoolId } });
      toast.success("Exam deleted successfully", { id: loadingToast });
    } 
    else if (actionType === 'update') {
      await axios.put(`${API}/exam/edit/${editingId}`, { ...formData, schoolId });
      toast.success("Changes saved successfully", { id: loadingToast });
    } 
    else if (actionType === 'create') {
      await axios.post(`${API}/exam/create`, { ...formData, schoolId });
      toast.success("New exam scheduled", { id: loadingToast });
    }

    // Cleanup
    setIsModalOpen(false);
    setConfirmModal({ isOpen: false, type: '', data: null });
    resetForm();
    fetchExams();
  } catch (err) {
    const msg = err.response?.data?.message || "Operation failed";
    toast.error(msg, { id: loadingToast });
  }
  finally {
    // 4. THE ULTIMATE SAFETY: If the toast is still stuck for any reason, 
    // this ensures it disappears after a short delay.
    setTimeout(() => toast.dismiss(loadingToast), 500);
  }
};

  const resetForm = () => {
    setEditingId(null);
    setFormData({ className: '', subject: '', examDate: '', dayOfWeek: '', startTime: '', endTime: '', totalMarks: '', passingMarks: '' });
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-indigo-950">Exams</h1>
          <p className="text-slate-500 text-sm">Schedule and manage school tests</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
        >
          + New Exam
        </button>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Filter:</span>
        <select 
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>Class {c.name}</option>)}
        </select>
      </div>

      {/* Main List */}
      <div className="max-w-7xl mx-auto">
        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="p-4">Subject & Class</th>
                <th className="p-4">Date & Day</th>
                <th className="p-4">Time</th>
                <th className="p-4">Marks</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{exam.subject}</div>
                    <div className="text-xs text-slate-500">Class {exam.className?.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-sm">{new Date(exam.examDate).toLocaleDateString('en-GB')}</div>
                    <div className="text-[10px] font-bold text-indigo-500 uppercase">{exam.dayOfWeek}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {formatTimeTo12h(exam.startTime)} - {formatTimeTo12h(exam.endTime)}
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 font-bold">{exam.passingMarks}</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="font-bold">{exam.totalMarks}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEditClick(exam)} className="text-indigo-600   bg-slate-100 font-bold text-xs hover:underline cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteClick(exam._id)} className="text-red-400 bg-red-50 font-bold text-xs hover:underline cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - Shown only on Mobile */}
        <div className="md:hidden space-y-4">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-lg text-slate-800">{exam.subject}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold uppercase">Class {exam.className?.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{new Date(exam.examDate).toLocaleDateString('en-GB')}</div>
                  <div className="text-[10px] text-indigo-500 font-bold uppercase">{exam.dayOfWeek}</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm py-3 border-y border-slate-50 my-3">
                <span className="text-slate-500">{formatTimeTo12h(exam.startTime)} - {formatTimeTo12h(exam.endTime)}</span>
                <span className="font-bold text-slate-700">{exam.passingMarks} / {exam.totalMarks} Marks</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() =>handleEditClick(exam)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-xs cursor-pointer">Edit</button>
                <button onClick={() =>handleDeleteClick(exam._id)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg font-bold text-xs cursor-pointer">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Modal / Slide-over */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl md:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 text-white shrink-0">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Exam' : 'Schedule Exam'}</h2>
              <p className="text-indigo-100 text-xs opacity-80">Enter exam details below</p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Class</label>
                  <select required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                    value={formData.className} onChange={(e) => setFormData({...formData, className: e.target.value})}>
                    <option value="">Pick Class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>Class {c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                  <select required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                    value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}>
                    <option value="">Pick Subject</option>
                    {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input type="date" required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl"
                    value={formData.examDate} onChange={(e) => setFormData({...formData, examDate: e.target.value, dayOfWeek: getDayName(e.target.value)})} />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Day</label>
                  <div className="mt-1 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm text-center border border-indigo-100 uppercase">
                    {formData.dayOfWeek || '---'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</label>
                  <input type="time" required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl"
                    value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">End Time</label>
                  <input type="time" required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl"
                    value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Marks</label>
                  <input type="number" required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl"
                    value={formData.totalMarks} onChange={(e) => setFormData({...formData, totalMarks: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Passing Marks</label>
                  <input type="number" required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl"
                    value={formData.passingMarks} onChange={(e) => setFormData({...formData, passingMarks: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700">
                  {editingId ? 'Update Exam' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmModal.isOpen && (
  <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
    ></div>
    
    {/* Popup Card */}
    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 ${
        confirmModal.type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'
      }`}>
        {confirmModal.type === 'delete' ? (
          <span className="text-3xl">🗑️</span>
        ) : (
          <span className="text-3xl">💾</span>
        )}
      </div>
      
      <h3 className="text-2xl font-black text-slate-800 leading-tight">
        {confirmModal.type === 'delete' ? 'Delete Exam?' : 'Save Changes?'}
      </h3>
      <p className="text-slate-500 text-sm mt-3 px-4">
        {confirmModal.type === 'delete' 
          ? "This will remove the exam and all associated results permanently." 
          : "Are you sure you want to update the exam schedule with these new details?"}
      </p>

      <div className="flex flex-col gap-3 mt-8">
        <button 
          onClick={() => executeFinalAction()}
          className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${
            confirmModal.type === 'delete' ? 'bg-red-500 shadow-red-200' : 'bg-indigo-600 shadow-indigo-200'
          }`}
        >
          {confirmModal.type === 'delete' ? 'Yes, Delete Permanentally' : 'Yes, Confirm Changes'}
        </button>
        
        <button 
          onClick={() => setConfirmModal({ isOpen: false, type: '', data: null })}
          className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default ExamCreate;