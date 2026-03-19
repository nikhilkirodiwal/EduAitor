import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaTrash, FaEdit, FaRoute, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;
const userData = JSON.parse(localStorage.getItem("userData"));
const schoolId = userData?.school_id;

const EMPTY_FORM = {
  name: "",
  bus: "",
  driver: "",
  stops: "",
  students: "",
  startTime: "",
  endTime: "",
  stopsList: "",
};

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedRoute, setExpandedRoute] = useState(null);

  // Modals
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formModal, setFormModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const [toggleModal, setToggleModal] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);

  /* ── FETCH ────────────────────────────────────────────────────────────── */

  const fetchRoutes = async () => {
    if (!schoolId) return toast.error("School ID not found");
    try {
      setLoading(true);
      const res = await axios.get(`${API}/transport/routes`, {
        params: { school_id: schoolId },
      });
      setRoutes(res.data.data || []);
    } catch {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  /* ── ADD / EDIT ───────────────────────────────────────────────────────── */

  const openAdd = () => {
    setIsEdit(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormModal(true);
  };

  const openEdit = (route) => {
    setIsEdit(true);
    setEditId(route._id);
    setForm({
      name: route.name || "",
      bus: route.bus || "",
      driver: route.driver || "",
      stops: String(route.stops || ""),
      students: String(route.students || ""),
      startTime: route.startTime || "",
      endTime: route.endTime || "",
      stopsList: Array.isArray(route.stopsList)
        ? route.stopsList.join(", ")
        : route.stopsList || "",
    });
    setFormModal(true);
  };

  const handleFormSubmit = async () => {
    if (!form.name.trim()) return toast.error("Route name is required");
    try {
      setFormLoading(true);
      const payload = {
        school_id: schoolId,
        name: form.name.trim(),
        bus: form.bus.trim(),
        driver: form.driver.trim(),
        stops: Number(form.stops) || 0,
        students: Number(form.students) || 0,
        startTime: form.startTime.trim(),
        endTime: form.endTime.trim(),
        stopsList: form.stopsList
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (isEdit) {
        await axios.put(`${API}/transport/routes/${editId}`, payload);
        toast.success("Route updated successfully");
      } else {
        await axios.post(`${API}/transport/routes`, payload);
        toast.success("Route added successfully");
      }
      setFormModal(false);
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save route");
    } finally {
      setFormLoading(false);
    }
  };

  /* ── DELETE ───────────────────────────────────────────────────────────── */

  const handleDeleteClick = (route) => {
    setDeleteTarget(route);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/transport/routes/${deleteTarget._id}`, {
        params: { school_id: schoolId },
      });
      toast.success("Route deleted successfully");
      setDeleteModal(false);
      setDeleteTarget(null);
      if (expandedRoute === deleteTarget._id) setExpandedRoute(null);
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete route");
    }
  };

  /* ── SUSPEND / ACTIVATE TOGGLE ────────────────────────────────────────── */

  const handleToggleClick = (route) => {
    setToggleTarget(route);
    setToggleModal(true);
  };

  const confirmToggle = async () => {
    const nextStatus =
      toggleTarget.status === "Active" ? "Suspended" : "Active";
    try {
      await axios.patch(
        `${API}/transport/routes/${toggleTarget._id}/status`,
        { school_id: schoolId, status: nextStatus }
      );
      toast.success(
        nextStatus === "Suspended"
          ? `"${toggleTarget.name}" suspended`
          : `"${toggleTarget.name}" activated`
      );
      setToggleModal(false);
      setToggleTarget(null);
      fetchRoutes();
    } catch {
      toast.error("Status update failed");
    }
  };

  /* ── FILTER ───────────────────────────────────────────────────────────── */

  const filtered = routes.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch =
      r.name?.toLowerCase().includes(s) ||
      r.bus?.toLowerCase().includes(s) ||
      r.driver?.toLowerCase().includes(s);
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  /* ── STATS ────────────────────────────────────────────────────────────── */

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.status === "Active").length;
  const suspendedRoutes = routes.filter((r) => r.status === "Suspended").length;
  const totalStudents = routes.reduce((a, r) => a + (r.students || 0), 0);

  /* ── LOADING ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Route Management
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Configure and monitor school transport routes
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-blue-700 transition"
        >
          <FaPlus />
          Add Route
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="TOTAL ROUTES" value={totalRoutes} color="blue" />
        <StatCard title="ACTIVE" value={activeRoutes} color="green" />
        <StatCard title="SUSPENDED" value={suspendedRoutes} color="red" />
        <StatCard title="STUDENTS COVERED" value={totalStudents} color="purple" />
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Route Directory</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search route, bus, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Route</th>
                <th className="p-4 text-left">Bus / Driver</th>
                <th className="p-4 text-left">Stops</th>
                <th className="p-4 text-left">Students</th>
                <th className="p-4 text-left">Timing</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((route) => (
                <>
                  <tr
                    key={route._id}
                    className="border-t hover:bg-gray-50"
                  >
                    {/* ROUTE NAME */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaRoute className="text-sm" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {route.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {route.routeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* BUS / DRIVER */}
                    <td className="p-4">
                      <p className="font-medium text-blue-700">
                        {route.bus || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {route.driver || "—"}
                      </p>
                    </td>

                    {/* STOPS */}
                    <td className="p-4 text-gray-700">
                      {route.stops ?? 0} stops
                    </td>

                    {/* STUDENTS */}
                    <td className="p-4 text-gray-700">
                      {route.students ?? 0}
                    </td>

                    {/* TIMING */}
                    <td className="p-4 text-gray-600 text-xs">
                      {route.startTime && route.endTime
                        ? `${route.startTime} – ${route.endTime}`
                        : "—"}
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          route.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setExpandedRoute(
                              expandedRoute === route._id ? null : route._id
                            )
                          }
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition text-xs font-medium flex items-center gap-1"
                        >
                          {expandedRoute === route._id ? (
                            <FaChevronUp className="text-xs" />
                          ) : (
                            <FaChevronDown className="text-xs" />
                          )}
                          Stops
                        </button>
                        <button
                          onClick={() => openEdit(route)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-xs font-medium flex items-center gap-1"
                        >
                          <FaEdit className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleClick(route)}
                          className={`px-3 py-1 rounded transition text-xs font-medium ${
                            route.status === "Active"
                              ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          }`}
                        >
                          {route.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(route)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-xs font-medium flex items-center gap-1"
                        >
                          <FaTrash className="text-xs" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* STOPS EXPANDED ROW */}
                  {expandedRoute === route._id && (
                    <tr key={`${route._id}-stops`} className="bg-blue-50">
                      <td colSpan="7" className="px-6 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Stops
                        </p>
                        {Array.isArray(route.stopsList) &&
                        route.stopsList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {route.stopsList.map((stop, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                              >
                                {i + 1}. {stop}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">
                            No stops configured for this route.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    {filterStatus || search
                      ? "No routes match your filters."
                      : "No routes found. Click 'Add Route' to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}

      {formModal && (
        <RouteFormModal
          isEdit={isEdit}
          form={form}
          setForm={setForm}
          onClose={() => setFormModal(false)}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />
      )}

      {toggleModal && toggleTarget && (
        <ToggleModal
          route={toggleTarget}
          onCancel={() => {
            setToggleModal(false);
            setToggleTarget(null);
          }}
          onConfirm={confirmToggle}
        />
      )}

      {deleteModal && deleteTarget && (
        <DeleteModal
          route={deleteTarget}
          onCancel={() => {
            setDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default RouteManagement;

/* ── STAT CARD ────────────────────────────────────────────────────────────── */

const StatCard = ({ title, value, color = "blue" }) => {
  const colors = {
    blue:   "border-l-blue-500",
    green:  "border-l-green-500",
    red:    "border-l-red-500",
    purple: "border-l-purple-500",
  };
  return (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${colors[color]}`}>
      <p className="text-xs sm:text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

/* ── ROUTE FORM MODAL (ADD / EDIT) ────────────────────────────────────────── */

const RouteFormModal = ({ isEdit, form, setForm, onClose, onSubmit, loading }) => {
  const fields = [
    { label: "Route Name", key: "name", placeholder: "e.g. Route A – North Zone", full: true },
    { label: "Assigned Bus", key: "bus", placeholder: "e.g. BUS-07" },
    { label: "Driver Name", key: "driver", placeholder: "e.g. Ramesh Kumar" },
    { label: "Number of Stops", key: "stops", placeholder: "e.g. 8", type: "number" },
    { label: "Student Count", key: "students", placeholder: "e.g. 142", type: "number" },
    { label: "Start Time", key: "startTime", placeholder: "e.g. 7:00 AM" },
    { label: "End Time", key: "endTime", placeholder: "e.g. 8:15 AM" },
    {
      label: "Stop Names (comma-separated)",
      key: "stopsList",
      placeholder: "Jalupura, Raja Park, C-Scheme...",
      full: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FaRoute className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {isEdit ? "Edit Route" : "Add New Route"}
              </h3>
              <p className="text-sm text-gray-500">
                {isEdit ? "Update route details" : "Create a new transport route"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ label, key, placeholder, type, full }) => (
            <div key={key} className={full ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {label}
              </label>
              <input
                type={type || "text"}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Discard
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            {loading ? "Saving..." : isEdit ? "Update Route" : "Add Route"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── TOGGLE MODAL (SUSPEND / ACTIVATE) ────────────────────────────────────── */

const ToggleModal = ({ route, onCancel, onConfirm }) => {
  const isSuspending = route.status === "Active";
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
              isSuspending ? "bg-yellow-100" : "bg-green-100"
            }`}
          >
            {isSuspending ? "🚫" : "✅"}
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {isSuspending ? "Suspend Route?" : "Activate Route?"}
            </h3>
            <p className="text-sm text-gray-500">{route.name}</p>
          </div>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          {isSuspending
            ? `"${route.name}" will be suspended. The assigned bus and driver will need reassignment.`
            : `"${route.name}" will be reactivated and available for fleet operations.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition text-sm ${
              isSuspending
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSuspending ? "Suspend" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── DELETE MODAL ─────────────────────────────────────────────────────────── */

const DeleteModal = ({ route, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-96 max-w-full mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <FaTrash className="text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Delete Route</h3>
          <p className="text-sm text-gray-500">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-gray-600 mb-6 text-sm">
        Are you sure you want to delete{" "}
        <span className="font-semibold">"{route.name}"</span>? All associated
        stop and assignment data will be permanently removed.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
        >
          Delete Route
        </button>
      </div>
    </div>
  </div>
);
