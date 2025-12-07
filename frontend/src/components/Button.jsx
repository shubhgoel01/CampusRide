import React from 'react'

export default function Button({ children, variant = 'primary', onClick, type = 'button', className = '', ...rest }){
  const base = 'px-4 py-2 rounded font-medium transition-transform transition-colors duration-200 ease-out disabled:opacity-50 inline-flex items-center gap-2'
  const focus = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400'
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:brightness-105 hover:-translate-y-0.5',
    secondary: 'bg-white/5 text-white border border-white/6 hover:bg-white/6 hover:-translate-y-0.5',
    danger: 'bg-red-500 text-white hover:brightness-95 hover:-translate-y-0.5'
  }
  const cls = `${base} ${focus} ${variants[variant] || variants.primary} ${className}`
  return <button type={type} onClick={onClick} className={cls} {...rest}>{children}</button>
}
