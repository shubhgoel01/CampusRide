import React from 'react'

export default function Table({ columns = [], data = [] }){
  return (
    <div className="overflow-x-auto hide-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {columns.map((c, idx) => (
              <th key={idx} className="px-3 py-2 text-sm text-gray-400">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="border-t">
              {columns.map((c, cIdx) => (
                <td key={cIdx} className="px-3 py-2 text-sm text-gray-200">{c.render ? c.render(row) : row[c.accessor]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
