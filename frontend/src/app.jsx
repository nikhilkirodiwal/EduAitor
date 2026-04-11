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
import Class from "./pages/Class";
import ClassView from "./components/ClassView";
import Subject from "./pages/Subject";
import TimeTable from "./pages/TimeTable";
import FeeStructure from "./pages/FeeStructure";
import Event from "./pages/Event";
import EventView from "./components/EventView";
import Notice from "./pages/Notice";
import FeeCollection from "./pages/FeeCollection";
import FeeHistory from "./pages/FeeHistory";
import Defaulters from "./pages/Defaulters";
import Transport from "./pages/Transport";
import DriverManagement from "./pages/DriverManagement";
import BusManagement from "./pages/BusManagement";
import RouteManagement from "./pages/RouteManagement";
import ExamCreate from "./pages/ExamCreate";
import LibraryManagement from "./pages/LibraryManagement";
import SchoolDetail from "./pages/SchoolDetail";
import TeacherDashboard from "./pages/TeacherDashboard";
import Syllabus from "./pages/Syllabus";
import Assignment from "./pages/Assignment";
import Calendar from "./pages/Calendar";
import Attendance from "./pages/Attendance";
import AttendanceReportTeacher from "./pages/AttendanceReportTeacher";
import AttendanceReportPrincipal from "./pages/AttendanceReportPrincipal";
import AddSchool from "./pages/AddSchool";
import Group from "./pages/Group";
import DiaryPrincipal from "./pages/DiaryPrincipal";
import DiaryTeacher from "./pages/DiaryTeacher";
import ParentDashboard from "./pages/ParentDashboard";
import ParentAssignment from "./pages/ParentAssignment";
import SchoolMenu from "./pages/SchoolMenu";
import TeacherAssignmentResult from "./pages/TeacherAssignmentResult";
import ParentAssignmentResult from "./pages/ParentAssignmentResult";
import TeacherEvent from "./pages/TeacherEvent";
import TeacherNotice from "./pages/TeacherNotice";
import TeacherCalendar from "./pages/TeacherCalendar";
import ParentMenu from "./pages/ParentMenu";
import TeacherMenu from "./pages/TeacherMenu";
import SuperAdminMenu from "./pages/SuperAdminMenu";
import ReadTimetable from "./pages/ReadTimetable";

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
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="menu" element={<SuperAdminMenu />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="access-control" element={<AccessControl />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="schools" element={<Schools />} />
        <Route path="add-school" element={<AddSchool />} />
        <Route path="school-manage" element={<SchoolManagement />} />
        <Route path="school-detail" element={<SchoolDetail />} />
        <Route path="subscription-plan" element={<SchoolSubscription />} />
        <Route path="school-view/:id" element={<SchoolView />} />

        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Route>

      <Route
        path="/school"
        element={
          <ProtectedRoute allowedRoles={["school_admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="menu" element={<SchoolMenu />} />
        <Route path="dashboard" element={<SchoolDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="student-manage" element={<StudentManagement />} />
        <Route path="student-manage/:id" element={<StudentManagement />} />
        <Route path="student-view/:id" element={<StudentView />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teacher-manage" element={<TeacherManagement />} />
        <Route path="teacher-manage/:id" element={<TeacherManagement />} />
        <Route path="teacher-view/:id" element={<TeacherView />} />
        <Route path="section" element={<SectionManagement />} />
        <Route path="class" element={<Class />} />
        <Route path="class-view/:id" element={<ClassView />} />
        <Route path="subject" element={<Subject />} />
        <Route path="syllabus" element={<Syllabus />} />
        <Route path="attendance" element={<AttendanceReportPrincipal />} />
        <Route path="timetable" element={<TimeTable />} />
        <Route path="fee-structure" element={<FeeStructure />} />
        <Route path="fee-collection" element={<FeeCollection />} />
        <Route path="fee-history" element={<FeeHistory />} />
        <Route path="defaulters" element={<Defaulters />} />
        <Route path="group" element={<Group />} />
        <Route path="diary" element={<DiaryPrincipal />} />
        <Route path="event" element={<Event />} />
        <Route path="event/:id" element={<EventView />} />
        <Route path="notice" element={<Notice />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="transport" element={<Transport />} />
        <Route path="transport-driver" element={<DriverManagement />} />
        <Route path="transport-bus" element={<BusManagement />} />
        <Route path="transport-route" element={<RouteManagement />} />
        <Route path="exam-structure" element={<ExamCreate />} />
        <Route path="library" element={<LibraryManagement />} />

        <Route path="*" element={<Navigate to="/school/dashboard" />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher_admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="menu" element={<TeacherMenu />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="assignment" element={<Assignment />} />
        <Route path="assignment/result" element={<TeacherAssignmentResult />} />
        <Route path="attendance/mark" element={<Attendance />} />
        <Route path="attendance/report" element={<AttendanceReportTeacher />} />
        <Route path="syllabus" element={<Syllabus />} />
        <Route path="diary" element={<DiaryTeacher />} />
        <Route path="event" element={<TeacherEvent />} />
        <Route path="notice" element={<TeacherNotice />} />
        <Route path="calendar" element={<TeacherCalendar />} />
        <Route path="group" element={<Group />} />
        <Route path="timetable" element={<ReadTimetable />} />

        <Route path="*" element={<Navigate to="/teacher/dashboard" />} />
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={["student_admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="menu" element={<ParentMenu />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="assignment" element={<ParentAssignment />} />
        <Route path="assignment/result" element={<ParentAssignmentResult />} />
        <Route path="timetable" element={<ReadTimetable />} />
        {/* <Route
          path="timetable"
          element={
            <ReadTimetable
              preselectedClassId={student.classId}
              preselectedDetailId={student.detailId}
              showClassSelector={false}
            />
          }
        /> */}

        <Route path="*" element={<Navigate to="/parent/dashboard" />} />
      </Route>
    </Routes>
  );
};

export default App;
