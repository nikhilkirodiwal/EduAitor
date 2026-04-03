import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-toastify";
import { useEffect, useRef } from "react";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user && !hasShownToast.current) {
      toast.error("Please login to continue");
      hasShownToast.current = true;
    }

    if (
      user &&
      allowedRoles &&
      !allowedRoles.includes(user.role) &&
      !hasShownToast.current
    ) {
      toast.warn("Access denied: insufficient permissions");
      hasShownToast.current = true;
    }
  }, [user, loading, allowedRoles]);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/admin/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "school_admin") {
      return <Navigate to="/school/dashboard" replace />;
    }
    if (user.role === "teacher_admin") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
