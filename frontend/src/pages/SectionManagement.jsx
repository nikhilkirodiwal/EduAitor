import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaLayerGroup,
  FaProjectDiagram,
} from "react-icons/fa";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL;

export default function SectionManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  const [editingSection, setEditingSection] = useState(null);
  const [editingSub, setEditingSub] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [discardConfirm, setDiscardConfirm] = useState(null);

  const [initialData, setInitialData] = useState(null);

  const [sectionForm, setSectionForm] = useState({
    name: "",
    status: "Active",
  });

  const [subForm, setSubForm] = useState({
    sectionId: "",
    name: "",
    status: "Active",
  });

  const hasChanges = (data, initial) =>
    JSON.stringify(data) !== JSON.stringify(initial);

  /* ---------------------------------- API --------------------------------- */

  const fetchSections = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${API}/sections/all`);

      if (data.success) {
        setSections(data.sections);
      }
    } catch (error) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  /* ----------------------------- SECTION CRUD ----------------------------- */

  const saveSection = async () => {
    if (!sectionForm.name.trim()) {
      toast.error("Section name required");
      return;
    }

    try {
      if (editingSection) {
        await axios.put(
          `${API}/sections/update/${editingSection._id}`,
          sectionForm,
        );
        toast.success("Section updated");
      } else {
        await axios.post(`${API}/sections/create`, sectionForm);
        toast.success("Section created");
      }

      resetSection();
      fetchSections();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const deleteSection = async (id) => {
    try {
      await axios.delete(`${API}/sections/delete/${id}`);
      toast.success("Section deleted");
      fetchSections();
    } catch {
      toast.error("Delete failed");
    }
  };

  const openSectionEdit = (sec) => {
    setEditingSection(sec);
    setSectionForm({ name: sec.name, status: sec.status });
    setInitialData({ name: sec.name, status: sec.status });
    setShowSectionModal(true);
  };

  const resetSection = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({ name: "", status: "Active" });
  };

  /* --------------------------- SUBSECTION CRUD --------------------------- */

  const saveSub = async () => {
    if (!subForm.sectionId) {
      toast.error("Select section first");
      return;
    }

    if (!subForm.name.trim()) {
      toast.error("Subsection name required");
      return;
    }

    try {
      if (editingSub) {
        await axios.put(
          `${API}/sections/sub/update/${subForm.sectionId}/${editingSub._id}`,
          subForm,
        );
        toast.success("Subsection updated");
      } else {
        await axios.post(
          `${API}/sections/sub/create/${subForm.sectionId}`,
          subForm,
        );
        toast.success("Subsection created");
      }

      resetSub();
      fetchSections();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const deleteSub = async (sectionId, subId) => {
    try {
      await axios.delete(`${API}/sections/sub/delete/${sectionId}/${subId}`);
      toast.success("Subsection deleted");
      fetchSections();
    } catch {
      toast.error("Delete failed");
    }
  };

  const openSubEdit = (sectionId, sub) => {
    setEditingSub(sub);
    setSubForm({
      sectionId,
      name: sub.name,
      status: sub.status,
    });

    setInitialData({
      sectionId,
      name: sub.name,
      status: sub.status,
    });

    setShowSubModal(true);
  };

  const resetSub = () => {
    setShowSubModal(false);
    setEditingSub(null);
    setSubForm({ sectionId: "", name: "", status: "Active" });
  };

  /* --------------------------- DISCARD HANDLING -------------------------- */

  const handleCloseSection = () => {
    if (editingSection && hasChanges(sectionForm, initialData)) {
      setDiscardConfirm("section");
    } else {
      resetSection();
    }
  };

  const handleCloseSub = () => {
    if (editingSub && hasChanges(subForm, initialData)) {
      setDiscardConfirm("sub");
    } else {
      resetSub();
    }
  };

  /* ---------------------------------- UI --------------------------------- */

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex gap-2 items-center">
          <FaLayerGroup /> Section Management
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setShowSectionModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus /> Section
          </button>

          <button
            onClick={() => {
              if (!sections.length) {
                toast.error("Add section first");
                return;
              }
              setShowSubModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaProjectDiagram /> Sub Section
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Section</th>
              <th>Status</th>
              <th>Subsections</th>
              <th>Student Count</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : sections.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-400">
                  No sections created
                </td>
              </tr>
            ) : (
              sections.map((sec) => (
                <React.Fragment key={sec._id}>
                  <tr key={sec._id} className="border-t text-center">
                    <td className="p-3 font-medium text-left">{sec.name}</td>

                    <td>{sec.status}</td>

                    <td>{sec.subsections.length}</td>

                    <td>0</td>

                    <td className="flex justify-center gap-3 p-3">
                      <button
                        onClick={() => openSectionEdit(sec)}
                        className="text-blue-600"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDelete({
                            type: "section",
                            sectionId: sec._id,
                          })
                        }
                        className="text-red-600"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>

                  {sec.subsections.map((sub) => (
                    <tr key={sub._id} className="bg-gray-50 text-center">
                      <td className="pl-10 text-left">↳ {sub.name}</td>

                      <td>{sub.status}</td>

                      <td>-</td>

                      <td></td>

                      <td className="flex justify-center gap-3 p-3">
                        <button
                          onClick={() => openSubEdit(sec._id, sub)}
                          className="text-blue-600"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDelete({
                              type: "sub",
                              sectionId: sec._id,
                              subId: sub._id,
                            })
                          }
                          className="text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION MODAL */}

      {showSectionModal && (
        <Modal title={editingSection ? "Edit Section" : "Add Section"}>
          <input
            type="text"
            placeholder="Section Name"
            value={sectionForm.name}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, name: e.target.value })
            }
            className="input"
          />

          <select
            value={sectionForm.status}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, status: e.target.value })
            }
            className="input"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <ModalActions cancel={handleCloseSection} save={saveSection} />
        </Modal>
      )}

      {/* SUBSECTION MODAL */}

      {showSubModal && (
        <Modal title={editingSub ? "Edit Sub Section" : "Add Sub Section"}>
          {!editingSub && (
            <select
              value={subForm.sectionId}
              onChange={(e) =>
                setSubForm({ ...subForm, sectionId: e.target.value })
              }
              className="input"
            >
              <option value="">Select Section</option>

              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Sub Section Name"
            value={subForm.name}
            onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
            className="input"
          />

          <select
            value={subForm.status}
            onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
            className="input"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <ModalActions cancel={handleCloseSub} save={saveSub} />
        </Modal>
      )}

      {/* DELETE MODAL */}

      {confirmDelete && (
        <ConfirmModal
          confirm={() => {
            confirmDelete.type === "section"
              ? deleteSection(confirmDelete.sectionId)
              : deleteSub(confirmDelete.sectionId, confirmDelete.subId);

            setConfirmDelete(null);
          }}
          cancel={() => setConfirmDelete(null)}
        />
      )}

      {/* DISCARD MODAL */}

      {discardConfirm && (
        <ConfirmModal
          title="Discard changes?"
          confirm={() => {
            discardConfirm === "section" ? resetSection() : resetSub();
            setDiscardConfirm(null);
          }}
          cancel={() => setDiscardConfirm(null)}
        />
      )}
    </div>
  );
}

/* ----------------------- REUSABLE MODAL COMPONENTS ---------------------- */

const Modal = ({ title, children }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-100 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  </div>
);

const ModalActions = ({ cancel, save }) => (
  <div className="flex justify-end gap-3">
    <button onClick={cancel} className="border px-4 py-2 rounded">
      Cancel
    </button>

    <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">
      Save
    </button>
  </div>
);

const ConfirmModal = ({ title = "Delete this item?", confirm, cancel }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl space-y-4 text-center">
      <h3>{title}</h3>

      <div className="flex gap-4 justify-center">
        <button onClick={cancel} className="border px-4 py-2 rounded">
          Cancel
        </button>

        <button
          onClick={confirm}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);
