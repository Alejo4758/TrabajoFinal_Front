import { useState } from "react";
import { createPatient, updatePatient } from "../../services/patientService";
import { useAuth } from "../../hooks/useAuth";
import { PATIENT_DIAGNOSIS_MAX, PATIENT_NAME_MAX, PATIENT_NOTES_MAX, RELATIONSHIP_LABELS } from "../../utils/constants";
import FormField from "../FormField/FormField";

const pad = n => String (n).padStart (2, "0");

// Hoy como "YYYY-MM-DD" en hora local, para comparar con el valor del campo de fecha
const todayKey = () => {
  const today = new Date ();
  return `${today.getFullYear ()}-${pad (today.getMonth () + 1)}-${pad (today.getDate ())}`;
};

// Texto de cada opción del vínculo, dicho desde quien completa el formulario
const relationshipOption = (value, label) => {
  if (value === "SELF") return "Soy yo quien lo va a recibir";
  if (value === "OTHER") return "Tengo otro vínculo con la persona";
  return `Soy su ${label.toLowerCase ()}`;
};

const buildInitialForm = patient => ({
  relationship: patient?.relationship ?? "",
  name: patient?.name ?? "",
  lastName: patient?.lastName ?? "",
  dateOfBirth: patient?.dateOfBirth ?? "",
  diagnosis: patient?.diagnosis ?? "",
  notes: patient?.notes ?? "",
});

// Formulario para cargar o editar a una persona acompañada. patient = null crea; con patient edita.
// Lo usan la página "Personas acompañadas" y los modales de solicitud (para cargar a alguien sin salir del modal).
// Al guardar llama a onSaved con la persona tal como la devuelve el backend
export default function PatientForm ({ patient = null, idPrefix = "patient", onSaved, onCancel }) {
  const { user, token } = useAuth ();
  const editing = Boolean (patient?.id);

  const [form, setForm] = useState (() => buildInitialForm (patient));
  const [errors, setErrors] = useState ({});
  const [serverError, setServerError] = useState ("");
  const [saving, setSaving] = useState (false);

  const handleChange = event => {
    const { name, value } = event.target;

    setForm (prev => {
      const next = { ...prev, [name]: value };

      // Si la persona acompañada es el propio titular de la cuenta, se completan su nombre y apellido (los puede corregir)
      if (name === "relationship" && value === "SELF" && !prev.name.trim () && !prev.lastName.trim ()) {
        next.name = user?.name ?? "";
        next.lastName = user?.lastName ?? "";
      }

      return next;
    });
    setErrors (prev => ({ ...prev, [name]: "" }));
    setServerError ("");
  };

  // Mismas validaciones que el backend, para avisar sin esperar la respuesta
  const validate = () => {
    const found = {};
    if (!form.relationship) found.relationship = "Indicá qué vínculo tenés con la persona";
    if (!form.name.trim ()) found.name = "Ingresá el nombre";
    if (!form.lastName.trim ()) found.lastName = "Ingresá el apellido";
    if (!form.dateOfBirth) found.dateOfBirth = "Ingresá la fecha de nacimiento";
    else if (form.dateOfBirth > todayKey ()) found.dateOfBirth = "La fecha de nacimiento no puede ser futura";
    return found;
  };

  const handleSubmit = async event => {
    event.preventDefault ();

    const found = validate ();
    setErrors (found);
    const firstInvalid = Object.keys (found)[0];
    if (firstInvalid) {
      document.getElementById (`${idPrefix}-${firstInvalid}`)?.focus ();
      return;
    }

    setSaving (true);
    setServerError ("");

    const result = editing ? await updatePatient (patient.id, form, token) : await createPatient (form, token);

    setSaving (false);

    if (result.error || !result.data) {
      setServerError (result.error || "No se pudieron guardar los datos. Intentá nuevamente");
      return;
    }

    onSaved (result.data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
          {serverError}
        </div>
      )}

      <div>
        <FormField as="select" id={`${idPrefix}-relationship`} name="relationship" label="¿Qué vínculo tenés con la persona que va a recibir el acompañamiento?" value={form.relationship} onChange={handleChange} error={errors.relationship}>
          <option value="">Seleccioná una opción</option>
          {Object.entries (RELATIONSHIP_LABELS).map (([value, label]) => <option key={value} value={value}>{relationshipOption (value, label)}</option>)}
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormField id={`${idPrefix}-name`} name="name" label="Nombre" value={form.name} onChange={handleChange} error={errors.name} maxLength={PATIENT_NAME_MAX}/>
        </div>
        <div>
          <FormField id={`${idPrefix}-lastName`} name="lastName" label="Apellido" value={form.lastName} onChange={handleChange} error={errors.lastName} maxLength={PATIENT_NAME_MAX}/>
        </div>
      </div>

      <div>
        <FormField type="date" id={`${idPrefix}-dateOfBirth`} name="dateOfBirth" label="Fecha de nacimiento" value={form.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth}/>
      </div>

      <div>
        <FormField id={`${idPrefix}-diagnosis`} name="diagnosis" label="Diagnóstico (opcional)" required={false} value={form.diagnosis} onChange={handleChange} error={errors.diagnosis} maxLength={PATIENT_DIAGNOSIS_MAX} placeholder="Ej.: Trastorno del Espectro Autista" hint="Solo lo ve el profesional que acompaña a la persona"/>
      </div>

      <div>
        <FormField as="textarea" id={`${idPrefix}-notes`} name="notes" label="Información adicional (opcional)" required={false} rows={3} value={form.notes} onChange={handleChange} error={errors.notes} maxLength={PATIENT_NOTES_MAX} placeholder="Rutinas, escuela, otros profesionales que la atienden..." hint={`${form.notes.length}/${PATIENT_NOTES_MAX} caracteres`}/>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar persona"}
        </button>
      </div>
    </form>
  );
}
