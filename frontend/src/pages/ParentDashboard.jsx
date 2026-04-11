import React from 'react'
import { useNavigate } from "react-router-dom";
import {FaArrowLeft} from "react-icons/fa";

const ParentDashboard = () => {
    const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  return (
    <div>
      {/* 🔙 BACK BUTTON */}
            {isMobile && (
                <div className="pt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                       bg-white shadow-sm border border-slate-100
                       text-sm font-bold text-slate-600 active:scale-95 transition-transform mb-2.5"
                >
                  <FaArrowLeft size={16} />
                  Back
                </button>
              </div>
            )}
      ParentDashboard

      </div>
  )
}

export default ParentDashboard