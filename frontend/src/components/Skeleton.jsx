import React from 'react'

export default function Skeleton({ className = 'h-6 rounded bg-white/5', lines = 3 }){
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-white/6 rounded h-4 w-full" />
      ))}
    </div>
  )
}
