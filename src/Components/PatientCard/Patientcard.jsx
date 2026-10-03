import React, { useState } from 'react'
import Dropdown from './Dropdown/dropdown.jsx'

export default function Patientcard({ patient, onOpenPlan }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const photo =
    patient?.photo ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80'

  const dropdownOptions = [
    { label: 'Plan terapéutico', value: 'plan' },
    { label: 'Objetivos', value: 'objectives', secondary: true },
    { label: 'Actividades', value: 'activities', secondary: true },
    { label: 'Ver perfil', value: 'profile' },
    { label: 'Editar', value: 'edit' },
    { label: 'Eliminar', value: 'delete', danger: true },
  ]

  return (
    <article
      className={[
        'relative flex items-center justify-between gap-4 overflow-visible rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200',
        isMenuOpen ? 'z-20 -translate-y-0.5 shadow-md' : 'z-0 hover:z-10 hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img src={photo} alt={patient?.name || 'Paciente'} className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-800">
            {patient?.name || 'Nombre del paciente'}
          </h2>

          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-500">Tipo:</span> {patient?.documentType || 'DNI'}
            </p>
            <p>
              <span className="font-medium text-slate-500">N° documento:</span>{' '}
              {patient?.documentNumber || '36.581.234'}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <Dropdown
          options={dropdownOptions}
          onOpenChange={setIsMenuOpen}
          onSelect={(option) => {
            if (option.value === 'plan' || option.value === 'objectives' || option.value === 'activities') {
              onOpenPlan?.()
            }
          }}
        />
      </div>
    </article>
  )
}
