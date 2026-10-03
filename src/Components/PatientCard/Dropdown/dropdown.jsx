import React, { useEffect, useRef, useState } from 'react'

export default function Dropdown({
  options = [
    { label: 'Ver perfil', value: 'profile' },
    { label: 'Editar', value: 'edit' },
    { label: 'Eliminar', value: 'delete', danger: true },
  ],
  onSelect,
  onOpenChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
        onOpenChange?.(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onOpenChange])

  const handleToggle = () => {
    const nextValue = !isOpen
    setIsOpen(nextValue)
    onOpenChange?.(nextValue)
  }

  const handleSelect = (option) => {
    setIsOpen(false)
    onOpenChange?.(false)
    if (onSelect) onSelect(option)
  }

  return (
    <div ref={menuRef} className="relative z-10 inline-block">
      <button
        type="button"
        onClick={handleToggle}
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus:outline-none"
        aria-label="Abrir menú del paciente"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <circle cx="10" cy="4" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="10" cy="16" r="1.6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-2 w-48 origin-top-left overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/70">
          {options.map((option) => (
            <button
              key={option.value || option.label}
              type="button"
              onClick={() => handleSelect(option)}
              className={[
                'relative z-10 flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition',
                option.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
              ].join(' ')}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
