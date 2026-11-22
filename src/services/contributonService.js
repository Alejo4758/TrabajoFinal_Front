// IMPORTANTE: por ahora SIMULA el backend guardando en localStorage (clave "redat_mock_contributions"), igual que la red
// de apoyo. Cada función tiene un TODO con el endpoint propuesto.
//
// Reglas que tiene que aplicar el BACKEND (el frontend no alcanza como control):
//  - Quién escribe sale del token, nunca del cuerpo del pedido.
//  - Un integrante solo puede leer y escribir aportes de las secciones que tiene habilitadas (plan, encuentros, evolución).
//    Si el AT le quita una sección, deja de ver también los aportes de esa sección.
//  - Solo el autor edita o borra su aporte. Solo el AT del paciente oculta o vuelve a mostrar aportes ajenos.
//  - Un aporte oculto no se envía a los demás integrantes; su autor sí lo recibe, marcado como oculto.

import { CONTRIBUTION_MAX, TARGET_TYPES, sectionOf } from "../utils/boardModel";

const KEY = "redat_mock_contributions";
export const CHANGE_EVENT = "redat:contributions";

const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message, code) => Object.assign(new Error(message), { code });
const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const samePatient = (item, patientId) => String(item.patientId) === String(patientId);

const read = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(stored?.items)) return stored;
  } catch { /* datos dañados: se arranca de cero */ }
  return { items: [] };
};

const write = (db, patientId) => {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { patientId: String(patientId) } }));
};

const cleanText = (text) => {
  const clean = String(text ?? "").trim();
  if (!clean) throw fail("El aporte no puede estar vacío.", "invalid");
  if (clean.length > CONTRIBUTION_MAX) throw fail(`El aporte puede tener hasta ${CONTRIBUTION_MAX} caracteres.`, "invalid");
  return clean;
};

const visibleTo = (viewer) => (item) => {
  if (viewer.isAT) return true;
  if (!(viewer.sections ?? []).includes(sectionOf(item.target))) return false;
  return !item.hiddenAt || item.authorKey === viewer.key;
};

export async function listContributions(patientId, viewer) {
  // TODO (backend): GET `${API_URL}/api/patients/${patientId}/contributions` con Authorization: Bearer <token>.
  // El backend decide qué devolver según el rol y los accesos de quien pide (ver reglas arriba).
  await wait();
  return read().items
    .filter((item) => samePatient(item, patientId))
    .filter(visibleTo(viewer))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// data = { target: { type, id, label }, text }. author = { key, name, role, relationship? }
export async function addContribution(patientId, data, author, viewer) {
  // TODO (backend): POST `${API_URL}/api/patients/${patientId}/contributions` con { targetType, targetId, text }.
  // El backend valida que el registro exista, que sea de ese paciente y que quien escribe tenga acceso a esa sección.
  await wait(400);
  const target = data.target;
  if (!TARGET_TYPES[target?.type]) throw fail("No se puede comentar ese registro.", "invalid");
  if (!viewer.isAT && !(viewer.sections ?? []).includes(sectionOf(target))) {
    throw fail("No tenés acceso a esta sección del acompañamiento.", "forbidden");
  }
  const db = read();
  const item = {
    id: newId(),
    patientId,
    target: { type: target.type, id: String(target.id), label: target.label ?? "" },
    authorKey: author.key,
    authorName: author.name,
    authorRole: author.role,
    authorRelationship: author.relationship ?? "",
    text: cleanText(data.text),
    createdAt: new Date().toISOString(),
    editedAt: null,
    hiddenAt: null,
  };
  db.items.push(item);
  write(db, patientId);
  return item;
}

export async function editContribution(patientId, id, text, viewer) {
  // TODO (backend): PATCH `${API_URL}/api/patients/${patientId}/contributions/${id}` con { text }. Solo el autor.
  await wait(400);
  const db = read();
  const item = db.items.find((c) => c.id === id && samePatient(c, patientId));
  if (!item) throw fail("Ese aporte ya no existe.", "not_found");
  if (item.authorKey !== viewer.key) throw fail("Solo quien escribió el aporte puede editarlo.", "forbidden");
  item.text = cleanText(text);
  item.editedAt = new Date().toISOString();
  write(db, patientId);
  return item;
}

export async function deleteContribution(patientId, id, viewer) {
  // TODO (backend): DELETE `${API_URL}/api/patients/${patientId}/contributions/${id}`. Solo el autor.
  await wait(400);
  const db = read();
  const item = db.items.find((c) => c.id === id && samePatient(c, patientId));
  if (!item) return { ok: true };
  if (item.authorKey !== viewer.key) throw fail("Solo quien escribió el aporte puede eliminarlo.", "forbidden");
  db.items = db.items.filter((c) => c !== item);
  write(db, patientId);
  return { ok: true };
}

export async function setContributionHidden(patientId, id, hidden, viewer) {
  // TODO (backend): PATCH `${API_URL}/api/patients/${patientId}/contributions/${id}/visibility` con { hidden }.
  // Solo el AT responsable del paciente. Conviene registrar quién y cuándo, para auditoría.
  await wait(300);
  if (!viewer.isAT) throw fail("Solo el acompañante puede ocultar aportes.", "forbidden");
  const db = read();
  const item = db.items.find((c) => c.id === id && samePatient(c, patientId));
  if (!item) throw fail("Ese aporte ya no existe.", "not_found");
  item.hiddenAt = hidden ? new Date().toISOString() : null;
  write(db, patientId);
  return item;
}

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

// Atajo para la consola durante el desarrollo: resetRedATContributions()
if (import.meta.env?.DEV) {
  globalThis.resetRedATContributions = () => {
    localStorage.removeItem(KEY);
    Object.keys(localStorage).filter((k) => k.startsWith("redat_contrib_seen:")).forEach((k) => localStorage.removeItem(k));
    location.reload();
  };
}