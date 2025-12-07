import React from 'react'

export default function Badge({ children, tone = 'default', className = '' }){
  const tones = {
    default: 'bg-white/5 text-white',
    success: 'bg-green-600 text-white',
    danger: 'bg-red-500 text-white',
    warn: 'bg-yellow-500 text-black'
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-sm rounded ${tones[tone] || tones.default} ${className}`}>{children}</span>
  )
}
