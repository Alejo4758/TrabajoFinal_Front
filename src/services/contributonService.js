// Aportes de la red de apoyo, contra el backend (/api/patients/:patientId/contributions).
//
// Las reglas las aplica el BACKEND con la identidad del token:
//  - Quién escribe sale del token, nunca del cuerpo del pedido (author y viewer se ignoran: quedan en la firma por
//    compatibilidad con los componentes).
//  - Un integrante solo lee y escribe aportes de las secciones que tiene habilitadas (plan, encuentros, evolución).
//  - Solo el autor edita o borra su aporte. Solo el AT del paciente oculta o vuelve a mostrar aportes.
//  - Un aporte oculto no se envía a los demás integrantes; su autor sí lo recibe, marcado como oculto.
//
// Forma de un aporte: { id, patientId, target: { type, id, label }, authorKey: "user:<id>", authorName, authorRole,
// authorRelationship, text, createdAt, editedAt, hiddenAt }

import { apiRequest, fail } from "./apiRequest";
import { CONTRIBUTION_MAX, TARGET_TYPES } from "../utils/boardModel";

export const CHANGE_EVENT = "redat:contributions";

const contributionsPath = (patientId) => `/api/patients/${encodeURIComponent(patientId)}/contributions`;

// Avisa a los otros hilos de la página (cada uno usa su propio useContributions) que recarguen
const notifyChange = (patientId) =>
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { patientId: String(patientId) } }));

// Mismo control que hace el back, para no mandar un pedido que se sabe inválido
const cleanText = (text) => {
  const clean = String(text ?? "").trim();
  if (!clean) throw fail("El aporte no puede estar vacío.", "invalid");
  if (clean.length > CONTRIBUTION_MAX) throw fail(`El aporte puede tener hasta ${CONTRIBUTION_MAX} caracteres.`, "invalid");
  return clean;
};

// El backend ya devuelve solo lo que quien pide puede ver, ordenado del más antiguo al más reciente
export async function listContributions(patientId) {
  const { data } = await apiRequest(contributionsPath(patientId));
  return data ?? [];
}

// data = { target: { type, id, label }, text }. La etiqueta del destino la arma el backend
export async function addContribution(patientId, data) {
  const target = data.target;
  if (!TARGET_TYPES[target?.type]) throw fail("No se puede comentar ese registro.", "invalid");
  const body = { targetType: target.type, targetId: String(target.id), text: cleanText(data.text) };
  const { data: created } = await apiRequest(contributionsPath(patientId), { method: "POST", body });
  notifyChange(patientId);
  return created;
}

export async function editContribution(patientId, id, text) {
  const { data } = await apiRequest(`${contributionsPath(patientId)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { text: cleanText(text) },
  });
  notifyChange(patientId);
  return data;
}

export async function deleteContribution(patientId, id) {
  try {
    await apiRequest(`${contributionsPath(patientId)}/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (err) {
    // Si ya no existe, el resultado es el mismo
    if (err.code !== "not_found") throw err;
  }
  notifyChange(patientId);
  return { ok: true };
}

// Solo el AT responsable del paciente. El backend registra quién y cuándo
export async function setContributionHidden(patientId, id, hidden) {
  const { data } = await apiRequest(`${contributionsPath(patientId)}/${encodeURIComponent(id)}/visibility`, {
    method: "PATCH",
    body: { hidden: Boolean(hidden) },
  });
  notifyChange(patientId);
  return data;
}

// "Visto por última vez": es solo de este navegador, para el contador de aportes nuevos
const seenKey = (patientId, viewerKey) => `redat_contrib_seen:${patientId}:${viewerKey}`;

export function getLastSeen(patientId, viewerKey) {
  try {
    return localStorage.getItem(seenKey(patientId, viewerKey)) || "";
  } catch {
    return "";
  }
}

export function markSeen(patientId, viewerKey) {
  try {
    localStorage.setItem(seenKey(patientId, viewerKey), new Date().toISOString());
  } catch { /* sin almacenamiento disponible: el contador no se guarda, nada más */ }
}
