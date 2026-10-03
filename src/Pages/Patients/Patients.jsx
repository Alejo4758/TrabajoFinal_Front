import React, { useState } from 'react'
import Navbar from '../../Components/NavBar/NavBar.jsx'
import Patientcard from '../../Components/PatientCard/Patientcard.jsx'
import FormPlan from '../../Components/FormularioPlan/FormPlan.jsx'

const patients = [
  {
    id: 1,
    name: 'María Elena Gómez',
    documentType: 'DNI',
    documentNumber: '36.581.234',
    photo:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Luciano Torres',
    documentType: 'DNI',
    documentNumber: '28.430.119',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Sofía Martínez',
    documentType: 'PASAPORTE',
    documentNumber: 'XJ-983421',
    photo:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
  },
]

export default function Patients() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
              Pacientes
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-800">
              Listado de pacientes
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          {patients.map((patient) => (
            <Patientcard
              key={patient.id}
              patient={patient}
              onOpenPlan={() => setIsPlanModalOpen(true)}
            />
          ))}
        </div>
      </main>

      <FormPlan isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} isEditing={false} />
    </div>
  )
}
