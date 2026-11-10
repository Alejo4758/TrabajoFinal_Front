// Servicio de pacientes (las personas que reciben el acompañamiento). Tiene dos partes:
//  - Titular de la cuenta (rol CLIENT): las personas a su cargo. Devuelven { status, data, error }, igual que modalRequestService
//  - Acompañante (rol AT): el detalle de un paciente que acompaña. getPatient lanza un Error con el mensaje para mostrar, igual que getATDashboard
// El titular y el acompañante salen siempre del token: nunca se manda un id de usuario

import { RELATIONSHIP_LABELS, TREATMENT_STATUS_LABELS } from "../utils/constants";
import { ageFromDate, formatRelativeTime, fullName } from "../utils/utils";
import { getSessions } from "./sessionService";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

const ACTIVITY_TYPES = {
  SESSION: "Sesión",
  INTERVIEW: "Entrevista",
  MEETING: "Reunión",
  OTHER: "Recordatorio",
};

// Hace el pedido autenticado y normaliza la respuesta a { status, data, error }
const request = async (path, token, options = {}) => {
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para continuar" };

  try {
    const response = await fetch (`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get ("content-type") || "";

    const responseBody = contentType.includes ("application/json") ? await response.json () : null;

    if (response.ok) return { status: response.status, data: responseBody?.data ?? responseBody, error: null };

    return { status: response.status, data: null, error: responseBody?.message || responseBody?.error || `Error de backend: ${response.status}` };
  }
  catch {
    return { status: null, data: null, error: "Error de conexión con el backend. Intentá nuevamente" };
  }
};

// Solo se mandan los campos del formulario, ya recortados. Los opcionales vacíos van como null para que el backend los borre
const toPayload = patient => ({
  name: patient.name.trim (),
  lastName: patient.lastName.trim (),
  dateOfBirth: patient.dateOfBirth,
  relationship: patient.relationship,
  diagnosis: patient.diagnosis?.trim () || null,
  notes: patient.notes?.trim () || null,
});

// ---------- Titular de la cuenta ----------

// Personas a cargo del usuario logueado. Cada una trae sus acompañamientos (treatments) con el nombre del profesional
export const getMyPatients = async token => request ("/api/patients", token);

// patient = { name, lastName, dateOfBirth: "YYYY-MM-DD", relationship, diagnosis, notes }
export const createPatient = async (patient, token) =>
  request ("/api/patients", token, { method: "POST", body: JSON.stringify (toPayload (patient)) });

export const updatePatient = async (patientId, patient, token) =>
  request (`/api/patients/${encodeURIComponent (patientId)}`, token, { method: "PATCH", body: JSON.stringify (toPayload (patient)) });

// ---------- Acompañante ----------

const pad = n => String (n).padStart (2, "0");

const parseDate = value => {
  const date = value ? new Date (value) : null;
  return date && !Number.isNaN (date.getTime ()) ? date : null;
};

// Día y hora locales de una fecha, con la forma que usan las pestañas del paciente
const localDay = date => `${date.getFullYear ()}-${pad (date.getMonth () + 1)}-${pad (date.getDate ())}`;

const localTime = date => `${pad (date.getHours ())}:${pad (date.getMinutes ())}`;

// Convierte la respuesta del backend a la forma que muestran PatientDetail y sus pestañas
const toPatientDetail = (data, sessions) => {
  const startDate = parseDate (data?.treatment?.startDate);
  const lastActivity = parseDate (data?.lastActivity);
  const nextMeeting = parseDate (data?.nextMeeting?.startDate);
  const coverage = [...(data?.case?.socialPrograms ?? []), ...(data?.case?.otherCoverage ? ["Otra o ninguna"] : [])];

  return {
    id: data.id,
    name: fullName (data),
    age: ageFromDate (data.dateOfBirth),
    diagnosis: data.diagnosis ?? "",
    notes: data.notes ?? "",
    status: TREATMENT_STATUS_LABELS[data?.treatment?.status] ?? "Activo",
    startDate: startDate ? localDay (startDate) : "",
    lastActivity: lastActivity ? formatRelativeTime (lastActivity) : "Sin actividad",
    nextMeeting: nextMeeting ? { date: localDay (nextMeeting), time: localTime (nextMeeting), type: ACTIVITY_TYPES[data.nextMeeting.type] ?? "Encuentro" } : null,
    // Lo que la familia contó en la solicitud de vinculación que dio origen al acompañamiento
    case: {
      description: data?.case?.description ?? "",
      locality: data?.case?.locality ?? "",
      socialProgram: coverage.join (", "),
    },
    // El responsable es el titular de la cuenta. Si el paciente es el propio titular, no hay un responsable aparte
    guardian: data.relationship === "SELF" || !data.tutor ? null : {
      name: fullName (data.tutor),
      relationship: RELATIONSHIP_LABELS[data.relationship] ?? "",
      email: data.tutor.email ?? "",
    },
    plan: data.plan ?? null,
    // Encuentros registrados (la pestaña Evolución se arma con estos mismos datos)
    sessions,
    // Red de apoyo e informes todavía no tienen backend: van vacíos hasta que existan
    objectives: [],
    supportNetwork: [],
    reports: [],
  };
};

// Detalle de un paciente del AT logueado, con su historial de encuentros (se piden en paralelo).
// El backend responde 404 si no tiene un acompañamiento con ese paciente
export const getPatient = async (patientId, token) => {
  if (!token) throw new Error ("Tenés que iniciar sesión para ver al paciente");

  const [data, sessions] = await Promise.all ([getPatientData (patientId, token), getSessions (patientId, token)]);

  return toPatientDetail (data, sessions);
};

const getPatientData = async (patientId, token) => {
  let response;
  try {
    response = await fetch (`${BASE_URL}/api/at/patients/${encodeURIComponent (patientId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  catch {
    throw new Error ("Error de conexión con el backend. Intentá nuevamente");
  }

  const contentType = response.headers.get ("content-type") || "";
  const responseBody = contentType.includes ("application/json") ? await response.json () : null;

  if (!response.ok) throw new Error (responseBody?.message || responseBody?.error || `Error de backend: ${response.status}`);

  return responseBody?.data ?? responseBody;
};
