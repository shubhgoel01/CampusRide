import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ children, open, onClose, title, footer }){
  const [show, setShow] = useState(false)

  useEffect(()=>{
    if(open){
      // trigger entry animation
      setShow(false)
      // next tick
      const t = setTimeout(()=> setShow(true), 10)
      return ()=> clearTimeout(t)
    }else{
      setShow(false)
    }
  }, [open])

  if(!open) return null

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div role="dialog" aria-modal="true" className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-2xl p-4 transform transition-all duration-200 max-h-[90vh] overflow-auto hide-scrollbar ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-600 dark:text-gray-300">Close</button>
        </div>
        <div className="mb-4">{children}</div>
        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
