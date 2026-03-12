import React from "react";
import {
  formatCurrencyFromPaise,
  formatDateOnly,
} from "../../utils/uiFormatters";

export default function AdminTransactionsTable({ transactions }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                No transactions found for this period.
              </td>
            </tr>
          )}
          {transactions.map((t) => (
            <tr
              key={t._id}
              className="odd:bg-white even:bg-slate-50/40 hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4">{formatDateOnly(t.createdAt)}</td>
              <td className="px-6 py-4">{t.userName || t.userId}</td>
              <td className="px-6 py-4 font-mono font-medium text-slate-800">
                {formatCurrencyFromPaise(Number(t.amount))}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                  {t.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
