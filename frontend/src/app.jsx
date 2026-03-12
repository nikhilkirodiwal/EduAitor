import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

import Dashboard from "./pages/Dashboard";
import AccessControl from "./pages/AccessControl";
import RoleManagement from "./pages/RoleManagement";
import Schools from "./pages/Schools";
import SchoolManagement from "./pages/SchoolManagement";
import SchoolSubscription from "./pages/SchoolSubscription";
import SchoolView from "./components/SchoolView";

import SchoolDashboard from "./pages/SchoolDashboard";
import Students from "./pages/Students";
import StudentManagement from "./pages/StudentManagement";
import StudentView from "./components/StudentView";
import Teachers from "./pages/Teachers";
import TeacherManagement from "./pages/TeacherManagement";
import TeacherView from "./components/TeacherView";
import SectionManagement from "./pages/SectionManagement";
import Classes from "./pages/classes";
import Subjects from "./pages/subjects";
import ClassView from "./components/ClassView";

const App = () => {
  return (
    <Routes>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/admin/login" />} />

      {/* Login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="access-control" element={<AccessControl />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="schools" element={<Schools />} />
        <Route path="school-manage" element={<SchoolManagement />} />
        <Route path="subscription-plan" element={<SchoolSubscription />} />
        <Route path="school-view/:id" element={<SchoolView />}/>

        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Route>
      
      <Route
        path="/school"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SchoolDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="student-manage" element={<StudentManagement />} />
        <Route path="student-manage/:id" element={<StudentManagement />} />
        <Route path="student-view/:id" element={<StudentView />}/>
        <Route path="teachers" element={<Teachers />} />
        <Route path="teacher-manage" element={<TeacherManagement />} />
        <Route path="teacher-manage/:id" element={<TeacherManagement />} />
        <Route path="teacher-view/:id" element={<TeacherView />} />
        <Route path="section" element={<SectionManagement />} />
        <Route path="class" element={<Classes />} />
        <Route path="class-view/:id" element={<ClassView />} />
        <Route path="subject" element={<Subjects />} />

        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Route>

    </Routes>
  );
};

export default App;