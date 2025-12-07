import React from 'react'
import { motion } from 'framer-motion'

const steps = [
  { id: 1, emoji: '1️⃣', title: 'Sign Up / Log In', body: 'Create your account or log in with your college email.' },
  { id: 2, emoji: '📍', title: 'Check Cycles', body: 'View available cycles near you on the map or list.' },
  { id: 3, emoji: '📅', title: 'Book a Ride', body: 'Select start & destination points (add round trip if needed) and confirm booking.' },
  { id: 4, emoji: '▶️', title: 'Start Ride', body: 'Begin your ride immediately after booking.' },
  { id: 5, emoji: '⛔', title: 'End Ride', body: 'Stop your ride on reaching the destination to see time and distance.' },
  { id: 6, emoji: '💳', title: 'Pay / Clear Penalties', body: 'Clear any charges or penalties before your next booking.' },
  { id: 7, emoji: '📜', title: 'View History', body: 'Track past rides and payments in your profile.' }
]

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } }
}

export default function HowItWorks(){
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(180deg,#E6F3FF 0%, #FFFFFF 100%)' }}>
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">🚴‍♂️ How to Use CampusRide</h1>
          <p className="mt-2 text-sm text-slate-600">Follow these simple steps to start your ride.</p>
        </header>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {steps.map((s, idx) => (
            <motion.div key={s.id} variants={item} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl">{s.emoji}</div>
              <div>
                <div className="font-semibold text-slate-900">{s.title}</div>
                <div className="mt-1 text-sm text-slate-600">{s.body}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <footer className="mt-10 text-center text-sm text-slate-500">CampusRide — Ride Smart. Ride Free.</footer>
      </div>
    </div>
  )
}
