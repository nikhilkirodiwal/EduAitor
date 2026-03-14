import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from "react-toastify";


const FeeStructure = () => {

  /* ── state ── */
  const [classes, setClasses]             = useState([]);
  const [feeData, setFeeData]             = useState(null);   // null = not loaded yet
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editingFee, setEditingFee]       = useState(null);   // null = add mode, object = edit mode
  const [formData, setFormData]           = useState({ name: '', amount: '', isOptional: false });
  const [saving, setSaving]               = useState(false);
  const [errors, setErrors]               = useState({});
  // calculate amount for monthly wise drop down
  const [freqFilter, setFreqFilter] =     useState('monthly');

  // for delete coinfirmation dialog state
  const [confirmId, setConfirmId]       = useState(null);   // which fee is pending deletion
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Multiplier map — amount is stored as MONTHLY, multiply to get per-period amount
    const FREQ_MULTIPLIER = {monthly: 1,quarterly:3,'half-yearly': 6,annually:12,};
    const calcAmount = (amount) => amount * FREQ_MULTIPLIER[freqFilter];
    // console.log(freqFilter, FREQ_MULTIPLIER[freqFilter], fee.amount);


  const API = import.meta.env.VITE_API_URL;

 

  /* Fetch all classes for the dropdown */
  const fetchClasses = async () => {
    try {
      const { data } = await axios.get(`${API}/classes/all`);
      setClasses(data.classes);
    } catch {
      console.error('Failed to load classes');
    }
  };

  /* Fetch fee components for a given class (or re-uses selectedClass) */
  const refreshFees = async (classId) => {
    const id = classId || selectedClass;
    if (!id) return;
    try {
      const { data } = await axios.get(`${API}/fee-structure/${id}`);
      setFeeData(data);
    } catch {
      setFeeData({ fees: [] });   // graceful fallback — show empty state
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  /* ────────────────────────────────────────
     CLASS DROPDOWN HANDLER
  ──────────────────────────────────────── */
  const handleClassChange = async (e) => {
    const id = e.target.value;
    setSelectedClass(id);
    setFeeData(null);         // reset so loading state shows
    if (!id) return;
    await refreshFees(id);
  };

  /* ────────────────────────────────────────
     MODAL HELPERS
  ──────────────────────────────────────── */

  /* Open modal in ADD mode */
  const openAdd = () => {
    setEditingFee(null);
    setFormData({ name: '', amount: '', isOptional: false });
    setShowModal(true);
  };

  /* Open modal in EDIT mode — prefill form with existing fee data */
  const openEdit = (fee) => {
    setEditingFee(fee);
    setFormData({ name: fee.name, amount: fee.amount, isOptional: fee.isOptional });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingFee(null); setErrors({});};

  /* ────────────────────────────────────────
     SAVE — handles both ADD and EDIT
  ──────────────────────────────────────── */
  const handleSave = async () => {
    const newErrors = {};
  if (!formData.name.trim())          newErrors.name   = 'Component name is required';
  if (!formData.amount)               newErrors.amount = 'Amount is required';
  if (Number(formData.amount) <= 0)   newErrors.amount = 'Amount must be greater than 0';

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);   // show errors, stop here
    return;
  }

  setErrors({});
    setSaving(true);
    try {
      if (editingFee) {
        /* PUT — update existing fee component */
        await axios.put(
          `${API}/fee-structure/${selectedClass}/fee/${editingFee._id}`,
          { ...formData, amount: Number(formData.amount) }
        );
         toast.success("Fee component updated successfully");
      } else {
        /* POST — add new fee component (backend upserts the FeeStructure doc) */
        await axios.post(
          `${API}/fee-structure/${selectedClass}/fee`,
          { ...formData, amount: Number(formData.amount) }
        );
         toast.success("Fee component added successfully");
      }
      await refreshFees();   // re-fetch to show latest data
      closeModal();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };


    //  DELETE a single fee component
  const handleDelete = async (feeId) => {
   setConfirmId(feeId);
  setConfirmVisible(true);
  };

  const confirmDelete = async () => {
  try {
    await axios.delete(`${API}/fee-structure/${selectedClass}/fee/${confirmId}`);
    await refreshFees();
  } catch (err) { console.error(err); }
  setConfirmVisible(false);
  setConfirmId(null);
   toast.success("Fee component removed successfully");
};

// calculate totals for cards 


const feeCount       = feeData?.fees?.length ?? 0;
const totalAll       = feeData?.fees?.reduce((sum, f) => sum + calcAmount(f.amount), 0) ?? 0;
const totalOptional  = feeData?.fees?.filter(f => f.isOptional).reduce((sum, f) => sum + calcAmount(f.amount), 0) ?? 0;
  const totalMandatory = feeData?.fees?.filter(f => !f.isOptional).reduce((sum, f) => sum + calcAmount(f.amount), 0) ?? 0;

  /* INR currency formatter */
  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Google Fonts + minimal global overrides ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        .fee-row:hover td { background: #faf9fd; }
        .fs-select:focus  { border-color: #5b3faf; outline: none; }
        .fs-input:focus   { border-color: #5b3faf; outline: none; }
      `}</style>

      {/* ══════════════════════════════════════════
          PAGE WRAPPER — full width, small padding
          No max-width so it fills the right panel
      ══════════════════════════════════════════ */}
      <div className="w-full p-4 bg-[#f5f4f0] min-h-screen">

        {/* ── TOP BAR : class dropdown + add button ── */}
        <div className="flex flex-wrap items-end gap-3 mb-4">

          {/* Class selector */}
          <div className="flex flex-col gap-1 flex-1 min-w-45">
            <label className="text-[10px] font-bold tracking-widest uppercase text-[#9b8ea0]">
              Select Class
            </label>
            <div className="relative">
              <select
                className="fs-select w-full appearance-none bg-white border border-[#e2dff0] rounded-lg px-3 py-2 text-sm text-[#1a1625] cursor-pointer transition-colors"
                onChange={handleClassChange}
                value={selectedClass}
              >
                <option value="">— Choose a class —</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
              {/* dropdown chevron icon */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9b8ea0] text-xs">▾</span>
            </div>
          </div>

          {/* Add Component button — only visible when a class is selected */}
          {selectedClass && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#9B4FFF] hover:bg-[#4e3789] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="text-base leading-none">+</span> Add Component
            </button>
          )}
        </div>

        {/* Frequency selector — shown once a class is selected */}
{selectedClass && (
  <div className="flex flex-col gap-1 mt-4 mb-3 ">
    <label className="text-[10px] font-bold tracking-widest uppercase text-[#9b8ea0]">
      View As
    </label>
    <select
      value={freqFilter}
      onChange={e => setFreqFilter(e.target.value)}
      className="fs-select  bg-white border border-[#e2dff0] rounded-lg px-3 py-2 text-sm text-[#1a1625] cursor-pointer"
    >
      <option value="monthly">Monthly</option>
<option value="quarterly">Quarterly</option>
<option value="half-yearly">Half Yearly</option>
<option value="annually">Annually</option>
    </select>
  </div>
)}

        {/* ── SUMMARY CHIPS — shown only when fees exist ── */}
        {feeData && feeCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">

            {/* Total component count */}
            <div className="px-3 py-2 bg-white border border-[#e8e5f5] rounded-lg">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#9b8ea0] mb-0.5">Components</p>
              <p className="font-bold text-[15px] text-[#1a1625]" style={{ fontFamily: 'Outfit, sans-serif' }}>{feeCount}</p>
            </div>

            {/* Sum of mandatory fees only */}
            <div className="px-3 py-2 bg-white border border-[#e8e5f5] rounded-lg">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#9b8ea0] mb-0.5">Mandatory Total</p>
              <p className="font-bold text-[15px] text-[#1a1625]" style={{ fontFamily: 'Outfit, sans-serif' }}>{fmt(totalMandatory)}</p>
            </div>
            {/* Sum of optional  fees only */}
            <div className="px-3 py-2 bg-white border border-[#e8e5f5] rounded-lg">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#9b8ea0] mb-0.5">Optional Total</p>
              <p className="font-bold text-[15px] text-[#1a1625]" style={{ fontFamily: 'Outfit, sans-serif' }}>{fmt(totalOptional)}</p>
            </div>

            {/* Sum of ALL fees (mandatory + optional) — accent colour */}
            <div className="px-3 py-2 bg-[#9B4FFF] rounded-lg">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#c8bce8] mb-0.5">Grand Total</p>
              <p className="font-bold text-[15px] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{fmt(totalAll)}</p>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════
            FEE TABLE CARD
        ══════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-[#e8e5f5] overflow-hidden">

          {/* ── State 1: No class selected yet ── */}
          {!selectedClass && (
            <div className="py-12 text-center">
              <div className="text-3xl opacity-30 mb-2">🏫</div>
              <p className="text-sm font-medium text-[#b0a8c0]">Select a class to view its fee structure</p>
            </div>
          )}

          {/* ── State 2: Loading (class selected but API not yet returned) ── */}
          {selectedClass && feeData === null && (
            <div className="py-10 text-center text-sm text-[#b0a8c0]">Loading…</div>
          )}

          {/* ── State 3: Empty (class exists but has no fee components) ── */}
          {selectedClass && feeData && feeCount === 0 && (
            <div className="py-12 text-center">
              <div className="text-3xl opacity-30 mb-2">📋</div>
              <p className="text-sm font-medium text-[#b0a8c0]">No fee components yet</p>
              <p className="text-xs text-[#c8c4d4] mt-1">Click "Add Component" to get started</p>
            </div>
          )}

          {/* ── State 4: Populated fee table ── */}
          {feeData && feeCount > 0 && (
            <table className="w-full border-collapse">

              {/* Table header */}
              <thead>
                <tr className="bg-[#faf9fd] border-b border-[#f0edf8]">
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold tracking-widest uppercase text-[#b0a8c0] w-10">#</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold tracking-widest uppercase text-[#b0a8c0]">Component</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold tracking-widest uppercase text-[#b0a8c0]">Type</th>
                  <th className="px-4 py-2.5 text-right text-[9px] font-bold tracking-widest uppercase text-[#b0a8c0]">Amount</th>
                  <th className="px-4 py-2.5 text-right text-[9px] font-bold tracking-widest uppercase text-[#b0a8c0]">Actions</th>
                </tr>
              </thead>

              {/* Fee rows — each fee component gets its own row */}
              <tbody>
                {feeData.fees.map((fee, i) => (
                  <tr key={fee._id} className="fee-row border-b border-[#f5f3fc] transition-colors">

                    {/* Serial number */}
                    <td className="px-4 py-3 text-[#c8c4d4] text-xs font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {String(i + 1).padStart(2, '0')}
                    </td>

                    {/* Fee component name */}
                    <td className="px-4 py-3 text-sm font-semibold text-[#1a1625]">
                      {fee.name}
                    </td>

                    {/* Mandatory / Optional badge */}
                    <td className="px-4 py-3">
                      {fee.isOptional ? (
                        <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#e8f5e9] text-[#2e7d32]">
                          Optional
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#fde8e8] text-[#c0392b]">
                          Mandatory
                        </span>
                      )}
                    </td>

                    {/* Formatted INR amount */}
                    <td className="px-4 py-3 text-right font-semibold text-[#3d2b6e] text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {fmt(fee.amount)}
                    </td>

                    {/* Row actions: Edit and Delete */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">

                        {/* Edit — opens modal pre-filled with this fee's data */}
                        <button
                          onClick={() => openEdit(fee)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#f0edf8] text-[#5b3faf] hover:bg-[#e4dff5] transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>

                        {/* Delete — confirms then calls DELETE API */}
                        <button
                          onClick={() => handleDelete(fee._id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#fde8e8] text-[#c0392b] hover:bg-[#fbd5d5] transition-colors cursor-pointer"
                        >
                          🗑 Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Grand total footer — always shown when table has rows */}
              <tfoot>
                <tr className="bg-[#9B4FFF]">
                  <td colSpan={3} className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-[#c8bce8]">
                    Total Fees
                  </td>
                  <td colSpan={2} className="px-4 py-3 text-right text-lg font-bold text-white" >
                   {fmt(totalAll)}
                  </td>
                </tr>
              </tfoot>

            </table>
          )}

        </div>
        {/* end fee card */}

      </div>
      {/* end page wrapper */}
          {/* ── Custom delete confirmation ── */}
{confirmVisible && (
  <div
    className="fixed inset-0 bg-[#1a1625]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setConfirmVisible(false)}   // click backdrop to cancel
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl"
      onClick={e => e.stopPropagation()}       // prevent backdrop click closing when clicking card
    >
      <div className="text-2xl mb-3">🗑</div>
      <h3 className="text-base font-bold text-[#1a1625] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Remove this component?
      </h3>
      <p className="text-sm text-[#7a7085] mb-5">This can't be undone.</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setConfirmVisible(false)}
          className="px-4 py-2 bg-[#f0edf8] text-[#5b3faf] text-sm font-semibold rounded-lg hover:bg-[#e4dff5] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={confirmDelete}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg cursor-pointer"
        >
          Yes, Remove
        </button>
      </div>
    </div>
  </div>
)}

      {/* ══════════════════════════════════════════
          MODAL — Add / Edit a fee component
          Clicking the dim backdrop closes the modal
      ══════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[#1a1625]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">

            {/* Title changes depending on add vs edit mode */}
            <h2 className="text-lg font-bold text-[#1a1625] mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {editingFee ? 'Edit Component' : 'Add Fee Component'}
            </h2>

            {/* Fee component name */}
            <label className="block text-[10px] font-bold tracking-widest uppercase text-[#9b8ea0] mb-1.5">
              Component Name
            </label>
            <input
              className="fs-input w-full border border-[#e2dff0] rounded-lg px-3 py-2 text-sm text-[#1a1625] mb-4 transition-colors"
              placeholder="e.g. Tuition Fee"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            />
              {errors.name && <p className="text-[11px] text-red-500 -mt-3 mb-3">{errors.name}</p>}

            {/* Amount in rupees */}
            <label className="block text-[10px] font-bold tracking-widest uppercase text-[#9b8ea0] mb-1.5">
              Amount (₹)
            </label>
            <input
              className="fs-input w-full border border-[#e2dff0] rounded-lg px-3 py-2 text-sm text-[#1a1625] mb-4 transition-colors"
              type="number"
              placeholder="e.g. 5000"
              min={0}
              value={formData.amount}
              onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
            />
            {errors.amount && <p className="text-[11px] text-red-500 -mt-3 mb-3">{errors.amount}</p>}

            {/* isOptional toggle */}
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOptional}
                onChange={e => setFormData(p => ({ ...p, isOptional: e.target.checked }))}
                className="accent-[#5b3faf] w-3.5 h-3.5"
              />
              <span className="text-sm text-[#2d2540] font-medium">Mark as Optional</span>
            </label>

            {/* Cancel / Save actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#f0edf8] text-[#5b3faf] text-sm font-semibold rounded-lg hover:bg-[#e4dff5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2 bg-[#3d2b6e] text-white text-sm font-semibold rounded-lg hover:bg-[#4e3789] transition-colors cursor-pointer ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving…' : editingFee ? 'Save Changes' : 'Add Component'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default FeeStructure;