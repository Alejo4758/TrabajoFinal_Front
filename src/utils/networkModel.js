// Modelo de la red de apoyo: roles, accesos, estados de una invitación y validaciones.
//
// Forma de un integrante o invitación:
// { id, name, email, role, relationship, access: string[], status: 'pending' | 'active',
//   invitedAt, expiresAt, acceptedAt }      (fechas ISO con hora)

// Rol de la persona dentro del acompañamiento. Los accesos por defecto son una PROPUESTA: la información
// clínica es sensible y el AT los puede ajustar al invitar. Conviene que el equipo los defina.
export const NETWORK_ROLES = [
  { value: 'family', label: 'Familiar o referente', hint: 'Madre, padre, hermano/a, tutor/a...', defaultAccess: ['plan', 'sessions', 'progress', 'reports'] },
  { value: 'education', label: 'Docente o institución educativa', hint: 'Docente de grado, equipo de orientación...', defaultAccess: ['plan', 'progress'] },
  { value: 'health', label: 'Profesional de la salud', hint: 'Psicólogo/a, psicopedagogo/a, médico/a...', defaultAccess: ['plan', 'sessions', 'progress', 'reports'] },
  { value: 'other', label: 'Otra persona', hint: 'Indicá cuál es su vínculo', defaultAccess: ['plan'] },
];

// Secciones del acompañamiento que se pueden habilitar a un integrante
export const ACCESS_SECTIONS = [
  { id: 'plan', label: 'Plan de trabajo', hint: 'Objetivos, actividades y estrategias' },
  { id: 'sessions', label: 'Encuentros', hint: 'Historial y observaciones de cada encuentro' },
  { id: 'progress', label: 'Evolución', hint: 'Cómo avanzan los objetivos' },
  { id: 'reports', label: 'Informes', hint: 'Informes mensuales' },
];

export const INVITATION_DAYS = 7;

export const roleInfo = (value) => NETWORK_ROLES.find((role) => role.value === value);
export const roleLabel = (value) => roleInfo(value)?.label ?? 'Otra persona';
export const defaultAccessFor = (role) => [...(roleInfo(role)?.defaultAccess ?? ['plan'])];
export const accessLabels = (access = []) => ACCESS_SECTIONS.filter((s) => access.includes(s.id)).map((s) => s.label);

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

// 'active' | 'pending' | 'expired'. Una invitación pendiente vencida pasa a 'expired' sola.
export function memberStatus(member, now = Date.now()) {
  if (member.status === 'active') return 'active';
  return Date.parse(member.expiresAt) < now ? 'expired' : 'pending';
}

export const inviteLink = (token, origin = window.location.origin) => `${origin}/invitacion/${token}`;

// "2026-11-20T14:00:00.000Z" -> "20 nov 2026" (hora local)
export const formatInstant = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Valida el formulario de invitación y devuelve { campo: mensaje }
export function validateInvite({ name, email, role, access, consent }) {
  const errors = {};
  if (name.trim().length > 80) errors.name = 'El nombre es demasiado largo.';

  const cleanEmail = email.trim();
  if (!cleanEmail) errors.email = 'Ingresá el correo electrónico de la persona.';
  else if (cleanEmail.length > 254 || cleanEmail.includes('..') || !EMAIL_REGEX.test(cleanEmail)) errors.email = 'Ingresá un correo válido, por ejemplo nombre@dominio.com.';

  if (!role) errors.role = 'Elegí el rol de la persona en el acompañamiento.';
  if (access.length === 0) errors.access = 'Habilitá al menos una sección.';
  if (!consent) errors.consent = 'Necesitás confirmar la autorización para invitar.';
  return errors;
}

// Valida el formulario con el que el invitado crea su cuenta
export function validateAccept({ name, lastName, password, confirmPassword, role, consent }) {
  const errors = {};
  const letters = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;
  if (!name.trim()) errors.name = 'El nombre es obligatorio';
  else if (name.trim().length < 2 || !letters.test(name.trim())) errors.name = 'Ingresá un nombre válido (solo letras)';
  if (!lastName.trim()) errors.lastName = 'El apellido es obligatorio';
  else if (lastName.trim().length < 2 || !letters.test(lastName.trim())) errors.lastName = 'Ingresá un apellido válido (solo letras)';
  if (!role) errors.role = 'Elegí tu rol en el acompañamiento';
  if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (/\s/.test(password)) errors.password = 'La contraseña no puede tener espacios';
  if (!confirmPassword) errors.confirmPassword = 'Repetí tu contraseña';
  else if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
  if (!consent) errors.consent = 'Necesitás aceptar el compromiso de confidencialidad';
  return errors;
}
