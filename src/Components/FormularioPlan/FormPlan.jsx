import { useEffect, useState } from 'react'

const initialObjectives = [
  'Mejorar la regulación emocional del paciente.',
  'Fortalecer las estrategias de afrontamiento frente a situaciones estresantes.',
]

const initialActivities = [
  'Realizar ejercicios de respiración profunda dos veces por semana.',
  'Registrar emociones diarias en un cuaderno de autoobservación.',
]

export default function FormPlan({ isOpen, onClose, isEditing }) {
  const [objectives, setObjectives] = useState(initialObjectives)
  const [activities, setActivities] = useState(initialActivities)
  const [editingObjectiveId, setEditingObjectiveId] = useState(null)
  const [editingActivityId, setEditingActivityId] = useState(null)
  const [editingObjectiveValue, setEditingObjectiveValue] = useState('')
  const [editingActivityValue, setEditingActivityValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setObjectives(initialObjectives)
      setActivities(initialActivities)
      setEditingObjectiveId(null)
      setEditingActivityId(null)
      setEditingObjectiveValue('')
      setEditingActivityValue('')
    }
  }, [isOpen])

  const handleAddObjective = () => {
    setObjectives((prev) => [...prev, `Nuevo objetivo ${prev.length + 1}`])
  }

  const handleDeleteObjective = (indexToDelete) => {
    setObjectives((prev) => prev.filter((_, index) => index !== indexToDelete))

    if (editingObjectiveId === indexToDelete) {
      setEditingObjectiveId(null)
      setEditingObjectiveValue('')
    }
  }

  const handleEditObjectiveStart = (index, value) => {
    setEditingObjectiveId(index)
    setEditingObjectiveValue(value)
  }

  const handleEditObjectiveSave = (index) => {
    const value = editingObjectiveValue.trim()
    if (!value) return

    setObjectives((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
    setEditingObjectiveId(null)
    setEditingObjectiveValue('')
  }

  const handleAddActivity = () => {
    setActivities((prev) => [...prev, `Nueva actividad ${prev.length + 1}`])
  }

  const handleDeleteActivity = (indexToDelete) => {
    setActivities((prev) => prev.filter((_, index) => index !== indexToDelete))

    if (editingActivityId === indexToDelete) {
      setEditingActivityId(null)
      setEditingActivityValue('')
    }
  }

  const handleEditActivityStart = (index, value) => {
    setEditingActivityId(index)
    setEditingActivityValue(value)
  }

  const handleEditActivitySave = (index) => {
    const value = editingActivityValue.trim()
    if (!value) return

    setActivities((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
    setEditingActivityId(null)
    setEditingActivityValue('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
      <section className="mx-4 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Plan terapéutico
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-800">
              {isEditing ? 'Modificar plan terapéutico' : 'Crear nuevo plan'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
          className="p-6"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="planTitle">
                Título del plan
              </label>
              <input
                id="planTitle"
                type="text"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="startDate">
                Fecha de inicio
              </label>
              <input
                id="startDate"
                type="date"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Objetivos terapéuticos</label>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddObjective}
                      className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      + Objetivo
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {objectives.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        No hay objetivos cargados.
                      </li>
                    ) : (
                      objectives.map((objective, index) => (
                        <li
                          key={`${objective}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                          {editingObjectiveId === index ? (
                            <input
                              value={editingObjectiveValue}
                              onChange={(e) => setEditingObjectiveValue(e.target.value)}
                              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                          ) : (
                            <span className="text-sm text-slate-700">{objective}</span>
                          )}

                          <div className="flex shrink-0 gap-2">
                            {editingObjectiveId === index ? (
                              <button
                                type="button"
                                onClick={() => handleEditObjectiveSave(index)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Guardar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditObjectiveStart(index, objective)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Editar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteObjective(index)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Actividades a realizar</label>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                    >
                      + Actividad
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {activities.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        No hay actividades cargadas.
                      </li>
                    ) : (
                      activities.map((activity, index) => (
                        <li
                          key={`${activity}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                        >
                          {editingActivityId === index ? (
                            <input
                              value={editingActivityValue}
                              onChange={(e) => setEditingActivityValue(e.target.value)}
                              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                          ) : (
                            <span className="text-sm text-slate-700">{activity}</span>
                          )}

                          <div className="flex shrink-0 gap-2">
                            {editingActivityId === index ? (
                              <button
                                type="button"
                                onClick={() => handleEditActivitySave(index)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Guardar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditActivityStart(index, activity)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Editar
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(index)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Observaciones / indicaciones
              </label>
              <textarea
                id="notes"
                rows="2"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700"
            >
              Guardar plan
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}