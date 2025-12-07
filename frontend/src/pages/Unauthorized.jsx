import React from 'react'
import { Link } from 'react-router-dom'

export default function Unauthorized(){
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-2">Access denied</h2>
        <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
        <div className="flex justify-center gap-3">
          <Link to="/home" className="px-4 py-2 bg-indigo-600 text-white rounded">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
