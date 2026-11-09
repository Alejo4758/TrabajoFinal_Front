import { fullName } from "../../utils/utils";
import FormField from "../FormField/FormField";

const describePatient = patient => `${fullName (patient) || `Persona ${patient.id}`}${patient.relationship === "SELF" ? " (yo)" : ""}`;

// Selector de "¿para quién es?" de los modales de solicitud y de entrevista: lista las personas a cargo del usuario
// y ofrece cargar una nueva. El alta la resuelve el modal (muestra PatientForm) cuando se llama a onAdd
export default function PatientPicker ({ id, name = "patientId", label, patients, loading, loadError, value, onChange, onAdd, error }) {
  if (loading) return <p className="m-0 text-sm text-text-secondary">Cargando personas...</p>;

  if (loadError) return <p role="alert" className="m-0 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{loadError}</p>;

  // Primera vez: todavía no hay nadie cargado, así que no hay nada para elegir
  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="m-0 text-sm font-medium text-text">{label}</p>
        <p className="m-0 mt-1 text-sm text-text-secondary">
          Todavía no cargaste a nadie. Contanos quién va a recibir el acompañamiento: puede ser un familiar o vos
        </p>
        <button id={id} type="button" onClick={onAdd} className="mt-3 cursor-pointer rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
          Cargar persona
        </button>
        {error && <p role="alert" className="m-0 mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <FormField as="select" id={id} name={name} label={label} value={value} onChange={onChange} error={error}>
        <option value="">Seleccioná una persona</option>
        {patients.map (patient => <option key={patient.id} value={patient.id}>{describePatient (patient)}</option>)}
      </FormField>
      <button type="button" onClick={onAdd} className="mt-2 cursor-pointer text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/30">
        + Cargar otra persona
      </button>
    </div>
  );
}
