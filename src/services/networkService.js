// Servicio de la red de apoyo (invitaciones e integrantes), contra el backend.
//
// Forma de un integrante o invitación (src/utils/networkModel.js):
// { id, patientId, token, name, email, role, relationship, access, status: 'pending' | 'active', invitedAt, expiresAt, acceptedAt }
//
// El token de una invitación solo llega en la respuesta de invitar y de reenviar: el backend guarda únicamente su hash,
// así que en el listado viene null. Para compartir el enlace de una pendiente hay que reenviarla (genera uno nuevo).

import { apiRequest } from './apiRequest';

const networkPath = (patientId) => `/api/at/patients/${encodeURIComponent(patientId)}/network`;

// Si ya no existe, para la pantalla el resultado es el mismo: se saca de la lista
const ignoreNotFound = (err) => {
  if (err.code === 'not_found') return { ok: true };
  throw err;
};

export async function listNetwork(patientId) {
  const { data } = await apiRequest(networkPath(patientId));
  return data ?? [];
}

// Crea una invitación. data = { name?, email, role, relationship?, access: string[] }.
// Devuelve el integrante con el token y emailSent (false si el correo no salió: el enlace se puede compartir a mano)
export async function inviteMember(patientId, data) {
  const body = await apiRequest(`${networkPath(patientId)}/invitations`, { method: 'POST', body: data });
  return { ...body.data, emailSent: body.emailSent !== false };
}

// Renueva el vencimiento y genera un enlace nuevo (el anterior deja de servir)
export async function resendInvitation(patientId, memberId) {
  const body = await apiRequest(`${networkPath(patientId)}/invitations/${encodeURIComponent(memberId)}/resend`, { method: 'POST' });
  return { ...body.data, emailSent: body.emailSent !== false };
}

// Cancela una invitación pendiente o vencida
export async function cancelInvitation(patientId, memberId) {
  return apiRequest(`${networkPath(patientId)}/invitations/${encodeURIComponent(memberId)}`, { method: 'DELETE' })
    .then(() => ({ ok: true }))
    .catch(ignoreNotFound);
}

// Quita a un integrante de la red (pierde el acceso; sus aportes se conservan)
export async function removeMember(patientId, memberId) {
  return apiRequest(`${networkPath(patientId)}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' })
    .then(() => ({ ok: true }))
    .catch(ignoreNotFound);
}

// Cambia qué secciones puede ver un integrante
export async function updateAccess(patientId, memberId, access) {
  const { data } = await apiRequest(`${networkPath(patientId)}/members/${encodeURIComponent(memberId)}`, { method: 'PATCH', body: { access } });
  return data;
}

// ---------------------------------------------------------------------------------------------
// Lado del invitado (páginas públicas: no hay sesión iniciada)
// ---------------------------------------------------------------------------------------------

// Datos mínimos de una invitación: { email, name, role, relationship, access, patientFirstName, atName, expiresAt }.
// Errores con code: 'not_found' | 'expired' (con details.atName) | 'used' | 'rate_limited'
export async function getInvitation(token) {
  const { data } = await apiRequest(`/api/invitations/${encodeURIComponent(token)}`, { auth: false });
  return data;
}

// El invitado crea su cuenta. data = { name, lastName, password, role, relationship }. Devuelve { ok: true, email }.
// Errores con code: los de getInvitation, 'invalid' y 'email_taken' (ya hay una cuenta con ese correo)
export async function acceptInvitation(token, data) {
  const body = await apiRequest(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST', body: data, auth: false });
  return body.data;
}
