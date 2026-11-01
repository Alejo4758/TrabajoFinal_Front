import { useEffect, useState } from "react";
import { createCalendarActivity, updateCalendarActivity } from "../../services/calendarService";
import { ACTIVITY_TYPES, ACTIVITY_STATES, combineDateTime, dateKey, timeValue, parseDate, formatTime, fullName, safeText } from "./calendarUtils";
import FormField from "../../components/FormField/FormField";
import Icon from "../../components/Icon/Icon";

const buildInitialForm = (activity, defaultDate) => {
  const start = parseDate (activity?.startDate);
  const end = parseDate (activity?.finishDate);

  return {
    title: safeText (activity?.title),
    type: activity?.type in ACTIVITY_TYPES ? activity.type : "SESSION",
    state: activity?.state in ACTIVITY_STATES ? activity.state : "CONFIRMED",
    userId: activity?.user?.id != null ? String (activity.user.id) : activity?.userId != null ? String (activity.userId) : "",
    date: start ? dateKey (start) : defaultDate,
    startTime: start ? timeValue (start) : "09:00",
    endTime: end ? timeValue (end) : "10:00",
    ubication: safeText (activity?.ubication),
    description: safeText (activity?.description),
  };
};

// Modal de creación / edición. activity = null crea; con activity edita (o reprograma)
export default function ActivityModal ({ activity, defaultDate, clients, holidays, onClose, onSaved }) {
  const editing = Boolean (activity?.id);

  const [form, setForm] = useState (() => buildInitialForm (activity, defaultDate));
  const [errors, setErrors] = useState ({});
  const [serverError, setServerError] = useState ("");
  const [conflict, setConflict] = useState (null);
  const [saving, setSaving] = useState (false);

  useEffect (() => {
    const onKey = event => { if (event.key === "Escape" && !saving) onClose (); };
    window.addEventListener ("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener ("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [saving, onClose]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm (prev => ({ ...prev, [name]: value }));
    setErrors (prev => ({ ...prev, [name]: "" }));
    setServerError ("");
    setConflict (null);
  };

  const validate = () => {
    const found = {};
    if (!form.title.trim ()) found.title = "Ingresá un título";
    const start = combineDateTime (form.date, form.startTime);
    const end = combineDateTime (form.date, form.endTime);
    if (!form.date || !start) found.date = "Elegí una fecha válida";
    if (!form.startTime) found.startTime = "Elegí la hora de inicio";
    if (!form.endTime) found.endTime = "Elegí la hora de fin";
    else if (start && end && end <= start) found.endTime = "La hora de fin debe ser posterior a la de inicio";
    return { found, start, end };
  };

  const save = async force => {
    const { found, start, end } = validate ();
    setErrors (found);
    if (Object.keys (found).length > 0) return;

    // El AT dueño de la agenda sale del token: nunca se envía profileATId
    const payload = {
      title: form.title.trim (),
      type: form.type,
      state: form.state,
      startDate: start.toISOString (),
      finishDate: end.toISOString (),
      ubication: form.ubication.trim () || null,
      description: form.description.trim () || null,
      userId: form.userId ? Number (form.userId) : null,
      ...(force ? { force: true } : {}),
    };

    setSaving (true);
    setServerError ("");

    const result = editing ? await updateCalendarActivity (activity.id, payload) : await createCalendarActivity (payload);

    setSaving (false);

    if (result.warning) {
      setConflict ({ message: result.warning, activity: result.conflictingActivity });
      return;
    }

    if (result.error) {
      setServerError (result.error);
      return;
    }

    onSaved ();
  };

  const handleSubmit = event => {
    event.preventDefault ();
    save (false);
  };

  const holidayName = holidays?.[form.date];
  const conflicting = conflict?.activity;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="activity-modal-title" className="m-0 text-2xl font-bold text-text">
              {editing ? "Editar actividad" : "Agendar actividad"}
            </h2>
            <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar" className="flex-none cursor-pointer rounded-lg p-2 text-text-secondary transition hover:bg-surface-alt hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
              <Icon name="close"/>
            </button>
          </div>

          {serverError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
              {serverError}
            </div>
          )}

          {conflict && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="m-0 font-semibold">Superposición horaria</p>
              <p className="m-0 mt-1">
                {conflict.message}
                {conflicting && (
                  <> Se superpone con <strong>{safeText (conflicting.title) || "otra actividad"}</strong> ({formatTime (conflicting.startDate)} a {formatTime (conflicting.finishDate)}).</>
                )}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => save (true)} disabled={saving} className="cursor-pointer rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60">
                  Guardar de todos modos
                </button>
                <button type="button" onClick={() => { setConflict (null); document.getElementById ("activity-startTime")?.focus (); }} className="cursor-pointer rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100">
                  Cambiar horario
                </button>
              </div>
            </div>
          )}

          <div>
            <FormField id="activity-title" name="title" label="Título" value={form.title} onChange={handleChange} error={errors.title} maxLength={120} placeholder="Sesión con Juan"/>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormField as="select" id="activity-type" name="type" label="Tipo" value={form.type} onChange={handleChange}>
                {Object.entries (ACTIVITY_TYPES).map (([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </FormField>
            </div>
            <div>
              <FormField as="select" id="activity-state" name="state" label="Estado" value={form.state} onChange={handleChange}>
                {Object.entries (ACTIVITY_STATES).map (([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </FormField>
            </div>
          </div>

          <div>
            <FormField as="select" id="activity-userId" name="userId" label="Paciente" required={false} value={form.userId} onChange={handleChange} hint="Dejalo vacío para un recordatorio personal">
              <option value="">Sin paciente</option>
              {clients.map (client => <option key={client.id} value={client.id}>{fullName (client) || `Paciente ${client.id}`}</option>)}
            </FormField>
          </div>

          <div>
            <FormField type="date" id="activity-date" name="date" label="Fecha" value={form.date} onChange={handleChange} error={errors.date}/>
            {holidayName && (
              <p role="status" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Ese día es feriado nacional: {holidayName}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormField type="time" id="activity-startTime" name="startTime" label="Desde" value={form.startTime} onChange={handleChange} error={errors.startTime}/>
            </div>
            <div>
              <FormField type="time" id="activity-endTime" name="endTime" label="Hasta" value={form.endTime} onChange={handleChange} error={errors.endTime}/>
            </div>
          </div>

          <div>
            <FormField id="activity-ubication" name="ubication" label="Ubicación" required={false} value={form.ubication} onChange={handleChange} maxLength={200} placeholder="Domicilio, videollamada..."/>
          </div>

          <div>
            <FormField as="textarea" id="activity-description" name="description" label="Notas" required={false} rows={3} value={form.description} onChange={handleChange} maxLength={500}/>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
