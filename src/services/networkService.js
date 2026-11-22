// Servicio de la red de apoyo (invitaciones e integrantes).
// IMPORTANTE: por ahora SIMULA el backend. Los datos de prueba se guardan en localStorage (clave "redat_mock_network")

import { INVITATION_DAYS, defaultAccessFor } from '../utils/networkModel';

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api';
const KEY = 'redat_mock_network';
const DAY = 24 * 60 * 60 * 1000;

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message, code, details) => Object.assign(new Error(message), { code, details });
const newToken = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/-/g, '');
const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const PATIENTS = { 1: 'Juan', 2: 'María', 3: 'Tomás', 4: 'Sofía', 5: 'Lucas', 6: 'Valentina' };

const samePatient = (member, patientId) => String(member.patientId) === String(patientId);

function seedFor(patientId) {
  const now = Date.now();
  const iso = (offset) => new Date(now + offset).toISOString();
  const p = patientId;
  const uid = (n) => `seed_${String(p).replace(/\W/g, '')}_${n}`;
  return [
    { id: uid(1), patientId: p, token: null, name: 'Laura Pérez', email: 'laura.perez@correo.com', role: 'family', relationship: 'Madre', access: defaultAccessFor('family'), status: 'active', invitedAt: iso(-60 * DAY), expiresAt: iso(-53 * DAY), acceptedAt: iso(-59 * DAY) },
    { id: uid(2), patientId: p, token: null, name: 'Marta Giménez', email: 'marta.gimenez@escuela.edu.ar', role: 'education', relationship: 'Docente de grado', access: defaultAccessFor('education'), status: 'active', invitedAt: iso(-40 * DAY), expiresAt: iso(-33 * DAY), acceptedAt: iso(-38 * DAY) },
    { id: uid(3), patientId: p, token: newToken(), name: 'Roberto Pérez', email: 'roberto.perez@correo.com', role: 'family', relationship: 'Padre', access: defaultAccessFor('family'), status: 'pending', invitedAt: iso(-2 * DAY), expiresAt: iso(5 * DAY), acceptedAt: null },
    { id: uid(4), patientId: p, token: newToken(), name: '', email: 'c.ibanez@consultorio.com', role: 'health', relationship: 'Psicopedagoga', access: defaultAccessFor('health'), status: 'pending', invitedAt: iso(-12 * DAY), expiresAt: iso(-5 * DAY), acceptedAt: null },
  ];
}

const emptyDb = () => ({ members: [], seeded: [] });

const read = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(stored?.members) && Array.isArray(stored?.seeded)) return stored;
  } catch { /* si está dañado, se arranca de cero */ }
  const fresh = emptyDb();
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
};
const write = (db) => localStorage.setItem(KEY, JSON.stringify(db));

// Para volver al inicio si borras a todos: resetRedATNetwork()
function readSeeded(patientId) {
  const db = read();
  const key = String(patientId);
  if (!db.seeded.includes(key)) {
    db.seeded.push(key);
    db.members.push(...seedFor(patientId));
    write(db);
  }
  return db;
}

// Atajo para la consola del navegador durante el desarrollo: resetRedATNetwork()
if (import.meta.env?.DEV) {
  globalThis.resetRedATNetwork = () => {
    localStorage.removeItem(KEY);
    location.reload();
  };
}

const isExpired = (member) => member.status === 'pending' && Date.parse(member.expiresAt) < Date.now();
// Lo que ve el AT de cada integrante. El token solo se expone mientras la invitación está pendiente
// (sirve para armar el enlace); de un integrante activo no hay nada que compartir.
const publicView = (member) => ({ ...member, token: member.status === 'pending' ? member.token : null });

export async function listNetwork(patientId) {
  // TODO (backend): GET `${API_URL}/at/patients/${patientId}/network` con Authorization: Bearer <token>
  void API_URL;
  await wait();
  return readSeeded(patientId).members.filter((m) => samePatient(m, patientId)).map(publicView);
}

// Crea una invitación. data = { name?, email, role, relationship?, access: string[] }
export async function inviteMember(patientId, data) {
  // TODO (backend): POST `${API_URL}/at/patients/${patientId}/network/invitations` -> envía el correo con el enlace.
  // Debe responder 409 si el correo ya es integrante o tiene una invitación vigente.
  await wait(600);
  const db = readSeeded(patientId);
  const email = data.email.trim().toLowerCase();
  const existing = db.members.find((m) => samePatient(m, patientId) && m.email.toLowerCase() === email);
  if (existing && !isExpired(existing)) {
    throw fail(existing.status === 'active' ? 'Esa persona ya forma parte de la red de apoyo.' : 'Ya hay una invitación vigente para ese correo.', 'duplicate');
  }
  // Una invitación vencida del mismo correo se reemplaza por la nueva
  db.members = db.members.filter((m) => m !== existing && m.id !== existing?.id);
  const now = Date.now();
  const member = {
    id: newId(), patientId, token: newToken(), name: data.name?.trim() ?? '', email,
    role: data.role, relationship: data.relationship?.trim() ?? '', access: data.access, status: 'pending',
    invitedAt: new Date(now).toISOString(), expiresAt: new Date(now + INVITATION_DAYS * DAY).toISOString(), acceptedAt: null,
  };
  db.members.push(member);
  write(db);
  return publicView(member);
}

// Renueva el vencimiento y genera un enlace nuevo (el anterior deja de servir)
export async function resendInvitation(patientId, memberId) {
  // TODO (backend): POST `${API_URL}/at/patients/${patientId}/network/invitations/${memberId}/resend`
  await wait(500);
  const db = readSeeded(patientId);
  const member = db.members.find((m) => m.id === memberId && samePatient(m, patientId));
  if (!member || member.status !== 'pending') throw fail('La invitación ya no existe.', 'not_found');
  const now = Date.now();
  member.token = newToken();
  member.invitedAt = new Date(now).toISOString();
  member.expiresAt = new Date(now + INVITATION_DAYS * DAY).toISOString();
  write(db);
  return publicView(member);
}

// Cancela una invitación pendiente o vencida
export async function cancelInvitation(patientId, memberId) {
  // TODO (backend): DELETE `${API_URL}/at/patients/${patientId}/network/invitations/${memberId}`
  await wait(400);
  const db = readSeeded(patientId);
  db.members = db.members.filter((m) => !(m.id === memberId && samePatient(m, patientId) && m.status === 'pending'));
  write(db);
  return { ok: true };
}

// Quita a un integrante de la red (pierde el acceso)
export async function removeMember(patientId, memberId) {
  // TODO (backend): DELETE `${API_URL}/at/patients/${patientId}/network/members/${memberId}`
  await wait(400);
  const db = readSeeded(patientId);
  db.members = db.members.filter((m) => !(m.id === memberId && samePatient(m, patientId)));
  write(db);
  return { ok: true };
}

// Cambia qué secciones puede ver un integrante
export async function updateAccess(patientId, memberId, access) {
  // TODO (backend): PATCH `${API_URL}/at/patients/${patientId}/network/members/${memberId}` con { access }
  await wait(400);
  const db = readSeeded(patientId);
  const member = db.members.find((m) => m.id === memberId && samePatient(m, patientId));
  if (!member) throw fail('El integrante ya no existe.', 'not_found');
  member.access = access;
  write(db);
  return publicView(member);
}

// ---------------------------------------------------------------------------------------------
// Lado del invitado (páginas públicas: no hay sesión iniciada)
// ---------------------------------------------------------------------------------------------

// Datos mínimos de una invitación, para mostrarlos antes de crear la cuenta.
// code: 'not_found' | 'expired' | 'used'
export async function getInvitation(token) {
  // TODO (backend): GET `${API_URL}/invitations/${token}` (sin autenticación). Devolver solo lo necesario:
  // el nombre de pila del paciente (no el completo ni datos clínicos), el nombre del AT, el correo y el rol sugerido.
  await wait();
  const member = read().members.find((m) => m.token && m.token === token);
  const atUser = JSON.parse(localStorage.getItem('user') || 'null');
  const atName = [atUser?.name, atUser?.lastName].filter(Boolean).join(' ') || 'Tu acompañante terapéutico';
  if (!member) throw fail('Este enlace de invitación no es válido.', 'not_found');
  const patientFirstName = PATIENTS[member.patientId] ?? 'la persona acompañada';
  if (member.status === 'active') throw fail('Esta invitación ya fue utilizada.', 'used');
  if (isExpired(member)) throw fail('La invitación venció.', 'expired', { atName });
  return { email: member.email, name: member.name, role: member.role, relationship: member.relationship, access: member.access, patientFirstName, atName, expiresAt: member.expiresAt };
}

// El invitado crea su cuenta. data = { name, lastName, password, role, relationship }
export async function acceptInvitation(token, data) {
  // TODO (backend): POST `${API_URL}/invitations/${token}/accept` -> crea el usuario con el rol elegido, marca la
  // invitación como usada (un solo uso) y devuelve { ok: true }. La contraseña se guarda con hash.
  await wait(700);
  const db = read();
  const member = db.members.find((m) => m.token && m.token === token);
  if (!member) throw fail('Este enlace de invitación no es válido.', 'not_found');
  if (member.status === 'active') throw fail('Esta invitación ya fue utilizada.', 'used');
  if (isExpired(member)) throw fail('La invitación venció.', 'expired');
  if (!data.name?.trim() || !data.lastName?.trim() || !data.password || data.password.length < 8) throw fail('Los datos ingresados no son válidos.', 'invalid');
  member.name = `${data.name.trim()} ${data.lastName.trim()}`;
  member.role = data.role;
  member.relationship = data.relationship?.trim() ?? member.relationship;
  member.status = 'active';
  member.acceptedAt = new Date().toISOString();
  // El token NO se borra: la invitación queda marcada como usada y volver a abrir el enlace muestra "ya fue utilizada"
  write(db);
  return { ok: true, email: member.email };
}