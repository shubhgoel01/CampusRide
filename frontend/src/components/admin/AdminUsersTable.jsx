import React from "react";
import StatusBadge from "./StatusBadge";
import { formatCurrencyFromPaise, getInitial } from "../../utils/uiFormatters";

export default function AdminUsersTable({ users, onViewUser }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Penalty</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {getInitial(u.fullName)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {u.fullName || u.userName}
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {u._id.slice(-6)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={u.userType || "user"} />
              </td>
              <td className="px-6 py-4 text-xs font-mono">
                {u.penaltyAmount > 0 ? (
                  <span className="text-red-600 font-bold">
                    {formatCurrencyFromPaise(u.penaltyAmount)}
                  </span>
                ) : (
                  <span className="text-slate-300">₹0.00</span>
                )}
              </td>
              <td className="px-6 py-4">{u.email || u.phoneNumber || "-"}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onViewUser(u)}
                  className="text-primary hover:text-primary-dark font-medium text-xs"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
