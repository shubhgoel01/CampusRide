import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Support(){
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-black">💬 Support</h1>
          <p className="mt-2 text-sm text-gray-600">We’re here to help you with any issues.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm p-6 text-black">
          <p className="mb-4">For help, contact our campus operations team at</p>
          <p className="mb-4 font-semibold text-black">support@campusride.local</p>
          <p className="text-sm text-gray-700">If you found an issue with a booking or a cycle, please include your <strong>Booking ID</strong> and a short <strong>description</strong> of the issue.</p>
        </div>

        <div className="mt-6 text-center">
          <button onClick={()=>navigate('/')} className="inline-block px-6 py-2 rounded-full border border-black text-black font-medium transform transition hover:scale-105">Back to Home</button>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">CampusRide Support © 2025</footer>
      </div>
    </div>
  )
}
