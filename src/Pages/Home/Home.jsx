import Navbar from '../../Components/NavBar/NavBar.jsx'
import React from 'react'
import FormPlan from '../../Components/FormularioPlan/FormPlan.jsx'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <div>
      <Navbar />

      <div className="p-6">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700"
        >
          Nuevo plan terapéutico
        </button>
      </div>

      <FormPlan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={false}
      />
    </div>
  )
}
