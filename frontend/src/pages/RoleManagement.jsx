import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

const RoleManagement = () => {

  const [roles, setRoles] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [status, setStatus] = useState("Active");

  const [originalName, setOriginalName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* Fetch Roles */

  const fetchRoles = async () => {
    try {

      const res = await axios.get(`${API}/roles`);

      setRoles(res.data.data);

    } catch {
      toast.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openAddModal = () => {
    setRoleName("");
    setStatus("Active");
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (role) => {

    setRoleName(role.name);
    setStatus(role.status);

    setOriginalName(role.name);
    setEditingId(role._id);

    setShowModal(true);
  };

  const handleSaveClick = async () => {

    if (!roleName.trim()) {
      toast.error("Role name required");
      return;
    }

    if (editingId) {
      setConfirmUpdate(true);
      return;
    }

    try {

      await axios.post(`${API}/roles`, {
        name: roleName,
        status
      });

      toast.success("Role added successfully");

      fetchRoles();
      setShowModal(false);

    } catch {
      toast.error("Error creating role");
    }

  };

  const confirmUpdateRole = async () => {

    try {

      await axios.put(`${API}/roles/${editingId}`, {
        name: roleName,
        status
      });

      toast.success("Role updated successfully");

      fetchRoles();

      setConfirmUpdate(false);
      setShowModal(false);

    } catch {
      toast.error("Update failed");
    }

  };

  const cancelModal = () => {

    if (editingId && roleName !== originalName) {
      setConfirmDiscard(true);
      return;
    }

    setShowModal(false);
  };

  const discardChanges = () => {
    setConfirmDiscard(false);
    setShowModal(false);
  };

  const deleteRole = async () => {

    try {

      await axios.delete(`${API}/roles/${deleteId}`);

      toast.success("Role deleted");

      fetchRoles();

      setConfirmDelete(false);

    } catch {
      toast.error("Delete failed");
    }

  };

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-semibold text-gray-800">
          Role Management
        </h1>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <FaPlus />
          Add Role
        </button>

      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm">Role</th>
              <th className="text-left px-6 py-3 text-sm">Status</th>
              <th className="text-right px-6 py-3 text-sm">Actions</th>
            </tr>
          </thead>

          <tbody>

            {roles.map((role) => (

              <tr key={role._id} className="border-t hover:bg-gray-50">

                <td className="px-6 py-3">{role.name}</td>
                <td className="px-6 py-3">{role.status}</td>

                <td className="px-6 py-3 flex justify-end gap-4">

                  <button
                    onClick={() => openEditModal(role)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FaEdit />
                  </button>

                  <button
                    onClick={() => {
                      setDeleteId(role._id);
                      setConfirmDelete(true);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Add/Edit Modal */}
      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white rounded-xl p-6 w-full max-w-md">

            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Role" : "Add Role"}
            </h2>

            <label className="text-sm mb-1 block">
              Role Name
            </label>

            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
              className="w-full border px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-400"
            />

            <label className="text-sm mb-1 block">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border px-4 py-2 rounded-lg mb-5"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="flex justify-end gap-3">

              <button
                onClick={cancelModal}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

      {confirmUpdate && (
        <ConfirmModal
          title="Update Role"
          text="Are you sure you want to update this role?"
          confirm={confirmUpdateRole}
          cancel={() => setConfirmUpdate(false)}
        />
      )}

      {confirmDiscard && (
        <ConfirmModal
          title="Discard Changes"
          text="You have unsaved changes. Discard them?"
          confirm={discardChanges}
          cancel={() => setConfirmDiscard(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Role"
          text="Are you sure you want to delete this role?"
          confirm={deleteRole}
          cancel={() => setConfirmDelete(false)}
        />
      )}

    </div>
  );
};

export default RoleManagement;


/* Confirm Modal */

const ConfirmModal = ({ title, text, confirm, cancel }) => {

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-full max-w-sm">

        <h2 className="text-lg font-semibold mb-2">
          {title}
        </h2>

        <p className="text-gray-600 mb-5 text-sm">
          {text}
        </p>

        <div className="flex justify-end gap-3">

          <button
            onClick={cancel}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={confirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Confirm
          </button>

        </div>

      </div>

    </div>

  );
};