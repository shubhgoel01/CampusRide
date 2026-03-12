import React from "react";
import Modal from "../Modal";
import {
  formatCurrencyFromPaise,
  formatDateOnly,
  getInitial,
} from "../../utils/uiFormatters";

export default function AdminUserDetailsModal({
  user,
  open,
  onClose,
  onRemove,
}) {
  if (!open || !user) return null;

  return (
    <Modal open={true} onClose={onClose} title="User Details">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
            {getInitial(user.fullName)}
          </div>
          <div>
            <h3 className="font-bold text-lg">{user.fullName}</h3>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-400 uppercase">Role</div>
            <div className="font-semibold capitalize">{user.userType}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs text-slate-400 uppercase">Joined</div>
            <div className="font-semibold">
              {formatDateOnly(user.createdAt)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg col-span-2">
            <div className="text-xs text-slate-400 uppercase">Penalty</div>
            <div className="font-semibold text-red-600">
              {formatCurrencyFromPaise(user.penaltyAmount)}
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={() => onRemove(user._id)}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
          >
            Remove User
          </button>
        </div>
      </div>
    </Modal>
  );
}
