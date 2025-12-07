import React, { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from './Icons'

export default function DarkModeToggle(){
  const [isDark, setIsDark] = useState(() => {
    try{
      const saved = localStorage.getItem('campusride:theme')
      if(saved) return saved === 'dark'
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }catch(e){ return false }
  })

  useEffect(()=>{
    try{
      if(isDark) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('campusride:theme', isDark ? 'dark' : 'light')
    }catch(e){}
  },[isDark])

  const toggle = ()=> setIsDark(d => !d)

  return (
    <button onClick={toggle} aria-label="Toggle color theme" className="p-2 rounded bg-white/10 hover:bg-white/20 transition">
      {isDark ? <SunIcon className="h-5 w-5 text-yellow-300" /> : <MoonIcon className="h-5 w-5 text-indigo-200" />}
    </button>
  )
}
