import React, { useEffect, useState } from 'react'

export default function Card({ children, className = '' }){
  const [visible, setVisible] = useState(false)
  useEffect(()=>{
    const t = setTimeout(()=> setVisible(true), 20)
    return ()=> clearTimeout(t)
  },[])
  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/6 rounded-lg p-4 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className} card-entrance ${visible ? 'card-entrance--visible' : ''}` }>
      {children}
    </div>
  )
}
