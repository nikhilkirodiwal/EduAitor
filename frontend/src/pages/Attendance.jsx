import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";


function Attendance() {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // State to track status: { studentId: "Present" | "Absent" }
    const [attendanceRecord, setAttendanceRecord] = useState({});

    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchMetaData = async () => {
            try {
                const res = await axios.get(`${API}/attendance/meta`, { withCredentials: true });
                setClasses(res.data.teacher.assignedClasses);
                setSubjects(res.data.teacher.subjects);
            } catch (error) {
                console.error("Error fetching metadata:", error);
            }
        };
        fetchMetaData();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            if (selectedClassId && selectedSectionId) {
                try {
                    const res = await axios.get(`${API}/attendance/students/filter`, {
                        params: { classId: selectedClassId, sectionId: selectedSectionId },
                        withCredentials: true
                    });
                    setStudents(res.data.students);
                    
                    // Initialize all students as "Present" by default
                    const initialRecord = {};
                    res.data.students.forEach(std => {
                        initialRecord[std._id] = "Present";
                    });
                    setAttendanceRecord(initialRecord);
                } catch (error) {
                    console.error("Error fetching students:", error);
                    setStudents([]);
                }
            } else {
                setStudents([]);
            }
        };
        fetchStudents();
    }, [selectedClassId, selectedSectionId]);

    const toggleAttendance = (id) => {
        setAttendanceRecord(prev => ({
            ...prev,
            [id]: prev[id] === "Present" ? "Absent" : "Present"
        }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubject || !selectedDate) {
            toast.error("Please select Class, Section, Subject, and Date before saving.");
            return;
        }
        const payload = {
            classId: selectedClassId,
            sectionId: selectedSectionId,
            subjectId: selectedSubject,
            date: selectedDate,
            records: Object.keys(attendanceRecord).map(id => ({
                studentId: id,
                status: attendanceRecord[id]
            }))
        };
        toast.info("Saving attendance...");
        setTimeout(() => {
        toast.success("Attendance saved successfully!");
        }, 1000);
        console.log("Saving Attendance:", payload);
        // Add your axios.post here
    };

    const currentClass = classes.find(cls => cls._id === selectedClassId);
    const availableSections = currentClass ? currentClass.details : [];

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 Teacher Attendance Portal
            </h2>

            {/* Filter Section */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Class
                    </label>
                    <select style={selectStyle} value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(''); }}>
                        <option value="">--Select Class--</option>
                        {classes?.map((cls) => <option key={cls._id} value={cls._id}>{cls.name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                       Section
                    </label>
                    <select style={selectStyle} value={selectedSectionId} disabled={!selectedClassId} onChange={(e) => setSelectedSectionId(e.target.value)}>
                        <option value="">--Select Section--</option>
                        {availableSections.map((detail) => (
                            <option key={detail._id} value={detail.sectionId?._id}>{detail.sectionId?.name || "Section"}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                         Subject
                    </label>
                    <select style={selectStyle} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                        <option value="">--Select Subject--</option>
                        {subjects.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                         Date
                    </label>
                    <input type="date" style={selectStyle} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
            </div>

            {/* Student List Section */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '15px', background: '#4A90E2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Student List ({students.length})</h3>
                    {students.length > 0 && (
                        <button onClick={handleSaveAttendance} style={saveBtnStyle}>
                            Save Attendance
                        </button>
                    )}
                </div>

                {students.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#eee', textAlign: 'left' }}>
                                <th style={thStyle}>Roll No</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => {
                                const isPresent = attendanceRecord[student._id] === "Present";
                                return (
                                    <tr key={student._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{student.rollNo || 'N/A'}</td>
                                        <td style={tdStyle}>{student.firstName}</td>
                                        <td style={tdStyle}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                background: isPresent ? '#e6fffa' : '#fff5f5',
                                                color: isPresent ? '#38a169' : '#e53e3e'
                                            }}>
                                                {attendanceRecord[student._id]}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button 
                                                onClick={() => toggleAttendance(student._id)}
                                                style={{
                                                    ...toggleBtnStyle,
                                                    background: isPresent ? '#38a169' : '#e53e3e'
                                                }}
                                            >
                                                {isPresent ?'✅' : '❌'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>

                        <p>No students found. Select Class and Section to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline Styles
const selectStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' };
const thStyle = { padding: '12px 15px' };
const tdStyle = { padding: '12px 15px' };
const saveBtnStyle = { background: 'white', color: '#2d3748', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',fontWeight: 'bold' };
const toggleBtnStyle = { color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' };

export default Attendance;